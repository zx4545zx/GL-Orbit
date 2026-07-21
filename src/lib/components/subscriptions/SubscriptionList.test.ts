// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import type { SubscriptionListItem } from '$lib/subscriptions/types.js';
import SubscriptionList from './SubscriptionList.svelte';

afterEach(cleanup);

function item(
	id: string,
	overrides: Partial<SubscriptionListItem> = {}
): SubscriptionListItem {
	return {
		id,
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
		currentPeriodStart: parseCalendarDate('2026-07-01')!,
		currentPeriodEnd: parseCalendarDate('2026-07-31')!,
		renewsAutomatically: true,
		status: 'ACTIVE',
		alertDays: [7, 3, 1],
		scheduleVersion: {
			currentPeriodStart: parseCalendarDate('2026-07-01')!,
			currentPeriodEnd: parseCalendarDate('2026-07-31')!,
			renewalAnchorDate: parseCalendarDate('2026-08-01')!,
			renewalSequence: 0,
			billingUnit: 'MONTH',
			billingInterval: 1
		},
		nextPeriod: {
			start: parseCalendarDate('2026-08-01')!,
			end: parseCalendarDate('2026-08-31')!
		},
		relatedSeries: [],
		relatedSeriesRemaining: 0,
		...overrides
	};
}

const subscriptions = [
	item('11111111-1111-4111-8111-111111111111', {
		planName: 'Premium',
		accountLabel: 'Main',
		relatedSeries: [
			{ id: 's1', titleTh: 'หนึ่ง', titleEn: 'One', posterUrl: null },
			{ id: 's2', titleTh: null, titleEn: 'Two', posterUrl: null },
			{ id: 's3', titleTh: null, titleEn: 'Three', posterUrl: null }
		],
		relatedSeriesRemaining: 2
	}),
	item('33333333-3333-4333-8333-333333333333', {
		planName: 'Mobile',
		accountLabel: 'Sister',
		status: 'CANCELED'
	}),
	item('44444444-4444-4444-8444-444444444444', {
		platformId: null,
		platform: null,
		customPlatformName: 'Indie GL',
		planName: 'Supporter',
		relatedSeries: [],
		relatedSeriesRemaining: 0
	})
];

describe('SubscriptionList', () => {
	it('searches identity fields and preserves duplicate platform plans', async () => {
		const user = userEvent.setup();
		render(SubscriptionList, {
			props: {
				subscriptions,
				today: parseCalendarDate('2026-07-21')!,
				onRenew: vi.fn()
			}
		});

		expect(screen.getAllByText('Stream GL')).toHaveLength(2);
		await user.type(screen.getByRole('searchbox'), 'Sister');
		expect(screen.getByText('Mobile')).toBeTruthy();
		expect(screen.queryByText('Premium')).toBeNull();
		await user.clear(screen.getByRole('searchbox'));
		await user.click(screen.getByRole('button', { name: /ยกเลิก|canceled/i }));
		expect(screen.getByText('Mobile')).toBeTruthy();
		expect(screen.queryByText('Premium')).toBeNull();
	});

	it('omits inferred series for custom platforms and shows catalog remainder', () => {
		const { container } = render(SubscriptionList, {
			props: {
				subscriptions,
				today: parseCalendarDate('2026-07-21')!,
				onRenew: vi.fn()
			}
		});
		const custom = container.querySelector('[data-subscription-id="44444444-4444-4444-8444-444444444444"]')!;
		expect(custom.querySelector('[data-related-series]')).toBeNull();
		expect(screen.getByText('+2')).toBeTruthy();
	});

	it('gives renew and manage actions accessible touch targets', () => {
		render(SubscriptionList, {
			props: {
				subscriptions,
				today: parseCalendarDate('2026-07-21')!,
				onRenew: vi.fn()
			}
		});
		const row = screen.getByText('Premium').closest('[data-subscription-id]')!;
		const rowQueries = within(row as HTMLElement);
		for (const control of [...rowQueries.getAllByRole('button'), ...rowQueries.getAllByRole('link')]) {
			expect(control.className).toMatch(/touch-target|min-h-11/);
		}
	});
});
