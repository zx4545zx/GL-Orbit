import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { Db } from '$lib/server/db/index.js';
import {
	addCalendarDays,
	calculateNextPeriod,
	parseCalendarDate
} from '$lib/subscriptions/calendar.js';
import { fromScaleFour, parseMoneyWithMinorUnit, toScaleFour } from '$lib/subscriptions/money.js';
import type {
	BudgetWriteRequest,
	CalendarDate,
	CreatePaymentRequest,
	CreateSubscriptionRequest,
	PaymentWriteRequest,
	RenewalResult,
	RenewSubscriptionRequest,
	ReversalResult,
	ReverseRenewalRequest,
	UpdateSubscriptionRequest
} from '$lib/subscriptions/types.js';
import { SubscriptionDomainError } from './errors.js';
import { resultRows } from './queries.js';

async function assertLivePlatform(db: Db, platformId: string | null): Promise<void> {
	if (!platformId) return;
	const rows = resultRows<{ id: string }>(
		await db.execute(sql`
			SELECT id
			FROM platforms
			WHERE id = ${platformId}::uuid AND deleted_at IS NULL
			LIMIT 1
		`)
	);
	if (!rows.length) throw new SubscriptionDomainError('PLATFORM_NOT_FOUND');
}

async function assertOwnedLiveSubscription(
	db: Db,
	userId: string,
	subscriptionId: string
): Promise<void> {
	const owned = resultRows<{ id: string }>(
		await db.execute(sql`
			SELECT id
			FROM user_subscriptions
			WHERE id = ${subscriptionId}::uuid
				AND user_id = ${userId}::uuid
				AND deleted_at IS NULL
			LIMIT 1
		`)
	);
	if (!owned.length) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');
}

async function classifySubscriptionCasFailure(
	db: Db,
	userId: string,
	subscriptionId: string
): Promise<never> {
	await assertOwnedLiveSubscription(db, userId, subscriptionId);
	throw new SubscriptionDomainError('RENEWAL_CONFLICT');
}

function integerArraySql(values: number[]) {
	if (!values.length) return sql`ARRAY[]::integer[]`;
	return sql`ARRAY[${sql.join(
		values.map((value) => sql`${value}`),
		sql`, `
	)}]::integer[]`;
}

function invalidAmount(reason: 'invalid' | 'fraction_digits' | 'unsupported_currency' | 'out_of_range'): never {
	throw new SubscriptionDomainError('INVALID_INPUT', {
		amount: [reason === 'fraction_digits' ? 'fraction_digits' : reason === 'out_of_range' ? 'out_of_range' : 'invalid']
	});
}

function canonicalDbMoney(value: string): string {
	try {
		return fromScaleFour(toScaleFour(value));
	} catch {
		throw new SubscriptionDomainError('INTERNAL_ERROR');
	}
}

function parseCatalogAmount(amount: string, minorUnit: number, positive: boolean): string {
	const parsed = parseMoneyWithMinorUnit(amount, minorUnit, { positive });
	if (!parsed.ok) invalidAmount(parsed.reason);
	return parsed.value;
}

function activeCatalogMoneySql(currency: string, amount: string, positive: boolean) {
	return sql`
		EXISTS (
			SELECT 1 FROM currencies c
			WHERE c.code = ${currency}
				AND c.is_active = TRUE
				AND ${amount}::numeric = ROUND(${amount}::numeric, c.minor_unit)
				${positive ? sql`AND ${amount}::numeric > 0` : sql`AND ${amount}::numeric >= 0`}
			FOR SHARE
		)
	`;
}

async function validateActiveCatalogMoney(
	db: Db,
	currency: string,
	amount: string,
	positive: boolean
): Promise<string> {
	const rows = resultRows<{ minor_unit: number }>(
		await db.execute(sql`
			SELECT minor_unit
			FROM currencies
			WHERE code = ${currency} AND is_active = TRUE
			LIMIT 1
		`)
	);
	if (!rows[0]) {
		throw new SubscriptionDomainError('UNSUPPORTED_CURRENCY', { currency: ['invalid'] });
	}
	return parseCatalogAmount(amount, rows[0].minor_unit, positive);
}

async function validateSubscriptionUpdateMoney(
	db: Db,
	userId: string,
	subscriptionId: string,
	currency: string,
	amount: string
): Promise<string> {
	const rows = resultRows<{
		currency: string;
		amount: string;
		requested_minor_unit: number | null;
	}>(
		await db.execute(sql`
			SELECT us.currency, us.amount::text,
				(SELECT minor_unit FROM currencies
				 WHERE code = ${currency} AND is_active = TRUE LIMIT 1) AS requested_minor_unit
			FROM user_subscriptions us
			WHERE us.id = ${subscriptionId}::uuid
				AND us.user_id = ${userId}::uuid
				AND us.deleted_at IS NULL
			LIMIT 1
		`)
	);
	const current = rows[0];
	if (!current) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');
	if (current.requested_minor_unit !== null) {
		return parseCatalogAmount(amount, current.requested_minor_unit, false);
	}
	const currentAmount = canonicalDbMoney(current.amount);
	if (currency === current.currency && toScaleFour(amount) === toScaleFour(currentAmount)) return currentAmount;
	throw new SubscriptionDomainError('UNSUPPORTED_CURRENCY', { currency: ['invalid'] });
}

async function validatePaymentUpdateMoney(
	db: Db,
	userId: string,
	paymentId: string,
	currency: string,
	amount: string
): Promise<string> {
	const rows = resultRows<{
		currency: string;
		amount: string;
		requested_minor_unit: number | null;
	}>(
		await db.execute(sql`
			SELECT sp.currency, sp.amount::text,
				(SELECT minor_unit FROM currencies
				 WHERE code = ${currency} AND is_active = TRUE LIMIT 1) AS requested_minor_unit
			FROM subscription_payments sp
			WHERE sp.id = ${paymentId}::uuid
				AND sp.user_id = ${userId}::uuid
				AND sp.deleted_at IS NULL
				AND sp.kind IN ('INITIAL', 'MANUAL')
			LIMIT 1
		`)
	);
	const current = rows[0];
	if (!current) throw new SubscriptionDomainError('PAYMENT_NOT_FOUND');
	if (current.requested_minor_unit !== null) {
		return parseCatalogAmount(amount, current.requested_minor_unit, true);
	}
	const currentAmount = canonicalDbMoney(current.amount);
	if (currency === current.currency && toScaleFour(amount) === toScaleFour(currentAmount)) return currentAmount;
	throw new SubscriptionDomainError('UNSUPPORTED_CURRENCY', { currency: ['invalid'] });
}

export async function createSubscription(
	db: Db,
	userId: string,
	input: CreateSubscriptionRequest
): Promise<{ id: string }> {
	await assertLivePlatform(db, input.platformId);
	const amount = await validateActiveCatalogMoney(db, input.currency, input.amount, false);
	const subscriptionId = input.operationId;
	const paymentId = randomUUID();
	const renewalAnchorDate = addCalendarDays(input.currentPeriodEnd, 1);
	const canceledAt = input.status === 'CANCELED' ? sql`NOW()` : sql`NULL`;
	const alertDays = integerArraySql(input.alertDays);
	const catalogMoney = activeCatalogMoneySql(input.currency, amount, false);
	const rows = resultRows<{ id: string; initial_payment_id: string | null }>(
		await db.execute(sql`
			WITH inserted_subscription AS (
				INSERT INTO user_subscriptions (
					id, user_id, platform_id, custom_platform_name, plan_name, account_label,
					amount, currency, billing_unit, billing_interval, current_period_start,
					current_period_end, renewal_anchor_date, renewal_sequence,
					renews_automatically, status, alert_days, canceled_at
				) SELECT
					${subscriptionId}::uuid, ${userId}::uuid, CAST(${input.platformId} AS uuid),
					${input.customPlatformName}, ${input.planName}, ${input.accountLabel},
					${amount}::numeric, ${input.currency}, ${input.billingUnit},
					${input.billingInterval}, ${input.currentPeriodStart}::date,
					${input.currentPeriodEnd}::date, ${renewalAnchorDate}::date, 0,
					${input.renewsAutomatically}, ${input.status}, ${alertDays}, ${canceledAt}
				WHERE ${catalogMoney}
				ON CONFLICT (id) DO NOTHING
				RETURNING id, user_id, amount, currency, current_period_start, current_period_end
			), resolved_subscription AS (
				SELECT id, user_id, amount, currency, current_period_start, current_period_end
				FROM inserted_subscription
				UNION ALL
				SELECT id, user_id, amount, currency, current_period_start, current_period_end
				FROM user_subscriptions
				WHERE id = ${subscriptionId}::uuid
					AND user_id = ${userId}::uuid
					AND deleted_at IS NULL
					AND NOT EXISTS (SELECT 1 FROM inserted_subscription)
			), inserted_payment AS (
				INSERT INTO subscription_payments (
					id, user_id, subscription_id, kind, amount, currency, paid_date,
					service_period_start, service_period_end
				)
				SELECT ${paymentId}::uuid, user_id, id, 'INITIAL', amount, currency,
					CAST(${input.initialPaidDate} AS date), current_period_start, current_period_end
				FROM inserted_subscription
				WHERE ${input.recordInitialPayment}
				RETURNING id
			)
			SELECT resolved_subscription.id,
				(SELECT id FROM inserted_payment LIMIT 1) AS initial_payment_id
			FROM resolved_subscription
		`)
	);
	if (!rows[0]) {
		await validateActiveCatalogMoney(db, input.currency, input.amount, false);
		throw new SubscriptionDomainError('INTERNAL_ERROR');
	}
	return { id: rows[0].id };
}

export async function updateSubscription(
	db: Db,
	userId: string,
	subscriptionId: string,
	input: UpdateSubscriptionRequest
): Promise<{ id: string }> {
	await assertLivePlatform(db, input.platformId);
	const amount = await validateSubscriptionUpdateMoney(
		db,
		userId,
		subscriptionId,
		input.currency,
		input.amount
	);
	const scheduleChanged =
		input.currentPeriodStart !== input.expectedSchedule.currentPeriodStart ||
		input.currentPeriodEnd !== input.expectedSchedule.currentPeriodEnd ||
		input.billingUnit !== input.expectedSchedule.billingUnit ||
		input.billingInterval !== input.expectedSchedule.billingInterval;
	const nextAnchor = scheduleChanged
		? addCalendarDays(input.currentPeriodEnd, 1)
		: input.expectedSchedule.renewalAnchorDate;
	const nextSequence = scheduleChanged ? 0 : input.expectedSchedule.renewalSequence;
	const alertDays = integerArraySql(input.alertDays);
	const catalogMoney = activeCatalogMoneySql(input.currency, amount, false);
	const rows = resultRows<{ id: string }>(
		await db.execute(sql`
			UPDATE user_subscriptions SET
				platform_id = CAST(${input.platformId} AS uuid),
				custom_platform_name = ${input.customPlatformName},
				plan_name = ${input.planName},
				account_label = ${input.accountLabel},
				amount = ${amount}::numeric,
				currency = ${input.currency},
				billing_unit = ${input.billingUnit},
				billing_interval = ${input.billingInterval},
				current_period_start = ${input.currentPeriodStart}::date,
				current_period_end = ${input.currentPeriodEnd}::date,
				renewal_anchor_date = ${nextAnchor}::date,
				renewal_sequence = ${nextSequence},
				renews_automatically = ${input.renewsAutomatically},
				status = ${input.status},
				alert_days = ${alertDays},
				canceled_at = CASE
					WHEN ${input.status} = 'CANCELED' THEN COALESCE(canceled_at, NOW())
					ELSE NULL
				END,
				updated_at = NOW()
			WHERE id = ${subscriptionId}::uuid
				AND user_id = ${userId}::uuid
				AND deleted_at IS NULL
				AND current_period_start = ${input.expectedSchedule.currentPeriodStart}::date
				AND current_period_end = ${input.expectedSchedule.currentPeriodEnd}::date
				AND renewal_anchor_date = ${input.expectedSchedule.renewalAnchorDate}::date
				AND renewal_sequence = ${input.expectedSchedule.renewalSequence}
				AND billing_unit = ${input.expectedSchedule.billingUnit}
				AND billing_interval = ${input.expectedSchedule.billingInterval}
				AND (
					${catalogMoney}
					OR (currency = ${input.currency} AND amount = ${amount}::numeric)
				)
			RETURNING id
		`)
	);
	if (!rows[0]) {
		await validateSubscriptionUpdateMoney(db, userId, subscriptionId, input.currency, input.amount);
		return classifySubscriptionCasFailure(db, userId, subscriptionId);
	}
	return rows[0];
}

export async function softDeleteSubscription(
	db: Db,
	userId: string,
	subscriptionId: string
): Promise<void> {
	const rows = resultRows<{ id: string }>(
		await db.execute(sql`
			UPDATE user_subscriptions
			SET deleted_at = NOW(), updated_at = NOW()
			WHERE id = ${subscriptionId}::uuid
				AND user_id = ${userId}::uuid
				AND deleted_at IS NULL
			RETURNING id
		`)
	);
	if (!rows[0]) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');
}

export async function createManualPayment(
	db: Db,
	userId: string,
	subscriptionId: string,
	input: CreatePaymentRequest
): Promise<{ id: string }> {
	const amount = await validateActiveCatalogMoney(db, input.currency, input.amount, true);
	const catalogMoney = activeCatalogMoneySql(input.currency, amount, true);
	const paymentId = input.operationId;
	const rows = resultRows<{ id: string }>(
		await db.execute(sql`
			WITH inserted_payment AS (
				INSERT INTO subscription_payments (
					id, user_id, subscription_id, kind, amount, currency, paid_date,
					service_period_start, service_period_end
				)
				SELECT ${paymentId}::uuid, user_id, id, 'MANUAL', ${amount}::numeric,
					${input.currency}, ${input.paidDate}::date, ${input.servicePeriodStart}::date,
					${input.servicePeriodEnd}::date
				FROM user_subscriptions
				WHERE id = ${subscriptionId}::uuid
					AND user_id = ${userId}::uuid
					AND deleted_at IS NULL
					AND ${catalogMoney}
				ON CONFLICT (id) DO NOTHING
				RETURNING id
			)
			SELECT id FROM inserted_payment
			UNION ALL
			SELECT id FROM subscription_payments
			WHERE id = ${paymentId}::uuid
				AND user_id = ${userId}::uuid
				AND subscription_id = ${subscriptionId}::uuid
				AND kind = 'MANUAL'
				AND deleted_at IS NULL
				AND NOT EXISTS (SELECT 1 FROM inserted_payment)
			LIMIT 1
		`)
	);
	if (!rows[0]) {
		await assertOwnedLiveSubscription(db, userId, subscriptionId);
		await validateActiveCatalogMoney(db, input.currency, input.amount, true);
		throw new SubscriptionDomainError('INTERNAL_ERROR');
	}
	return rows[0];
}

export async function updateEditablePayment(
	db: Db,
	userId: string,
	paymentId: string,
	input: PaymentWriteRequest
): Promise<{ id: string }> {
	const amount = await validatePaymentUpdateMoney(db, userId, paymentId, input.currency, input.amount);
	const catalogMoney = activeCatalogMoneySql(input.currency, amount, true);
	const rows = resultRows<{ id: string }>(
		await db.execute(sql`
			UPDATE subscription_payments
			SET amount = ${amount}::numeric,
				currency = ${input.currency},
				paid_date = ${input.paidDate}::date,
				service_period_start = ${input.servicePeriodStart}::date,
				service_period_end = ${input.servicePeriodEnd}::date,
				updated_at = NOW()
			WHERE id = ${paymentId}::uuid
				AND user_id = ${userId}::uuid
				AND deleted_at IS NULL
				AND kind IN ('INITIAL', 'MANUAL')
				AND (
					${catalogMoney}
					OR (currency = ${input.currency} AND amount = ${amount}::numeric)
				)
			RETURNING id
		`)
	);
	if (!rows[0]) {
		await validatePaymentUpdateMoney(db, userId, paymentId, input.currency, input.amount);
		throw new SubscriptionDomainError('PAYMENT_NOT_FOUND');
	}
	return rows[0];
}

export async function softDeleteEditablePayment(
	db: Db,
	userId: string,
	paymentId: string
): Promise<void> {
	const rows = resultRows<{ id: string }>(
		await db.execute(sql`
			UPDATE subscription_payments
			SET deleted_at = NOW(), updated_at = NOW()
			WHERE id = ${paymentId}::uuid
				AND user_id = ${userId}::uuid
				AND deleted_at IS NULL
				AND kind IN ('INITIAL', 'MANUAL')
			RETURNING id
		`)
	);
	if (!rows[0]) throw new SubscriptionDomainError('PAYMENT_NOT_FOUND');
}

export async function upsertSubscriptionBudget(
	db: Db,
	userId: string,
	currency: string,
	input: BudgetWriteRequest
): Promise<{ currency: string }> {
	const monthlyLimit = await validateActiveCatalogMoney(
		db,
		currency,
		input.monthlyLimit,
		true
	);
	const catalogMoney = activeCatalogMoneySql(currency, monthlyLimit, true);
	const rows = resultRows<{ currency: string }>(
		await db.execute(sql`
			INSERT INTO subscription_budgets (
				id, user_id, currency, monthly_limit, warning_percent
			) SELECT
				${randomUUID()}::uuid, ${userId}::uuid, ${currency},
				${monthlyLimit}::numeric, ${input.warningPercent}
			WHERE ${catalogMoney}
			ON CONFLICT (user_id, currency) DO UPDATE SET
				monthly_limit = EXCLUDED.monthly_limit,
				warning_percent = EXCLUDED.warning_percent,
				updated_at = NOW()
			RETURNING currency
		`)
	);
	if (!rows[0]) {
		await validateActiveCatalogMoney(db, currency, input.monthlyLimit, true);
		throw new SubscriptionDomainError('INTERNAL_ERROR');
	}
	return rows[0];
}

export async function deleteSubscriptionBudget(
	db: Db,
	userId: string,
	currency: string
): Promise<void> {
	await db.execute(sql`
		DELETE FROM subscription_budgets
		WHERE user_id = ${userId}::uuid AND currency = ${currency}
	`);
}

type OwnedScheduleRow = {
	id: string;
	current_period_start: string;
	current_period_end: string;
	renewal_anchor_date: string;
	renewal_sequence: number;
	billing_unit: 'DAY' | 'MONTH' | 'YEAR';
	billing_interval: number;
	status: 'ACTIVE' | 'CANCELED';
};

function dbDate(value: string): CalendarDate {
	const parsed = parseCalendarDate(value);
	if (!parsed) throw new SubscriptionDomainError('INTERNAL_ERROR');
	return parsed;
}

async function getOwnedActiveSchedule(
	db: Db,
	userId: string,
	subscriptionId: string
): Promise<OwnedScheduleRow> {
	const rows = resultRows<OwnedScheduleRow>(
		await db.execute(sql`
			SELECT id, current_period_start::text, current_period_end::text,
				renewal_anchor_date::text, renewal_sequence, billing_unit,
				billing_interval, status
			FROM user_subscriptions
			WHERE id = ${subscriptionId}::uuid
				AND user_id = ${userId}::uuid
				AND deleted_at IS NULL
				AND status = 'ACTIVE'
			LIMIT 1
		`)
	);
	if (!rows[0]) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');
	return rows[0];
}

async function hasLiveRenewalFrom(
	db: Db,
	userId: string,
	subscriptionId: string,
	periodEnd: CalendarDate
): Promise<boolean> {
	const rows = resultRows<{ id: string }>(
		await db.execute(sql`
			SELECT id
			FROM subscription_payments
			WHERE user_id = ${userId}::uuid
				AND subscription_id = ${subscriptionId}::uuid
				AND kind = 'RENEWAL'
				AND renewal_from_period_end = ${periodEnd}::date
				AND deleted_at IS NULL
			LIMIT 1
		`)
	);
	return rows.length > 0;
}

function isRenewalUniqueViolation(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const value = error as { code?: string; constraint?: string; message?: string };
	return (
		value.code === '23505' &&
		(value.constraint === 'subscription_payments_live_renewal_unique' ||
			value.message?.includes('subscription_payments_live_renewal_unique') === true)
	);
}

export async function renewSubscription(
	db: Db,
	userId: string,
	subscriptionId: string,
	input: RenewSubscriptionRequest
): Promise<RenewalResult> {
	const current = await getOwnedActiveSchedule(db, userId, subscriptionId);
	const currentStart = dbDate(current.current_period_start);
	const currentEnd = dbDate(current.current_period_end);
	const anchor = dbDate(current.renewal_anchor_date);
	if (currentEnd !== input.expectedPeriodEnd) {
		if (await hasLiveRenewalFrom(db, userId, subscriptionId, input.expectedPeriodEnd)) {
			throw new SubscriptionDomainError('RENEWAL_ALREADY_RECORDED');
		}
		throw new SubscriptionDomainError('RENEWAL_CONFLICT');
	}
	const next = calculateNextPeriod({
		anchorDate: anchor,
		sequence: current.renewal_sequence,
		billingUnit: current.billing_unit,
		billingInterval: current.billing_interval
	});
	if (next.start !== addCalendarDays(currentEnd, 1)) {
		throw new SubscriptionDomainError('RENEWAL_CONFLICT');
	}
	const amount = await validateActiveCatalogMoney(db, input.currency, input.amount, true);
	const catalogMoney = activeCatalogMoneySql(input.currency, amount, true);
	const paymentId = randomUUID();
	try {
		const rows = resultRows<{
			payment_id: string;
			current_period_start: string;
			current_period_end: string;
			renewal_sequence: number;
		}>(
			await db.execute(sql`
				WITH advanced_subscription AS (
					UPDATE user_subscriptions SET
						current_period_start = ${next.start}::date,
						current_period_end = ${next.end}::date,
						renewal_sequence = ${next.nextSequence},
						updated_at = NOW()
					WHERE id = ${subscriptionId}::uuid
						AND user_id = ${userId}::uuid
						AND deleted_at IS NULL
						AND status = 'ACTIVE'
						AND current_period_start = ${currentStart}::date
						AND current_period_end = ${currentEnd}::date
						AND renewal_anchor_date = ${anchor}::date
						AND renewal_sequence = ${current.renewal_sequence}
						AND billing_unit = ${current.billing_unit}
						AND billing_interval = ${current.billing_interval}
						AND ${catalogMoney}
					RETURNING id, user_id, current_period_start, current_period_end, renewal_sequence
				), inserted_payment AS (
					INSERT INTO subscription_payments (
						id, user_id, subscription_id, kind, amount, currency, paid_date,
						service_period_start, service_period_end,
						renewal_from_period_start, renewal_from_period_end,
						renewal_anchor_before, renewal_sequence_before,
						billing_unit_snapshot, billing_interval_snapshot
					)
					SELECT ${paymentId}::uuid, user_id, id, 'RENEWAL',
						${amount}::numeric, ${input.currency}, ${input.paidDate}::date,
						${next.start}::date, ${next.end}::date,
						${currentStart}::date, ${currentEnd}::date, ${anchor}::date,
						${current.renewal_sequence}, ${current.billing_unit},
						${current.billing_interval}
					FROM advanced_subscription
					RETURNING id
				)
				SELECT inserted_payment.id AS payment_id,
					advanced_subscription.current_period_start::text,
					advanced_subscription.current_period_end::text,
					advanced_subscription.renewal_sequence
				FROM advanced_subscription
				CROSS JOIN inserted_payment
			`)
		);
		if (!rows[0]) {
			await validateActiveCatalogMoney(db, input.currency, input.amount, true);
			if (await hasLiveRenewalFrom(db, userId, subscriptionId, currentEnd)) {
				throw new SubscriptionDomainError('RENEWAL_ALREADY_RECORDED');
			}
			throw new SubscriptionDomainError('RENEWAL_CONFLICT');
		}
		return {
			paymentId: rows[0].payment_id,
			currentPeriodStart: dbDate(rows[0].current_period_start),
			currentPeriodEnd: dbDate(rows[0].current_period_end),
			renewalSequence: rows[0].renewal_sequence
		};
	} catch (error) {
		if (error instanceof SubscriptionDomainError) throw error;
		if (isRenewalUniqueViolation(error)) {
			throw new SubscriptionDomainError('RENEWAL_ALREADY_RECORDED');
		}
		throw error;
	}
}

export async function reverseLatestRenewal(
	db: Db,
	userId: string,
	subscriptionId: string,
	input: ReverseRenewalRequest
): Promise<ReversalResult> {
	const rows = resultRows<{
		payment_id: string;
		current_period_start: string;
		current_period_end: string;
		renewal_sequence: number;
	}>(
		await db.execute(sql`
			WITH candidate AS (
				SELECT sp.id AS payment_id, sp.subscription_id,
					sp.renewal_from_period_start, sp.renewal_from_period_end,
					sp.renewal_anchor_before, sp.renewal_sequence_before,
					sp.billing_unit_snapshot, sp.billing_interval_snapshot
				FROM subscription_payments sp
				INNER JOIN user_subscriptions us
					ON us.id = sp.subscription_id AND us.user_id = sp.user_id
				WHERE sp.id = ${input.paymentId}::uuid
					AND sp.subscription_id = ${subscriptionId}::uuid
					AND sp.user_id = ${userId}::uuid
					AND sp.kind = 'RENEWAL'
					AND sp.deleted_at IS NULL
					AND us.user_id = ${userId}::uuid
					AND us.deleted_at IS NULL
					AND sp.id = (
						SELECT newest.id
						FROM subscription_payments newest
						WHERE newest.subscription_id = sp.subscription_id
							AND newest.kind = 'RENEWAL'
							AND newest.deleted_at IS NULL
						ORDER BY newest.created_at DESC, newest.id DESC
						LIMIT 1
					)
					AND us.current_period_start = sp.service_period_start
					AND us.current_period_end = sp.service_period_end
					AND us.renewal_anchor_date = sp.renewal_anchor_before
					AND us.renewal_sequence = sp.renewal_sequence_before + 1
					AND us.billing_unit = sp.billing_unit_snapshot
					AND us.billing_interval = sp.billing_interval_snapshot
				FOR UPDATE OF sp, us
			), restored_subscription AS (
				UPDATE user_subscriptions us SET
					current_period_start = candidate.renewal_from_period_start,
					current_period_end = candidate.renewal_from_period_end,
					renewal_anchor_date = candidate.renewal_anchor_before,
					renewal_sequence = candidate.renewal_sequence_before,
					billing_unit = candidate.billing_unit_snapshot,
					billing_interval = candidate.billing_interval_snapshot,
					updated_at = NOW()
				FROM candidate
				WHERE us.id = candidate.subscription_id
					AND us.user_id = ${userId}::uuid
					AND us.deleted_at IS NULL
				RETURNING us.current_period_start, us.current_period_end,
					us.renewal_sequence, candidate.payment_id
			), soft_deleted_payment AS (
				UPDATE subscription_payments sp
				SET deleted_at = NOW(), updated_at = NOW()
				FROM restored_subscription restored
				WHERE sp.id = restored.payment_id
					AND sp.user_id = ${userId}::uuid
					AND sp.deleted_at IS NULL
				RETURNING sp.id
			)
			SELECT restored.payment_id, restored.current_period_start::text,
				restored.current_period_end::text, restored.renewal_sequence
			FROM restored_subscription restored
			INNER JOIN soft_deleted_payment deleted ON deleted.id = restored.payment_id
		`)
	);
	if (!rows[0]) {
		await assertOwnedLiveSubscription(db, userId, subscriptionId);
		throw new SubscriptionDomainError('RENEWAL_REVERSAL_NOT_ALLOWED');
	}
	return {
		paymentId: rows[0].payment_id,
		currentPeriodStart: dbDate(rows[0].current_period_start),
		currentPeriodEnd: dbDate(rows[0].current_period_end),
		renewalSequence: rows[0].renewal_sequence
	};
}
