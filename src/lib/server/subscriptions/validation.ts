import {
	addCalendarDays,
	calculateNextPeriod,
	compareCalendarDates,
	parseCalendarDate
} from '$lib/subscriptions/calendar.js';
import { parseMoneyCandidate } from '$lib/subscriptions/money.js';
import { normalizeAlertDays } from '$lib/subscriptions/summary.js';
import {
	billingUnits,
	subscriptionStatuses,
	type BudgetWriteRequest,
	type CalendarDate,
	type CreatePaymentRequest,
	type CreateSubscriptionRequest,
	type FieldErrorCode,
	type PaymentWriteRequest,
	type RenewSubscriptionRequest,
	type ReverseRenewalRequest,
	type ScheduleVersion,
	type SubscriptionWrite,
	type UpdateSubscriptionRequest
} from '$lib/subscriptions/types.js';
import { invalidInput } from './errors.js';

type ObjectValue = Record<string, unknown>;
type Errors = Record<string, FieldErrorCode[]>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function object(value: unknown): ObjectValue {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		invalidInput({ _form: ['invalid'] });
	}
	return value as ObjectValue;
}

function addError(errors: Errors, field: string, code: FieldErrorCode): void {
	(errors[field] ??= []).push(code);
}

function nullableText(value: unknown, field: string, max: number, errors: Errors): string | null {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value !== 'string') {
		addError(errors, field, 'invalid');
		return null;
	}
	const trimmed = value.trim().replace(/\s+/g, ' ');
	if (!trimmed) return null;
	if (trimmed.length > max) addError(errors, field, 'too_long');
	return trimmed;
}

function requiredUuid(value: unknown, field: string, errors: Errors): string {
	if (value === null || value === undefined || value === '') {
		addError(errors, field, 'required');
		return '00000000-0000-4000-8000-000000000000';
	}
	if (typeof value !== 'string' || !UUID.test(value)) {
		addError(errors, field, 'invalid');
		return '00000000-0000-4000-8000-000000000000';
	}
	return value.toLowerCase();
}

function uuidOrNull(value: unknown, field: string, errors: Errors): string | null {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value !== 'string' || !UUID.test(value)) {
		addError(errors, field, 'invalid');
		return null;
	}
	return value;
}

function requiredDate(value: unknown, field: string, errors: Errors): CalendarDate {
	const parsed = parseCalendarDate(value);
	if (!parsed) {
		addError(
			errors,
			field,
			value === null || value === undefined || value === '' ? 'required' : 'invalid'
		);
	}
	return parsed ?? ('0001-01-01' as CalendarDate);
}

function bool(value: unknown, field: string, errors: Errors): boolean {
	if (typeof value !== 'boolean') addError(errors, field, 'invalid');
	return value === true;
}

function integer(
	value: unknown,
	field: string,
	min: number,
	max: number,
	errors: Errors
): number {
	if (typeof value !== 'number' || !Number.isInteger(value)) {
		addError(errors, field, 'invalid');
		return min;
	}
	if (value < min || value > max) addError(errors, field, 'out_of_range');
	return value;
}

function parseCurrencyAndMoney(
	input: ObjectValue,
	errors: Errors,
	positive: boolean
): { currency: string; amount: string } {
	const currencyText =
		typeof input.currency === 'string' ? input.currency.trim().toUpperCase() : '';
	const validCurrencyShape = /^[A-Z]{3}$/.test(currencyText);
	if (!validCurrencyShape) addError(errors, 'currency', 'invalid');
	const parsed = parseMoneyCandidate(input.amount, { positive });
	if (!parsed.ok) {
		addError(
			errors,
			'amount',
			parsed.reason === 'fraction_digits'
				? 'fraction_digits'
				: parsed.reason === 'out_of_range'
					? 'out_of_range'
					: 'invalid'
		);
	}
	return { currency: validCurrencyShape ? currencyText : 'USD', amount: parsed.ok ? parsed.value : '0' };
}

function parseSubscriptionWrite(inputValue: unknown): { value: SubscriptionWrite; errors: Errors } {
	const input = object(inputValue);
	const errors: Errors = {};
	const platformId = uuidOrNull(input.platformId, 'platformId', errors);
	const customPlatformName = nullableText(
		input.customPlatformName,
		'customPlatformName',
		255,
		errors
	);
	if ((platformId === null) === (customPlatformName === null)) {
		addError(errors, 'platformId', 'source_xor');
		addError(errors, 'customPlatformName', 'source_xor');
	}
	const planName = nullableText(input.planName, 'planName', 120, errors);
	const accountLabel = nullableText(input.accountLabel, 'accountLabel', 120, errors);
	const { currency, amount } = parseCurrencyAndMoney(input, errors, false);
	const billingUnit = billingUnits.includes(input.billingUnit as never)
		? (input.billingUnit as SubscriptionWrite['billingUnit'])
		: 'MONTH';
	if (!billingUnits.includes(input.billingUnit as never)) {
		addError(errors, 'billingUnit', 'invalid');
	}
	const intervalMax = billingUnit === 'DAY' ? 365 : billingUnit === 'MONTH' ? 120 : 20;
	const billingInterval = integer(
		input.billingInterval,
		'billingInterval',
		1,
		intervalMax,
		errors
	);
	const currentPeriodStart = requiredDate(input.currentPeriodStart, 'currentPeriodStart', errors);
	const currentPeriodEnd = requiredDate(input.currentPeriodEnd, 'currentPeriodEnd', errors);
	if (compareCalendarDates(currentPeriodEnd, currentPeriodStart) < 0) {
		addError(errors, 'currentPeriodEnd', 'date_order');
	}
	if (!errors.currentPeriodStart && !errors.currentPeriodEnd && !errors.billingInterval) {
		try {
			calculateNextPeriod({
				anchorDate: addCalendarDays(currentPeriodEnd, 1),
				sequence: 0,
				billingUnit,
				billingInterval
			});
		} catch {
			addError(errors, 'currentPeriodEnd', 'out_of_range');
		}
	}
	const renewsAutomatically = bool(input.renewsAutomatically, 'renewsAutomatically', errors);
	const status = subscriptionStatuses.includes(input.status as never)
		? (input.status as SubscriptionWrite['status'])
		: 'ACTIVE';
	if (!subscriptionStatuses.includes(input.status as never)) addError(errors, 'status', 'invalid');
	const alertDays = normalizeAlertDays(input.alertDays);
	if (!alertDays) addError(errors, 'alertDays', 'out_of_range');
	return {
		value: {
			platformId,
			customPlatformName,
			planName,
			accountLabel,
			amount,
			currency,
			billingUnit,
			billingInterval,
			currentPeriodStart,
			currentPeriodEnd,
			renewsAutomatically,
			status,
			alertDays: alertDays ?? []
		},
		errors
	};
}

function parseScheduleVersion(value: unknown, errors: Errors): ScheduleVersion {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		addError(errors, 'expectedSchedule', 'invalid');
		return {
			currentPeriodStart: '0001-01-01' as CalendarDate,
			currentPeriodEnd: '0001-01-01' as CalendarDate,
			renewalAnchorDate: '0001-01-01' as CalendarDate,
			renewalSequence: 0,
			billingUnit: 'MONTH',
			billingInterval: 1
		};
	}
	const input = value as ObjectValue;
	const local: Errors = {};
	const currentPeriodStart = requiredDate(input.currentPeriodStart, 'currentPeriodStart', local);
	const currentPeriodEnd = requiredDate(input.currentPeriodEnd, 'currentPeriodEnd', local);
	const renewalAnchorDate = requiredDate(input.renewalAnchorDate, 'renewalAnchorDate', local);
	const renewalSequence = integer(
		input.renewalSequence,
		'renewalSequence',
		0,
		Number.MAX_SAFE_INTEGER,
		local
	);
	const billingUnit = billingUnits.includes(input.billingUnit as never)
		? (input.billingUnit as ScheduleVersion['billingUnit'])
		: 'MONTH';
	const billingInterval = integer(
		input.billingInterval,
		'billingInterval',
		1,
		billingUnit === 'DAY' ? 365 : billingUnit === 'MONTH' ? 120 : 20,
		local
	);
	if (!billingUnits.includes(input.billingUnit as never) || Object.keys(local).length) {
		addError(errors, 'expectedSchedule', 'invalid');
	}
	return {
		currentPeriodStart,
		currentPeriodEnd,
		renewalAnchorDate,
		renewalSequence,
		billingUnit,
		billingInterval
	};
}

function assertNoErrors(errors: Errors): void {
	if (Object.keys(errors).length) invalidInput(errors);
}

function assertPaidDate(
	paidDate: CalendarDate,
	today: CalendarDate,
	field: string,
	errors: Errors
): void {
	if (compareCalendarDates(paidDate, addCalendarDays(today, 1)) > 0) {
		addError(errors, field, 'future_date');
	}
}

export function parseCreateSubscriptionRequest(
	value: unknown,
	today: CalendarDate
): CreateSubscriptionRequest {
	const input = object(value);
	const parsed = parseSubscriptionWrite(input);
	const operationId = requiredUuid(input.operationId, 'operationId', parsed.errors);
	const recordInitialPayment = bool(
		input.recordInitialPayment,
		'recordInitialPayment',
		parsed.errors
	);
	const initialPaidDate =
		input.initialPaidDate === null ||
		input.initialPaidDate === undefined ||
		input.initialPaidDate === ''
			? null
			: requiredDate(input.initialPaidDate, 'initialPaidDate', parsed.errors);
	if (recordInitialPayment && !initialPaidDate) {
		addError(parsed.errors, 'initialPaidDate', 'required');
	}
	if (initialPaidDate) assertPaidDate(initialPaidDate, today, 'initialPaidDate', parsed.errors);
	assertNoErrors(parsed.errors);
	return { ...parsed.value, operationId, recordInitialPayment, initialPaidDate };
}

export function parseUpdateSubscriptionRequest(
	value: unknown,
	_today: CalendarDate
): UpdateSubscriptionRequest {
	const input = object(value);
	const parsed = parseSubscriptionWrite(input);
	const expectedSchedule = parseScheduleVersion(input.expectedSchedule, parsed.errors);
	assertNoErrors(parsed.errors);
	return { ...parsed.value, expectedSchedule };
}

export function parsePaymentWriteRequest(
	value: unknown,
	today: CalendarDate
): PaymentWriteRequest {
	const input = object(value);
	const errors: Errors = {};
	const { currency, amount } = parseCurrencyAndMoney(input, errors, false);
	const paidDate = requiredDate(input.paidDate, 'paidDate', errors);
	const servicePeriodStart = requiredDate(
		input.servicePeriodStart,
		'servicePeriodStart',
		errors
	);
	const servicePeriodEnd = requiredDate(input.servicePeriodEnd, 'servicePeriodEnd', errors);
	assertPaidDate(paidDate, today, 'paidDate', errors);
	if (compareCalendarDates(servicePeriodEnd, servicePeriodStart) < 0) {
		addError(errors, 'servicePeriodEnd', 'date_order');
	}
	assertNoErrors(errors);
	return { amount, currency, paidDate, servicePeriodStart, servicePeriodEnd };
}

export function parseCreatePaymentRequest(
	value: unknown,
	today: CalendarDate
): CreatePaymentRequest {
	const input = object(value);
	const payment = parsePaymentWriteRequest(input, today);
	const errors: Errors = {};
	const operationId = requiredUuid(input.operationId, 'operationId', errors);
	assertNoErrors(errors);
	return { ...payment, operationId };
}

export function parseRenewSubscriptionRequest(
	value: unknown,
	today: CalendarDate
): RenewSubscriptionRequest {
	const input = object(value);
	const errors: Errors = {};
	const { currency, amount } = parseCurrencyAndMoney(input, errors, false);
	const paidDate = requiredDate(input.paidDate, 'paidDate', errors);
	const expectedPeriodEnd = requiredDate(input.expectedPeriodEnd, 'expectedPeriodEnd', errors);
	assertPaidDate(paidDate, today, 'paidDate', errors);
	assertNoErrors(errors);
	return { expectedPeriodEnd, paidDate, amount, currency };
}

export function parseReverseRenewalRequest(value: unknown): ReverseRenewalRequest {
	const input = object(value);
	if (typeof input.paymentId !== 'string' || !UUID.test(input.paymentId)) {
		invalidInput({ paymentId: ['invalid'] });
	}
	return { paymentId: input.paymentId };
}

export function parseBudgetCurrency(value: unknown): string {
	const currencyText = typeof value === 'string' ? value.trim().toUpperCase() : '';
	if (!/^[A-Z]{3}$/.test(currencyText)) invalidInput({ currency: ['invalid'] });
	return currencyText;
}

export function parseBudgetWriteRequest(
	value: unknown,
	currencyValue: unknown
): BudgetWriteRequest {
	const input = object(value);
	const errors: Errors = {};
	const currency = parseBudgetCurrency(currencyValue);
	const parsed = parseMoneyCandidate(input.monthlyLimit, { positive: true });
	if (!parsed.ok) {
		addError(
			errors,
			'monthlyLimit',
			parsed.reason === 'fraction_digits' ? 'fraction_digits' : 'out_of_range'
		);
	}
	const warningPercent = integer(input.warningPercent, 'warningPercent', 1, 100, errors);
	assertNoErrors(errors);
	return { monthlyLimit: parsed.ok ? parsed.value : '0', warningPercent };
}
