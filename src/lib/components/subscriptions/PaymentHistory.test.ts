// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { SubscriptionApiRequestError } from '$lib/subscriptions/client.js';
import type { PaymentItem, PaymentPage } from '$lib/subscriptions/types.js';
import PaymentHistory from './PaymentHistory.svelte';

afterEach(cleanup);

const subscriptionId = '11111111-1111-4111-8111-111111111111';

function payment(
	id: string,
	kind: PaymentItem['kind'],
	overrides: Partial<PaymentItem> = {}
): PaymentItem {
	return {
		id,
		kind,
		amount: '219',
		currency: 'THB',
		paidDate: parseCalendarDate('2026-07-01')!,
		servicePeriodStart: parseCalendarDate('2026-07-01')!,
		servicePeriodEnd: parseCalendarDate('2026-07-31')!,
		createdAt: '2026-07-01T10:00:00.000Z',
		canEdit: kind !== 'RENEWAL',
		canDelete: kind !== 'RENEWAL',
		canReverse: false,
		...overrides
	};
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

describe('PaymentHistory', () => {
	it('loads the exact opaque cursor and appends each authoritative row once', async () => {
		const user = userEvent.setup();
		const first = payment('payment-1', 'INITIAL');
		const second = payment('payment-2', 'MANUAL');
		const request = vi.fn().mockResolvedValue({ items: [first, second], nextCursor: null });
		const onChanged = vi.fn();
		render(PaymentHistory, {
			props: {
				subscriptionId,
				page: { items: [first], nextCursor: 'opaque +/=' },
				request,
				onChanged
			}
		});

		await user.click(screen.getByRole('button', { name: /load more|โหลดเพิ่ม/i }));

		expect(request).toHaveBeenCalledWith(
			`/api/subscriptions/${subscriptionId}/payments?cursor=opaque%20%2B%2F%3D`
		);
		expect(screen.getAllByTestId('payment-row-payment-1')).toHaveLength(1);
		expect(screen.getByTestId('payment-row-payment-2')).toBeTruthy();
		expect(onChanged).not.toHaveBeenCalled();
	});

	it('allows initial/manual corrections but keeps renewal rows immutable', () => {
		const initial = payment('payment-initial', 'INITIAL');
		const manual = payment('payment-manual', 'MANUAL');
		const renewal = payment('payment-renewal', 'RENEWAL');
		render(PaymentHistory, {
			props: {
				subscriptionId,
				page: { items: [initial, manual, renewal], nextCursor: null },
				request: vi.fn(),
				onChanged: vi.fn()
			}
		});

		for (const id of ['payment-initial', 'payment-manual']) {
			const row = within(screen.getByTestId(`payment-row-${id}`));
			expect(row.getByRole('button', { name: /edit payment|แก้ไขรายการจ่าย/i })).toBeTruthy();
			expect(row.getByRole('button', { name: /delete payment|ลบรายการจ่าย/i })).toBeTruthy();
		}
		const renewalRow = within(screen.getByTestId('payment-row-payment-renewal'));
		expect(renewalRow.queryByRole('button', { name: /edit payment|แก้ไขรายการจ่าย/i })).toBeNull();
		expect(renewalRow.queryByRole('button', { name: /delete payment|ลบรายการจ่าย/i })).toBeNull();
		expect(renewalRow.getByText(/cannot be edited|แก้หรือลบโดยตรงไม่ได้/i)).toBeTruthy();
	});

	it('patches exact payment values and refreshes only after write success', async () => {
		const user = userEvent.setup();
		const row = payment('payment-1', 'MANUAL');
		const write = deferred<unknown>();
		const request = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => write.promise);
		const onChanged = vi.fn().mockResolvedValue({ items: [row], nextCursor: null });
		render(PaymentHistory, {
			props: { subscriptionId, page: { items: [row], nextCursor: null }, request, onChanged }
		});

		await user.click(
			within(screen.getByTestId('payment-row-payment-1')).getByRole('button', {
				name: /edit payment|แก้ไขรายการจ่าย/i
			})
		);
		const amount = screen.getByLabelText(/amount|ราคา/i) as HTMLInputElement;
		await user.clear(amount);
		await user.type(amount, '199.50');
		await user.click(screen.getByRole('button', { name: /save payment|บันทึกรายการจ่าย/i }));

		expect(request).toHaveBeenCalledOnce();
		const [url, init] = request.mock.calls[0]!;
		expect(url).toBe('/api/subscription-payments/payment-1');
		expect(url).not.toContain(`/api/subscriptions/${subscriptionId}`);
		expect(init?.method).toBe('PATCH');
		expect(JSON.parse(String(init?.body))).toEqual({
			amount: '199.50',
			currency: 'THB',
			paidDate: '2026-07-01',
			servicePeriodStart: '2026-07-01',
			servicePeriodEnd: '2026-07-31'
		});
		expect(screen.getByTestId('payment-row-payment-1')).toBeTruthy();
		expect(onChanged).not.toHaveBeenCalled();
		write.resolve({ id: 'payment-1' });
		await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
	});

	it('requires a second delete click and retains the row until authoritative refresh', async () => {
		const user = userEvent.setup();
		const row = payment('payment-1', 'INITIAL');
		const write = deferred<unknown>();
		const request = vi.fn(() => write.promise);
		const onChanged = vi.fn().mockResolvedValue({ items: [], nextCursor: null });
		render(PaymentHistory, {
			props: { subscriptionId, page: { items: [row], nextCursor: null }, request, onChanged }
		});

		await user.click(screen.getByRole('button', { name: /delete payment|ลบรายการจ่าย/i }));
		expect(request).not.toHaveBeenCalled();
		await user.click(
			screen.getByRole('button', { name: /confirm payment deletion|ยืนยันลบรายการนี้/i })
		);
		expect(request).toHaveBeenCalledWith('/api/subscription-payments/payment-1', {
			method: 'DELETE'
		});
		expect(screen.getByTestId('payment-row-payment-1')).toBeTruthy();
		write.resolve({ paymentId: 'payment-1' });
		await waitFor(() => expect(screen.queryByTestId('payment-row-payment-1')).toBeNull());
	});

	it('offers reversal only for the eligible renewal and waits before refreshing', async () => {
		const user = userEvent.setup();
		const latest = payment('renewal-latest', 'RENEWAL', { canReverse: true });
		const older = payment('renewal-older', 'RENEWAL');
		const write = deferred<unknown>();
		const request = vi.fn(() => write.promise);
		const onChanged = vi.fn().mockResolvedValue({ items: [older], nextCursor: null });
		render(PaymentHistory, {
			props: {
				subscriptionId,
				page: { items: [latest, older], nextCursor: null },
				request,
				onChanged
			}
		});

		expect(screen.getAllByText(/cannot be edited|แก้หรือลบโดยตรงไม่ได้/i)).toHaveLength(2);
		expect(screen.getAllByRole('button', { name: /reverse latest renewal|ย้อนรายการต่ออายุล่าสุด/i })).toHaveLength(1);
		await user.click(
			screen.getByRole('button', { name: /reverse latest renewal|ย้อนรายการต่ออายุล่าสุด/i })
		);
		await user.click(
			screen.getByRole('button', { name: /confirm renewal reversal|ยืนยันย้อนรายการต่ออายุ/i })
		);
		expect(request).toHaveBeenCalledWith(
			`/api/subscriptions/${subscriptionId}/reverse-latest-renewal`,
			{ method: 'POST', body: JSON.stringify({ paymentId: 'renewal-latest' }) }
		);
		expect(onChanged).not.toHaveBeenCalled();
		expect(screen.getByTestId('payment-row-renewal-latest')).toBeTruthy();
		write.resolve({ paymentId: 'renewal-latest' });
		await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
	});

	it('preserves editable values and rows when a write fails', async () => {
		const user = userEvent.setup();
		const row = payment('payment-1', 'MANUAL');
		const request = vi
			.fn()
			.mockRejectedValue(
				new SubscriptionApiRequestError(422, 'INVALID_INPUT', { amount: ['fraction_digits'] })
			);
		const onChanged = vi.fn();
		render(PaymentHistory, {
			props: { subscriptionId, page: { items: [row], nextCursor: null }, request, onChanged }
		});

		await user.click(screen.getByRole('button', { name: /edit payment|แก้ไขรายการจ่าย/i }));
		const amount = screen.getByLabelText(/amount|ราคา/i) as HTMLInputElement;
		await user.clear(amount);
		await user.type(amount, '219.999');
		await user.click(screen.getByRole('button', { name: /save payment|บันทึกรายการจ่าย/i }));

		await screen.findByRole('alert');
		expect(amount.value).toBe('219.999');
		expect(amount.getAttribute('aria-invalid')).toBe('true');
		expect(screen.getByTestId('payment-row-payment-1')).toBeTruthy();
		expect(onChanged).not.toHaveBeenCalled();
	});

	it('replaces stale local pagination state when the incoming first page changes', async () => {
		const stale = payment('stale', 'INITIAL');
		const refreshed = payment('refreshed', 'MANUAL');
		const firstPage: PaymentPage = { items: [stale], nextCursor: 'old-cursor' };
		const refreshedFirstPage: PaymentPage = { items: [refreshed], nextCursor: null };
		const view = render(PaymentHistory, {
			props: { subscriptionId, page: firstPage, request: vi.fn(), onChanged: vi.fn() }
		});

		await view.rerender({
			subscriptionId,
			page: refreshedFirstPage,
			request: vi.fn(),
			onChanged: vi.fn()
		});

		await waitFor(() => expect(screen.queryByTestId('payment-row-stale')).toBeNull());
		expect(screen.getByTestId('payment-row-refreshed')).toBeTruthy();
		expect(screen.queryByRole('button', { name: /load more|โหลดเพิ่ม/i })).toBeNull();
	});

	it('reuses a manual-payment operation ID after response loss', async () => {
		const user = userEvent.setup();
		const request = vi.fn().mockRejectedValueOnce(new Error('response lost')).mockResolvedValueOnce({ id: 'new' });
		const onChanged = vi.fn().mockResolvedValue({ items: [], nextCursor: null });
		render(PaymentHistory, { props: { subscriptionId, page: { items: [], nextCursor: null }, request, onChanged } });
		await user.click(screen.getByRole('button', { name: /add payment|เพิ่มรายการจ่าย/i }));
		await user.type(screen.getByLabelText(/amount|ราคา/i), '100');
		const save = screen.getByRole('button', { name: /save payment|บันทึกรายการจ่าย/i });
		await user.click(save);
		await screen.findByRole('alert');
		await user.click(save);
		await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
		const first = JSON.parse(request.mock.calls[0][1].body);
		const second = JSON.parse(request.mock.calls[1][1].body);
		expect(first.operationId).toMatch(/^[0-9a-f-]{36}$/);
		expect(second.operationId).toBe(first.operationId);
	});

	it('retries authoritative refresh without repeating a confirmed manual write', async () => {
		const user = userEvent.setup();
		const request = vi.fn().mockResolvedValue({ id: 'new' });
		const onChanged = vi.fn().mockRejectedValueOnce(new Error('refresh failed')).mockResolvedValueOnce({ items: [], nextCursor: null });
		render(PaymentHistory, { props: { subscriptionId, page: { items: [], nextCursor: null }, request, onChanged } });
		await user.click(screen.getByRole('button', { name: /add payment|เพิ่มรายการจ่าย/i }));
		await user.type(screen.getByLabelText(/amount|ราคา/i), '100');
		const save = screen.getByRole('button', { name: /save payment|บันทึกรายการจ่าย/i });
		await user.click(save);
		await screen.findByRole('alert');
		await user.click(save);
		await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(2));
		expect(request).toHaveBeenCalledOnce();
	});

	it('blocks future paid dates using the device-local maximum', async () => {
		const user = userEvent.setup();
		const request = vi.fn();
		render(PaymentHistory, { props: { subscriptionId, page: { items: [], nextCursor: null }, request, onChanged: vi.fn() } });
		await user.click(screen.getByRole('button', { name: /add payment|เพิ่มรายการจ่าย/i }));
		await user.type(screen.getByLabelText(/amount|ราคา/i), '100');
		const paidDate = screen.getByLabelText(/^paid date$|^วันที่จ่าย$/i) as HTMLInputElement;
		expect(paidDate.max).not.toBe('');
		await fireEvent.input(paidDate, { target: { value: '9999-12-31' } });
		await fireEvent.submit(paidDate.closest('form')!);
		expect(request).not.toHaveBeenCalled();
		expect(paidDate.getAttribute('aria-invalid')).toBe('true');
	});
});
