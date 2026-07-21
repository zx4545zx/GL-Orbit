// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { SubscriptionApiRequestError } from '$lib/subscriptions/client.js';
import type { SubscriptionListItem } from '$lib/subscriptions/types.js';
import RenewalDialog from './RenewalDialog.svelte';

afterEach(cleanup);

beforeEach(() => {
	HTMLDialogElement.prototype.showModal = function () {
		this.open = true;
	};
	HTMLDialogElement.prototype.close = function () {
		this.open = false;
		this.dispatchEvent(new Event('close'));
	};
});

const subscription: SubscriptionListItem = {
	id: '11111111-1111-4111-8111-111111111111',
	platformId: null,
	customPlatformName: 'Stream GL',
	platform: null,
	planName: 'Premium',
	accountLabel: 'Main',
	amount: '219',
	currency: 'THB',
	billingUnit: 'MONTH',
	billingInterval: 1,
	currentPeriodStart: parseCalendarDate('2026-06-21')!,
	currentPeriodEnd: parseCalendarDate('2026-07-20')!,
	renewsAutomatically: true,
	status: 'ACTIVE',
	alertDays: [7, 3, 1],
	scheduleVersion: {
		currentPeriodStart: parseCalendarDate('2026-06-21')!,
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
};

describe('RenewalDialog', () => {
	it('shows effects and next period, then restores focus when canceled', async () => {
		const user = userEvent.setup();
		const trigger = document.createElement('button');
		document.body.append(trigger);
		trigger.focus();
		const onClose = vi.fn();
		render(RenewalDialog, {
			props: {
				subscription,
				open: true,
				returnFocusTo: trigger,
				onClose,
				onRenewed: vi.fn(),
				onConflict: vi.fn()
			}
		});

		const paidDate = await screen.findByLabelText(/paid date|วันที่จ่าย/i);
		await waitFor(() => expect(document.activeElement).toBe(paidDate));
		expect(screen.getByText(/one actual payment|ค่าใช้จ่ายจริง 1 รายการ/i)).toBeTruthy();
		expect(screen.getByText(/2026-07-21/)).toBeTruthy();
		expect(screen.getByText(/2026-08-20/)).toBeTruthy();
		await user.keyboard('{Escape}');
		expect(onClose).toHaveBeenCalledOnce();
		await waitFor(() => expect(document.activeElement).toBe(trigger));
	});

	it('prevents duplicate confirmation while pending and closes only after success', async () => {
		const user = userEvent.setup();
		let resolveWrite!: (value: unknown) => void;
		const request = vi.fn(() => new Promise((resolve) => (resolveWrite = resolve)));
		const onRenewed = vi.fn();
		render(RenewalDialog, {
			props: {
				subscription,
				open: true,
				returnFocusTo: null,
				onClose: vi.fn(),
				onRenewed,
				onConflict: vi.fn(),
				request
			}
		});

		const confirm = await screen.findByRole('button', { name: /confirm renewed|ยืนยัน/i });
		await user.dblClick(confirm);
		expect(request).toHaveBeenCalledOnce();
		expect((confirm as HTMLButtonElement).disabled).toBe(true);
		resolveWrite({ paymentId: 'payment' });
		await waitFor(() => expect(onRenewed).toHaveBeenCalledOnce());
	});

	it('keeps entered values visible and refreshes on a renewal conflict', async () => {
		const user = userEvent.setup();
		const request = vi
			.fn()
			.mockRejectedValue(new SubscriptionApiRequestError(409, 'RENEWAL_CONFLICT'));
		const onConflict = vi.fn();
		render(RenewalDialog, {
			props: {
				subscription,
				open: true,
				returnFocusTo: null,
				onClose: vi.fn(),
				onRenewed: vi.fn(),
				onConflict,
				request
			}
		});

		const amount = (await screen.findByLabelText(/amount|ราคา/i)) as HTMLInputElement;
		await user.clear(amount);
		await user.type(amount, '199');
		await user.click(screen.getByRole('button', { name: /confirm renewed|ยืนยัน/i }));
		await waitFor(() => expect(onConflict).toHaveBeenCalledOnce());
		expect(screen.getByRole('alert').textContent).toMatch(/period changed|ข้อมูลรอบเปลี่ยน/i);
		expect(amount.value).toBe('199');
	});

	it('blocks a future paid date using the device-local maximum', async () => {
		const user = userEvent.setup();
		const request = vi.fn();
		render(RenewalDialog, {
			props: {
				subscription,
				open: true,
				returnFocusTo: null,
				onClose: vi.fn(),
				onRenewed: vi.fn(),
				onConflict: vi.fn(),
				request
			}
		});
		const paidDate = (await screen.findByLabelText(/paid date|วันที่จ่าย/i)) as HTMLInputElement;
		expect(paidDate.max).not.toBe('');
		await fireEvent.input(paidDate, { target: { value: '9999-12-31' } });
		await fireEvent.submit(paidDate.closest('form')!);
		expect(request).not.toHaveBeenCalled();
		expect(paidDate.getAttribute('aria-invalid')).toBe('true');
	});
});
