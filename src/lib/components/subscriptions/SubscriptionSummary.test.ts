// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import type {
	SubscriptionListItem,
	SubscriptionSummary as Summary
} from '$lib/subscriptions/types.js';
import SubscriptionSummary from './SubscriptionSummary.svelte';

afterEach(cleanup);

const subscriptions: SubscriptionListItem[] = [
	{
		id: '11111111-1111-4111-8111-111111111111',
		platformId: '22222222-2222-4222-8222-222222222222',
		customPlatformName: null,
		platform: {
			id: '22222222-2222-4222-8222-222222222222',
			name: 'Stream GL',
			logoUrl: null
		},
		planName: 'Premium',
		accountLabel: 'Main',
		amount: '219',
		currency: 'THB',
		billingUnit: 'MONTH',
		billingInterval: 1,
		currentPeriodStart: parseCalendarDate('2026-06-22')!,
		currentPeriodEnd: parseCalendarDate('2026-07-20')!,
		renewsAutomatically: true,
		status: 'ACTIVE',
		alertDays: [7, 3, 1],
		scheduleVersion: {
			currentPeriodStart: parseCalendarDate('2026-06-22')!,
			currentPeriodEnd: parseCalendarDate('2026-07-20')!,
			renewalAnchorDate: parseCalendarDate('2026-07-21')!,
			renewalSequence: 0,
			billingUnit: 'MONTH',
			billingInterval: 1
		},
		nextPeriod: {
			start: parseCalendarDate('2026-07-21')!,
			end: parseCalendarDate('2026-08-20')!
		},
		relatedSeries: [],
		relatedSeriesRemaining: 0
	}
];

const summary: Summary = {
	today: parseCalendarDate('2026-07-21')!,
	monthStart: parseCalendarDate('2026-07-01')!,
	monthEndExclusive: parseCalendarDate('2026-08-01')!,
	forecastEndExclusive: parseCalendarDate('2026-08-20')!,
	actualTotals: [
		{ currency: 'THB', total: '500' },
		{ currency: 'USD', total: '10' }
	],
	forecastTotals: [{ currency: 'THB', total: '219' }],
	budgets: [
		{
			currency: 'THB',
			actual: '500',
			monthlyLimit: '600',
			warningPercent: 80,
			state: 'NEAR',
			usageBasisPoints: 8333
		}
	],
	urgencies: [
		{
			subscriptionId: subscriptions[0].id,
			daysRemaining: -1,
			state: 'EXPIRED',
			matchedAlertDay: null,
			awaitingConfirmation: true
		}
	],
	counts: { expired: 1, dueToday: 0, awaitingConfirmation: 1 }
};

describe('SubscriptionSummary', () => {
	it('keeps actual, forecast, budgets, and alerts visibly separate', () => {
		const { container } = render(SubscriptionSummary, {
			props: { summary, subscriptions, loading: false, error: null, onRetry: vi.fn() }
		});

		expect(screen.getByRole('heading', { name: /จ่ายจริงเดือนนี้|Paid this month/i })).toBeTruthy();
		expect(screen.getByRole('heading', { name: /คาดการณ์ 30 วัน|30 days forecast/i })).toBeTruthy();
		expect(container.querySelector('[data-section="actual"]')?.textContent).toContain('500');
		expect(container.querySelector('[data-section="forecast"]')?.textContent).toContain('219');
		expect(container.querySelector('[data-currency="THB"]')).toBeTruthy();
		expect(container.querySelector('[data-budget-state="NEAR"]')).toBeTruthy();
		expect(container.querySelector('[data-section="alerts"]')?.textContent).toContain('Stream GL');
		expect(container.querySelector('[aria-busy="true"]')).toBeNull();
	});

	it('renders only a local skeleton while loading', () => {
		const { container } = render(SubscriptionSummary, {
			props: { summary: null, subscriptions, loading: true, error: null, onRetry: vi.fn() }
		});
		expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
		expect(container.querySelector('[data-section="actual"]')).toBeNull();
	});

	it('renders a retry action without stale totals on failure', async () => {
		const onRetry = vi.fn();
		const { container } = render(SubscriptionSummary, {
			props: { summary, subscriptions, loading: false, error: 'network failed', onRetry }
		});
		expect(screen.getByRole('alert').textContent).toContain('network failed');
		expect(container.querySelector('[data-section="actual"]')).toBeNull();
		await screen.getByRole('button', { name: /ลองอีกครั้ง|try again/i }).click();
		expect(onRetry).toHaveBeenCalledOnce();
	});
});
