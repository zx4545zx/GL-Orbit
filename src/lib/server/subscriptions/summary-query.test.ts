import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '$lib/server/db/index.js';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { getSubscriptionSummary } from './summary-query.js';

const execute = vi.fn();
const db = { execute } as unknown as Db;
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function collectPrimitiveValues(value: unknown, seen = new WeakSet<object>()): unknown[] {
	if (value === null || typeof value !== 'object') return [value];
	if (seen.has(value)) return [];
	seen.add(value);
	if (Array.isArray(value)) return value.flatMap((item) => collectPrimitiveValues(item, seen));
	return Object.values(value).flatMap((item) => collectPrimitiveValues(item, seen));
}

beforeEach(() => execute.mockReset());

describe('subscription summary query', () => {
	it('keeps actual, forecast, and budget amounts separate by currency', async () => {
		execute
			.mockResolvedValueOnce({
				rows: [
					{ currency: 'USD', total: '30.1000' },
					{ currency: 'THB', total: '219.0000' }
				]
			})
			.mockResolvedValueOnce({ rows: [{ currency: 'USD', total: '19.9900' }] })
			.mockResolvedValueOnce({
				rows: [{ currency: 'USD', monthly_limit: '100.0000', warning_percent: 80 }]
			})
			.mockResolvedValueOnce({
				rows: [
					{
						id: '11111111-1111-4111-8111-111111111111',
						current_period_end: '2026-07-24',
						alert_days: [7, 3, 1],
						renews_automatically: true,
						status: 'ACTIVE'
					}
				]
			});

		const summary = await getSubscriptionSummary(
			db,
			userId,
			parseCalendarDate('2026-07-21')!
		);

		expect(summary.actualTotals).toEqual([
			{ currency: 'THB', total: '219' },
			{ currency: 'USD', total: '30.1' }
		]);
		expect(summary.forecastTotals).toEqual([{ currency: 'USD', total: '19.99' }]);
		expect(summary.budgets[0]).toMatchObject({
			actual: '30.1',
			state: 'SAFE',
			usageBasisPoints: 3010
		});
		expect(summary.urgencies[0]).toMatchObject({ daysRemaining: 3, matchedAlertDay: 3 });
	});

	it('uses current-month paid dates and the half-open day-30 forecast boundary', async () => {
		execute.mockResolvedValue({ rows: [] });

		await getSubscriptionSummary(db, userId, parseCalendarDate('2026-07-21')!);

		const values = execute.mock.calls.flatMap(([statement]) => collectPrimitiveValues(statement));
		expect(values).toEqual(
			expect.arrayContaining(['2026-07-01', '2026-08-01', '2026-08-20'])
		);
	});
});
