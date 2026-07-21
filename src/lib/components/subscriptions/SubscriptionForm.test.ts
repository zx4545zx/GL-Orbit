// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { SubscriptionApiRequestError } from '$lib/subscriptions/client.js';
import type { PlatformOption, SubscriptionDetail } from '$lib/subscriptions/types.js';
import SubscriptionForm from './SubscriptionForm.svelte';

afterEach(cleanup);

const platforms: PlatformOption[] = [
	{ id: '11111111-1111-4111-8111-111111111111', name: 'Stream One', logoUrl: null },
	{ id: '22222222-2222-4222-8222-222222222222', name: 'Stream Two', logoUrl: null }
];

const subscription: SubscriptionDetail = {
	id: '33333333-3333-4333-8333-333333333333',
	platformId: platforms[0].id,
	platform: platforms[0],
	customPlatformName: null,
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
	payments: { items: [], nextCursor: null }
};

async function fillCreateRequired(user: ReturnType<typeof userEvent.setup>) {
	await user.selectOptions(screen.getByLabelText(/platform$|^แพลตฟอร์ม$/i), platforms[0].id);
	await user.type(screen.getByLabelText(/amount|ราคา/i), '219.00');
	await waitFor(() =>
		expect((screen.getByLabelText(/current period start|วันเริ่มรอบปัจจุบัน/i) as HTMLInputElement).value).not.toBe('')
	);
}

describe('SubscriptionForm', () => {
	it('switches to a custom source and sends exact money plus normalized alert days', async () => {
		const user = userEvent.setup();
		const request = vi.fn().mockResolvedValue({ id: subscription.id });
		const onSaved = vi.fn();
		render(SubscriptionForm, {
			props: { mode: 'create', platforms, subscription: null, request, onSaved }
		});

		await user.click(screen.getByRole('radio', { name: /enter a custom name|ระบุชื่อเอง/i }));
		await user.type(screen.getByLabelText(/platform name|ชื่อแพลตฟอร์ม/i), 'Indie GL');
		await user.type(screen.getByLabelText(/amount|ราคา/i), '219.00');
		await user.clear(screen.getByLabelText(/warning lead days|แจ้งบนหน้านี้ล่วงหน้า/i));
		await user.type(screen.getByLabelText(/warning lead days|แจ้งบนหน้านี้ล่วงหน้า/i), '1, 7, 3, 7');
		await waitFor(() =>
			expect((screen.getByLabelText(/current period start|วันเริ่มรอบปัจจุบัน/i) as HTMLInputElement).value).not.toBe('')
		);
		await user.click(screen.getByRole('button', { name: /^save$|^บันทึก$/i }));

		const [url, init] = request.mock.calls[0];
		const body = JSON.parse(init.body);
		expect(url).toBe('/api/subscriptions');
		expect(init.method).toBe('POST');
		expect(body).toMatchObject({
			platformId: null,
			customPlatformName: 'Indie GL',
			amount: '219.00',
			alertDays: [7, 3, 1],
			recordInitialPayment: false,
			initialPaidDate: null
		});
		expect(onSaved).toHaveBeenCalledWith(subscription.id);
	});

	it('keeps initial payment off and reveals its paid date only when enabled', async () => {
		const user = userEvent.setup();
		render(SubscriptionForm, {
			props: {
				mode: 'create',
				platforms,
				subscription: null,
				request: vi.fn(),
				onSaved: vi.fn()
			}
		});

		const toggle = screen.getByRole('checkbox', {
			name: /record current period as paid|บันทึกรอบปัจจุบันว่าจ่ายแล้ว/i
		});
		expect((toggle as HTMLInputElement).checked).toBe(false);
		expect(screen.queryByLabelText(/^paid date$|^วันที่จ่าย$/i)).toBeNull();
		await user.click(toggle);
		expect(screen.getByLabelText(/^paid date$|^วันที่จ่าย$/i)).toBeTruthy();
	});

	it('blocks malformed warning-day tokens instead of silently dropping them', async () => {
		const user = userEvent.setup();
		const request = vi.fn();
		render(SubscriptionForm, {
			props: { mode: 'create', platforms, subscription: null, request, onSaved: vi.fn() }
		});
		await fillCreateRequired(user);
		const alerts = screen.getByLabelText(/warning lead days|แจ้งบนหน้านี้ล่วงหน้า/i);
		await user.clear(alerts);
		await user.type(alerts, '7, soon, 1');
		await user.click(screen.getByRole('button', { name: /^save$|^บันทึก$/i }));

		expect(request).not.toHaveBeenCalled();
		expect(alerts.getAttribute('aria-invalid')).toBe('true');
		expect(document.activeElement).toBe(alerts);
	});

	it('sends the complete schedule version and edit-only status', async () => {
		const user = userEvent.setup();
		const request = vi.fn().mockResolvedValue({ id: subscription.id });
		render(SubscriptionForm, {
			props: { mode: 'edit', platforms, subscription, request, onSaved: vi.fn() }
		});

		await user.selectOptions(screen.getByLabelText(/^status$|^สถานะ$/i), 'CANCELED');
		await user.click(screen.getByRole('button', { name: /^save$|^บันทึก$/i }));
		const [url, init] = request.mock.calls[0];
		expect(url).toBe(`/api/subscriptions/${subscription.id}`);
		expect(init.method).toBe('PATCH');
		expect(JSON.parse(init.body)).toMatchObject({
			status: 'CANCELED',
			expectedSchedule: subscription.scheduleVersion
		});
	});

	it('keeps values and displays matching field errors after a failed write', async () => {
		const user = userEvent.setup();
		const request = vi
			.fn()
			.mockRejectedValue(
				new SubscriptionApiRequestError(422, 'INVALID_INPUT', { amount: ['fraction_digits'] })
			);
		const onSaved = vi.fn();
		render(SubscriptionForm, {
			props: { mode: 'edit', platforms, subscription, request, onSaved }
		});
		const amount = screen.getByLabelText(/amount|ราคา/i) as HTMLInputElement;
		await user.clear(amount);
		await user.type(amount, '219.999');
		await user.click(screen.getByRole('button', { name: /^save$|^บันทึก$/i }));

		await screen.findByText(/too many fractional digits|จำนวนทศนิยม/i);
		expect(amount.value).toBe('219.999');
		expect(amount.getAttribute('aria-invalid')).toBe('true');
		expect(onSaved).not.toHaveBeenCalled();
	});

	it('locks duplicate submits and calls onSaved only after success', async () => {
		const user = userEvent.setup();
		let resolveWrite!: (value: { id: string }) => void;
		const request = vi.fn(() => new Promise<{ id: string }>((resolve) => (resolveWrite = resolve)));
		const onSaved = vi.fn();
		render(SubscriptionForm, {
			props: { mode: 'edit', platforms, subscription, request, onSaved }
		});
		const save = screen.getByRole('button', { name: /^save$|^บันทึก$/i });
		await user.dblClick(save);
		expect(request).toHaveBeenCalledOnce();
		expect(onSaved).not.toHaveBeenCalled();
		expect((screen.getByRole('button', { name: /saving|กำลังบันทึก/i }) as HTMLButtonElement).disabled).toBe(true);
		resolveWrite({ id: subscription.id });
		await waitFor(() => expect(onSaved).toHaveBeenCalledWith(subscription.id));
	});

	it('reuses the create operation ID after response loss', async () => {
		const user = userEvent.setup();
		const request = vi.fn().mockRejectedValueOnce(new Error('response lost')).mockResolvedValueOnce({ id: subscription.id });
		render(SubscriptionForm, {
			props: { mode: 'create', platforms, subscription: null, request, onSaved: vi.fn() }
		});
		await fillCreateRequired(user);
		const save = screen.getByRole('button', { name: /^save$|^บันทึก$/i });
		await user.click(save);
		await screen.findByRole('alert');
		await user.click(save);
		await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
		const first = JSON.parse(request.mock.calls[0][1].body);
		const second = JSON.parse(request.mock.calls[1][1].body);
		expect(first.operationId).toMatch(/^[0-9a-f-]{36}$/);
		expect(second.operationId).toBe(first.operationId);
	});

	it('retries navigation without repeating a confirmed write', async () => {
		const user = userEvent.setup();
		const request = vi.fn().mockResolvedValue({ id: subscription.id });
		const onSaved = vi.fn().mockRejectedValueOnce(new Error('navigation failed')).mockResolvedValueOnce(undefined);
		render(SubscriptionForm, {
			props: { mode: 'edit', platforms, subscription, request, onSaved }
		});
		const save = screen.getByRole('button', { name: /^save$|^บันทึก$/i });
		await user.click(save);
		await screen.findByRole('alert');
		await user.click(save);
		await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(2));
		expect(request).toHaveBeenCalledOnce();
	});

	it('blocks a future initial paid date using the device-local maximum', async () => {
		const user = userEvent.setup();
		const request = vi.fn();
		render(SubscriptionForm, {
			props: { mode: 'create', platforms, subscription: null, request, onSaved: vi.fn() }
		});
		await fillCreateRequired(user);
		await user.click(screen.getByRole('checkbox', { name: /record current period as paid|บันทึกรอบปัจจุบันว่าจ่ายแล้ว/i }));
		const paidDate = screen.getByLabelText(/^paid date$|^วันที่จ่าย$/i) as HTMLInputElement;
		expect(paidDate.max).not.toBe('');
		await fireEvent.input(paidDate, { target: { value: '9999-12-31' } });
		await fireEvent.submit(paidDate.closest('form')!);
		expect(request).not.toHaveBeenCalled();
		expect(paidDate.getAttribute('aria-invalid')).toBe('true');
	});

	it('requires a second explicit click before deleting', async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn();
		render(SubscriptionForm, {
			props: {
				mode: 'edit',
				platforms,
				subscription,
				request: vi.fn(),
				onSaved: vi.fn(),
				onDelete
			}
		});

		await user.click(screen.getByRole('button', { name: /delete subscription|ลบการสมัคร/i }));
		expect(onDelete).not.toHaveBeenCalled();
		await user.click(screen.getByRole('button', { name: /confirm subscription deletion|ยืนยันลบการสมัคร/i }));
		expect(onDelete).toHaveBeenCalledOnce();
	});
});
