import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '$lib/server/db/index.js';
import {
	getSubscriptionDetail,
	listCurrencyOptions,
	listSubscriptionPayments,
	listSubscriptions
} from './queries.js';

const execute = vi.fn();
const db = { execute } as unknown as Db;
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const subscriptionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

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

const subscriptionRow = {
	id: subscriptionId,
	platform_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
	platform_name: 'Stream GL',
	platform_logo_url: null,
	custom_platform_name: null,
	plan_name: 'Premium',
	account_label: 'Family',
	amount: '219.0000',
	currency: 'THB',
	billing_unit: 'MONTH',
	billing_interval: 1,
	current_period_start: '2026-07-25',
	current_period_end: '2026-08-24',
	renewal_anchor_date: '2026-08-25',
	renewal_sequence: 0,
	renews_automatically: true,
	status: 'ACTIVE',
	alert_days: [7, 3, 1],
	related_series: [
		{
			id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
			titleTh: 'เรื่องหนึ่ง',
			titleEn: 'One',
			posterUrl: null
		}
	],
	related_series_count: 4
};

beforeEach(() => execute.mockReset());

describe('subscription owned queries', () => {
	it('lists only active currencies in catalog order', async () => {
		execute.mockResolvedValueOnce({
			rows: [
				{ code: 'THB', name_th: 'บาทไทย', name_en: 'Thai Baht', minor_unit: 2 },
				{ code: 'JPY', name_th: 'เยนญี่ปุ่น', name_en: 'Japanese Yen', minor_unit: 0 }
			]
		});

		await expect(listCurrencyOptions(db)).resolves.toEqual([
			{ code: 'THB', nameTh: 'บาทไทย', nameEn: 'Thai Baht', minorUnit: 2 },
			{ code: 'JPY', nameTh: 'เยนญี่ปุ่น', nameEn: 'Japanese Yen', minorUnit: 0 }
		]);
		const statement = sqlText(execute.mock.calls[0][0]);
		expect(statement).toContain('is_active');
		expect(statement).toContain('sort_order');
	});
	it('maps exact decimals, CAS schedule, next period, and related-series remainder', async () => {
		execute.mockResolvedValueOnce({ rows: [subscriptionRow] });

		const result = await listSubscriptions(db, userId);

		expect(result[0]).toMatchObject({
			amount: '219',
			scheduleVersion: { currentPeriodEnd: '2026-08-24', renewalSequence: 0 },
			nextPeriod: { start: '2026-08-25', end: '2026-09-24' },
			relatedSeriesRemaining: 3
		});
	});

	it('returns the same not-found error when the owned row is absent', async () => {
		execute.mockResolvedValueOnce({ rows: [] });

		await expect(getSubscriptionDetail(db, userId, subscriptionId)).rejects.toMatchObject({
			code: 'SUBSCRIPTION_NOT_FOUND',
			status: 404
		});
	});

	it('deduplicates central-platform series from schedule and episode links', async () => {
		execute
			.mockResolvedValueOnce({
				rows: [{ ...subscriptionRow, related_series: [], related_series_count: 0 }]
			})
			.mockResolvedValueOnce({
				rows: [
					{
						id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
						title_th: 'เรื่องหนึ่ง',
						title_en: 'One',
						poster_url: null
					},
					{
						id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
						title_th: 'เรื่องหนึ่ง',
						title_en: 'One',
						poster_url: null
					}
				]
			})
			.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] })
			.mockResolvedValueOnce({ rows: [] });

		const detail = await getSubscriptionDetail(db, userId, subscriptionId);

		expect(detail.relatedSeries).toEqual([
			{
				id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
				titleTh: 'เรื่องหนึ่ง',
				titleEn: 'One',
				posterUrl: null
			}
		]);
	});

	it('uses a 25-row cursor page and marks renewal rows immutable', async () => {
		execute
			.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] })
			.mockResolvedValueOnce({
				rows: Array.from({ length: 26 }, (_, index) => ({
					id: `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`,
					kind: index === 0 ? 'RENEWAL' : 'MANUAL',
					amount: '10.0000',
					currency: 'USD',
					paid_date: '2026-07-21',
					service_period_start: '2026-07-01',
					service_period_end: '2026-07-31',
					created_at: `2026-07-21T10:00:${String(index).padStart(2, '0')}.000Z`,
					can_reverse: index === 0
				}))
			});

		const page = await listSubscriptionPayments(db, userId, subscriptionId, null, 25);

		expect(page.items).toHaveLength(25);
		expect(page.nextCursor).not.toBeNull();
		expect(page.items[0]).toMatchObject({
			canEdit: false,
			canDelete: false,
			canReverse: true
		});
	});
});
