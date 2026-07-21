import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '$lib/server/db/index.js';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import type {
	CreateSubscriptionRequest,
	CreatePaymentRequest,
	PaymentWriteRequest,
	UpdateSubscriptionRequest
} from '$lib/subscriptions/types.js';
import {
	createManualPayment,
	createSubscription,
	renewSubscription,
	reverseLatestRenewal,
	softDeleteSubscription,
	updateEditablePayment,
	updateSubscription,
	upsertSubscriptionBudget
} from './mutations.js';

const execute = vi.fn();
const db = { execute } as unknown as Db;
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const subscriptionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const createInput: CreateSubscriptionRequest = {
	operationId: subscriptionId,
	platformId: null,
	customPlatformName: 'Custom GL',
	planName: 'Premium',
	accountLabel: null,
	amount: '19.99',
	currency: 'USD',
	billingUnit: 'MONTH',
	billingInterval: 1,
	currentPeriodStart: parseCalendarDate('2026-07-25')!,
	currentPeriodEnd: parseCalendarDate('2026-08-24')!,
	renewsAutomatically: true,
	status: 'ACTIVE',
	alertDays: [7, 3, 1],
	recordInitialPayment: true,
	initialPaidDate: parseCalendarDate('2026-07-25')!
};

function sqlText(value: unknown, seen = new WeakSet<object>()): string {
	if (value === null || value === undefined) return String(value);
	if (typeof value !== 'object') return String(value);
	if (seen.has(value)) return '';
	seen.add(value);
	if (Array.isArray(value)) return value.map((item) => sqlText(item, seen)).join(' ');
	return Object.values(value)
		.map((item) => sqlText(item, seen))
		.join(' ');
}

const paymentInput: PaymentWriteRequest = {
	amount: '10',
	currency: 'USD',
	paidDate: parseCalendarDate('2026-07-21')!,
	servicePeriodStart: parseCalendarDate('2026-07-01')!,
	servicePeriodEnd: parseCalendarDate('2026-07-31')!
};

const createPaymentInput: CreatePaymentRequest = {
	...paymentInput,
	operationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
};

const activeSchedule = {
	id: subscriptionId,
	current_period_start: '2026-07-25',
	current_period_end: '2026-08-24',
	renewal_anchor_date: '2026-08-25',
	renewal_sequence: 0,
	billing_unit: 'MONTH' as const,
	billing_interval: 1,
	status: 'ACTIVE' as const
};

function updateInput(overrides: Partial<UpdateSubscriptionRequest> = {}): UpdateSubscriptionRequest {
	const {
		recordInitialPayment: _recordInitialPayment,
		initialPaidDate: _initialPaidDate,
		operationId: _operationId,
		...subscriptionWrite
	} = createInput;
	return {
		...subscriptionWrite,
		expectedSchedule: {
			currentPeriodStart: parseCalendarDate('2026-07-25')!,
			currentPeriodEnd: parseCalendarDate('2026-08-24')!,
			renewalAnchorDate: parseCalendarDate('2026-08-25')!,
			renewalSequence: 0,
			billingUnit: 'MONTH',
			billingInterval: 1
		},
		...overrides
	};
}

beforeEach(() => execute.mockReset());

describe('subscription mutations', () => {
	it('creates a subscription and optional initial payment in one CTE', async () => {
		execute.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] }).mockResolvedValueOnce({
			rows: [
				{
					id: subscriptionId,
					initial_payment_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
				}
			]
		});

		await expect(createSubscription(db, userId, createInput)).resolves.toEqual({
			id: subscriptionId
		});

		const statement = sqlText(execute.mock.calls[1][0]);
		expect(statement).toContain('WITH inserted_subscription AS');
		expect(statement).toContain('inserted_payment AS');
		expect(statement).toContain('INITIAL');
		expect(statement).toContain('ON CONFLICT (id) DO NOTHING');
		expect(statement).toContain('is_active');
		expect(statement).toContain('ROUND');
		expect(statement).toContain('FOR SHARE');
		expect(statement).toContain(subscriptionId);
	});

	it('sets the recurrence anchor to the day after the current period and sequence zero', async () => {
		execute
			.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] })
			.mockResolvedValueOnce({ rows: [{ id: subscriptionId, initial_payment_id: null }] });

		await createSubscription(db, userId, {
			...createInput,
			recordInitialPayment: false,
			initialPaidDate: null
		});

		expect(sqlText(execute.mock.calls[1][0])).toContain('2026-08-25');
	});

	it('resets recurrence only when period or cycle fields changed under full schedule CAS', async () => {
		execute
			.mockResolvedValueOnce({
				rows: [{ currency: 'USD', amount: '19.9900', requested_minor_unit: 2 }]
			})
			.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] });
		const update = updateInput();

		await updateSubscription(db, userId, subscriptionId, {
			...update,
			currentPeriodEnd: parseCalendarDate('2026-08-31')!
		});

		const statement = sqlText(execute.mock.calls[1][0]);
		expect(statement).toContain('renewal_sequence');
		expect(statement).toContain('current_period_end');
		expect(statement).toContain('2026-09-01');
		expect(statement).toContain('FOR SHARE');
	});

	it('soft-deletes a subscription without modifying its ledger', async () => {
		execute.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] });

		await softDeleteSubscription(db, userId, subscriptionId);

		const statement = sqlText(execute.mock.calls[0][0]);
		expect(statement).toContain('UPDATE user_subscriptions');
		expect(statement).not.toContain('UPDATE subscription_payments');
		expect(statement).not.toContain('DELETE FROM');
	});

	it('allows initial/manual correction but never renewal correction', async () => {
		execute.mockResolvedValueOnce({ rows: [] });

		await expect(
			updateEditablePayment(
				db,
				userId,
				'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
				paymentInput
			)
		).rejects.toMatchObject({ code: 'PAYMENT_NOT_FOUND' });

		expect(sqlText(execute.mock.calls[0][0])).toContain("kind IN ('INITIAL', 'MANUAL')");
	});

	it('scopes manual payments and budgets to the authenticated user', async () => {
		execute
			.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] })
			.mockResolvedValueOnce({
				rows: [{ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }]
			});
		await createManualPayment(db, userId, subscriptionId, createPaymentInput);
		expect(sqlText(execute.mock.calls[1][0])).toContain('user_id');
		expect(sqlText(execute.mock.calls[1][0])).toContain('ON CONFLICT (id) DO NOTHING');
		expect(sqlText(execute.mock.calls[1][0])).toContain('FOR SHARE');

		execute
			.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] })
			.mockResolvedValueOnce({ rows: [{ currency: 'USD' }] });
		await upsertSubscriptionBudget(db, userId, 'USD', {
			monthlyLimit: '100',
			warningPercent: 80
		});
		expect(sqlText(execute.mock.calls[3][0])).toContain('ON CONFLICT');
		expect(sqlText(execute.mock.calls[3][0])).toContain('FOR SHARE');
	});

	it('rejects inactive currencies and enforces the catalog minor unit before writing', async () => {
		execute.mockResolvedValueOnce({ rows: [] });
		await expect(createSubscription(db, userId, createInput)).rejects.toMatchObject({
			code: 'UNSUPPORTED_CURRENCY',
			fieldErrors: { currency: ['invalid'] }
		});
		expect(execute).toHaveBeenCalledOnce();

		execute.mockReset();
		execute.mockResolvedValueOnce({ rows: [{ minor_unit: 0 }] });
		await expect(
			createSubscription(db, userId, { ...createInput, currency: 'USD', amount: '100.5' })
		).rejects.toMatchObject({ code: 'INVALID_INPUT', fieldErrors: { amount: ['fraction_digits'] } });
		expect(execute).toHaveBeenCalledOnce();
	});

	it('rechecks catalog authority when currency changes between validation and write', async () => {
		execute
			.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] })
			.mockResolvedValueOnce({ rows: [] })
			.mockResolvedValueOnce({ rows: [] });

		await expect(createSubscription(db, userId, createInput)).rejects.toMatchObject({
			code: 'UNSUPPORTED_CURRENCY'
		});
		const statement = sqlText(execute.mock.calls[1][0]);
		expect(statement).toContain('is_active');
		expect(statement).toContain('ROUND');
	});

	it('preserves inactive legacy subscription money only when currency and amount stay unchanged', async () => {
		execute
			.mockResolvedValueOnce({
				rows: [{ currency: 'CAD', amount: '19.9900', requested_minor_unit: null }]
			})
			.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] });

		await expect(
			updateSubscription(db, userId, subscriptionId, updateInput({ currency: 'CAD', amount: '19.99' }))
		).resolves.toEqual({ id: subscriptionId });

		execute.mockReset();
		execute.mockResolvedValueOnce({
			rows: [{ currency: 'CAD', amount: '19.9900', requested_minor_unit: null }]
		});
		await expect(
			updateSubscription(db, userId, subscriptionId, updateInput({ currency: 'CAD', amount: '20' }))
		).rejects.toMatchObject({ code: 'UNSUPPORTED_CURRENCY' });
		expect(execute).toHaveBeenCalledOnce();
	});
});

describe('confirmed renewal', () => {
	const renewalInput = {
		expectedPeriodEnd: parseCalendarDate('2026-08-24')!,
		paidDate: parseCalendarDate('2026-08-20')!,
		amount: '21.5',
		currency: 'USD'
	};

	it('advances exactly one period and inserts one payment in one atomic CTE', async () => {
		execute
			.mockResolvedValueOnce({ rows: [activeSchedule] })
			.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] })
			.mockResolvedValueOnce({
				rows: [
					{
						payment_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
						current_period_start: '2026-08-25',
						current_period_end: '2026-09-24',
						renewal_sequence: 1
					}
				]
			});

		const result = await renewSubscription(db, userId, subscriptionId, renewalInput);

		expect(result).toMatchObject({
			currentPeriodStart: '2026-08-25',
			currentPeriodEnd: '2026-09-24',
			renewalSequence: 1
		});
		const statement = sqlText(execute.mock.calls[2][0]);
		expect(statement).toContain('WITH advanced_subscription AS');
		expect(statement).toContain('inserted_payment AS');
		expect(statement).toContain('renewal_from_period_end');
		expect(statement.match(/INSERT INTO subscription_payments/g)).toHaveLength(1);
		expect(statement).toContain('FOR SHARE');
		expect(execute).toHaveBeenCalledTimes(3);
	});

	it('does not bulk-fill missed cycles', async () => {
		execute
			.mockResolvedValueOnce({ rows: [activeSchedule] })
			.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] })
			.mockResolvedValueOnce({
				rows: [
					{
						payment_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
						current_period_start: '2026-08-25',
						current_period_end: '2026-09-24',
						renewal_sequence: 1
					}
				]
			});

		await renewSubscription(db, userId, subscriptionId, {
			...renewalInput,
			paidDate: parseCalendarDate('2026-12-01')!
		});

		expect(sqlText(execute.mock.calls[2][0]).match(/INSERT INTO subscription_payments/g)).toHaveLength(
			1
		);
	});

	it('maps a repeated original period to the stable duplicate code', async () => {
		execute
			.mockResolvedValueOnce({
				rows: [
					{
						...activeSchedule,
						current_period_start: '2026-08-25',
						current_period_end: '2026-09-24',
						renewal_sequence: 1
					}
				]
			})
			.mockResolvedValueOnce({
				rows: [{ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }]
			});

		await expect(
			renewSubscription(db, userId, subscriptionId, renewalInput)
		).rejects.toMatchObject({ code: 'RENEWAL_ALREADY_RECORDED', status: 409 });
	});

	it('returns 404 for missing or foreign-owned subscriptions', async () => {
		execute.mockResolvedValueOnce({ rows: [] });

		await expect(
			renewSubscription(db, userId, subscriptionId, renewalInput)
		).rejects.toMatchObject({ code: 'SUBSCRIPTION_NOT_FOUND', status: 404 });
	});

	it('returns conflict when recurrence no longer forms a contiguous next period', async () => {
		execute.mockResolvedValueOnce({
			rows: [{ ...activeSchedule, renewal_anchor_date: '2026-09-01' }]
		});

		await expect(
			renewSubscription(db, userId, subscriptionId, renewalInput)
		).rejects.toMatchObject({ code: 'RENEWAL_CONFLICT' });
	});

	it('maps a unique-index race to the stable duplicate code', async () => {
		const duplicate = Object.assign(new Error('duplicate key'), {
			code: '23505',
			constraint: 'subscription_payments_live_renewal_unique'
		});
		execute
			.mockResolvedValueOnce({ rows: [activeSchedule] })
			.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] })
			.mockRejectedValueOnce(duplicate);

		await expect(
			renewSubscription(db, userId, subscriptionId, renewalInput)
		).rejects.toMatchObject({ code: 'RENEWAL_ALREADY_RECORDED' });
	});

	it('classifies a zero-row CAS with a live renewal as a duplicate', async () => {
		execute
			.mockResolvedValueOnce({ rows: [activeSchedule] })
			.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] })
			.mockResolvedValueOnce({ rows: [] })
			.mockResolvedValueOnce({ rows: [{ minor_unit: 2 }] })
			.mockResolvedValueOnce({
				rows: [{ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }]
			});

		await expect(
			renewSubscription(db, userId, subscriptionId, renewalInput)
		).rejects.toMatchObject({ code: 'RENEWAL_ALREADY_RECORDED' });
	});
});

describe('latest renewal reversal', () => {
	const paymentId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

	it('soft-deletes only the eligible latest renewal and restores snapshots in one CTE', async () => {
		execute.mockResolvedValueOnce({
			rows: [
				{
					payment_id: paymentId,
					current_period_start: '2026-07-25',
					current_period_end: '2026-08-24',
					renewal_sequence: 0
				}
			]
		});

		const result = await reverseLatestRenewal(db, userId, subscriptionId, { paymentId });

		expect(result).toMatchObject({
			currentPeriodStart: '2026-07-25',
			currentPeriodEnd: '2026-08-24',
			renewalSequence: 0
		});
		const statement = sqlText(execute.mock.calls[0][0]);
		expect(statement).toContain('WITH candidate AS');
		expect(statement).toContain('restored_subscription AS');
		expect(statement).toContain('soft_deleted_payment AS');
		expect(statement).not.toContain('DELETE FROM subscription_payments');
		expect(execute).toHaveBeenCalledOnce();
	});

	it('rejects a non-latest renewal or a schedule edited afterward', async () => {
		execute
			.mockResolvedValueOnce({ rows: [] })
			.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] });

		await expect(
			reverseLatestRenewal(db, userId, subscriptionId, { paymentId })
		).rejects.toMatchObject({ code: 'RENEWAL_REVERSAL_NOT_ALLOWED', status: 409 });
	});

	it('hides foreign subscription existence during reversal', async () => {
		execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

		await expect(
			reverseLatestRenewal(db, userId, subscriptionId, { paymentId })
		).rejects.toMatchObject({ code: 'SUBSCRIPTION_NOT_FOUND', status: 404 });
	});
});
