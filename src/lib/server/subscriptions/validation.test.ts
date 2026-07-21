import { describe, expect, it } from 'vitest';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { SubscriptionDomainError } from './errors.js';
import {
	parseBudgetCurrency,
	parseBudgetWriteRequest,
	parseCreateSubscriptionRequest,
	parseCreatePaymentRequest,
	parsePaymentWriteRequest,
	parseRenewSubscriptionRequest,
	parseReverseRenewalRequest,
	parseUpdateSubscriptionRequest
} from './validation.js';

const today = parseCalendarDate('2026-07-21')!;
const validCreate = {
	operationId: '99999999-9999-4999-8999-999999999999',
	platformId: '11111111-1111-4111-8111-111111111111',
	customPlatformName: null,
	planName: 'Premium',
	accountLabel: 'Family',
	amount: '219.00',
	currency: 'thb',
	billingUnit: 'MONTH',
	billingInterval: 1,
	currentPeriodStart: '2026-07-01',
	currentPeriodEnd: '2026-07-31',
	renewsAutomatically: true,
	status: 'ACTIVE',
	alertDays: [1, 7, 3, 7],
	recordInitialPayment: false,
	initialPaidDate: null
};

function expectFieldError(run: () => unknown, field: string, code: string) {
	try {
		run();
		throw new Error('Expected validation error');
	} catch (error) {
		expect(error).toBeInstanceOf(SubscriptionDomainError);
		expect((error as SubscriptionDomainError).fieldErrors[field]).toContain(code);
	}
}

describe('subscription validation', () => {
	it('normalizes a valid create request', () => {
			expect(parseCreateSubscriptionRequest(validCreate, today)).toMatchObject({
			operationId: '99999999-9999-4999-8999-999999999999',
			currency: 'THB',
			amount: '219.00',
			alertDays: [7, 3, 1],
			planName: 'Premium'
		});
	});

	it('requires operation IDs and collapses internal whitespace', () => {
		expectFieldError(
			() => parseCreateSubscriptionRequest({ ...validCreate, operationId: undefined }, today),
			'operationId',
			'required'
		);
		expect(
			parseCreateSubscriptionRequest(
				{ ...validCreate, platformId: null, customPlatformName: '  Indie   GL  ' },
				today
			).customPlatformName
		).toBe('Indie GL');
	});

	it.each([
		[{ ...validCreate, customPlatformName: 'Custom' }, 'customPlatformName', 'source_xor'],
		[{ ...validCreate, platformId: null }, 'customPlatformName', 'source_xor'],
		[{ ...validCreate, currency: 'US' }, 'currency', 'invalid'],
		[{ ...validCreate, currentPeriodEnd: '2026-06-30' }, 'currentPeriodEnd', 'date_order'],
		[{ ...validCreate, billingInterval: 0 }, 'billingInterval', 'out_of_range'],
		[{ ...validCreate, billingUnit: 'DAY', billingInterval: 366 }, 'billingInterval', 'out_of_range'],
		[{ ...validCreate, amount: '1.00001' }, 'amount', 'fraction_digits'],
		[{ ...validCreate, alertDays: [0] }, 'alertDays', 'out_of_range']
	])('rejects invalid create fields', (input, field, code) => {
		expectFieldError(() => parseCreateSubscriptionRequest(input, today), field, code);
	});

	it('defers catalog membership and minor-unit rules to database-backed mutations', () => {
		expect(
			parseCreateSubscriptionRequest(
				{ ...validCreate, currency: 'ZZZ', amount: '1.001' },
				today
			)
		).toMatchObject({ currency: 'ZZZ', amount: '1.001' });
	});

	it('requires and bounds the optional initial payment date', () => {
		expectFieldError(
			() => parseCreateSubscriptionRequest({ ...validCreate, recordInitialPayment: true }, today),
			'initialPaidDate',
			'required'
		);
		expectFieldError(
			() =>
				parseCreateSubscriptionRequest(
					{ ...validCreate, recordInitialPayment: true, initialPaidDate: '2026-07-23' },
					today
				),
			'initialPaidDate',
			'future_date'
		);
	});

	it('requires the complete edit compare-and-swap schedule', () => {
		expectFieldError(
			() => parseUpdateSubscriptionRequest({ ...validCreate, expectedSchedule: {} }, today),
			'expectedSchedule',
			'invalid'
		);
	});

	it('accepts an uppercase legacy code at the request boundary for unrelated edits', () => {
		const parsed = parseUpdateSubscriptionRequest(
			{
				...validCreate,
				currency: 'ZZZ',
				amount: '219.000',
				expectedSchedule: {
					currentPeriodStart: '2026-07-01',
					currentPeriodEnd: '2026-07-31',
					renewalAnchorDate: '2026-08-01',
					renewalSequence: 0,
					billingUnit: 'MONTH',
					billingInterval: 1
				}
			},
			today
		);
		expect(parsed).toMatchObject({ currency: 'ZZZ', amount: '219.000' });
	});

	it('rejects create and update schedules whose next billing boundary exceeds year 9999', () => {
		const boundarySchedule = {
			...validCreate,
			currentPeriodStart: '9999-11-01',
			currentPeriodEnd: '9999-11-30',
			billingUnit: 'MONTH',
			billingInterval: 1
		};
		expectFieldError(
			() => parseCreateSubscriptionRequest(boundarySchedule, today),
			'currentPeriodEnd',
			'out_of_range'
		);
		expectFieldError(
			() =>
				parseUpdateSubscriptionRequest(
					{
						...boundarySchedule,
						expectedSchedule: {
							currentPeriodStart: '2026-07-01',
							currentPeriodEnd: '2026-07-31',
							renewalAnchorDate: '2026-08-01',
							renewalSequence: 0,
							billingUnit: 'MONTH',
							billingInterval: 1
						}
					},
					today
				),
			'currentPeriodEnd',
			'out_of_range'
		);
	});

	it('validates manual payment period and paid date', () => {
		expectFieldError(
			() =>
				parsePaymentWriteRequest(
					{
						amount: '10',
						currency: 'USD',
						paidDate: '2026-07-23',
						servicePeriodStart: '2026-07-01',
						servicePeriodEnd: '2026-07-31'
					},
					today
				),
			'paidDate',
			'future_date'
		);
		expectFieldError(
			() =>
				parsePaymentWriteRequest(
					{
						amount: '10',
						currency: 'USD',
						paidDate: '2026-07-21',
						servicePeriodStart: '2026-08-01',
						servicePeriodEnd: '2026-07-31'
					},
					today
				),
			'servicePeriodEnd',
			'date_order'
		);
	});

	it('requires an operation ID for manual payment creation', () => {
		const payment = {
			operationId: '88888888-8888-4888-8888-888888888888',
			amount: '10',
			currency: 'USD',
			paidDate: '2026-07-21',
			servicePeriodStart: '2026-07-01',
			servicePeriodEnd: '2026-07-31'
		};
		expect(parseCreatePaymentRequest(payment, today).operationId).toBe(payment.operationId);
		expectFieldError(
			() => parseCreatePaymentRequest({ ...payment, operationId: 'bad' }, today),
			'operationId',
			'invalid'
		);
	});

	it('validates renewal, reversal, and positive budget inputs', () => {
		expect(
			parseRenewSubscriptionRequest(
				{
					expectedPeriodEnd: '2026-07-31',
					paidDate: '2026-07-21',
					amount: '19.99',
					currency: 'USD'
				},
				today
			).currency
		).toBe('USD');
		expectFieldError(
			() =>
				parseRenewSubscriptionRequest(
					{
						expectedPeriodEnd: 'bad',
						paidDate: '2026-07-21',
						amount: '19.99',
						currency: 'USD'
					},
					today
				),
			'expectedPeriodEnd',
			'invalid'
		);
		expect(
			parseReverseRenewalRequest({ paymentId: '11111111-1111-4111-8111-111111111111' })
				.paymentId
		).toBe('11111111-1111-4111-8111-111111111111');
		expect(parseBudgetCurrency('thb')).toBe('THB');
		expectFieldError(() => parseBudgetCurrency('not-a-currency'), 'currency', 'invalid');
		expect(parseBudgetCurrency('ZZZ')).toBe('ZZZ');
		expectFieldError(
			() => parseBudgetWriteRequest({ monthlyLimit: '0', warningPercent: 80 }, 'USD'),
			'monthlyLimit',
			'out_of_range'
		);
		expectFieldError(
			() => parseBudgetWriteRequest({ monthlyLimit: '100', warningPercent: 101 }, 'USD'),
			'warningPercent',
			'out_of_range'
		);
	});
});
