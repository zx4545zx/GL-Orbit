import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	parsePayment: vi.fn(),
	updatePayment: vi.fn(),
	softDeletePayment: vi.fn()
}));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/validation.js', () => ({
	parsePaymentWriteRequest: mocks.parsePayment
}));
vi.mock('$lib/server/subscriptions/mutations.js', () => ({
	updateEditablePayment: mocks.updatePayment,
	softDeleteEditablePayment: mocks.softDeletePayment
}));

const { DELETE, PATCH } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as App.Locals['user'];
const paymentId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function event(method: 'PATCH' | 'DELETE', body?: string) {
	const url = new URL(`https://example.test/api/subscription-payments/${paymentId}`);
	return {
		request: new Request(url, {
			method,
			headers: { origin: url.origin, 'content-type': 'application/json' },
			...(body === undefined ? {} : { body })
		}),
		url,
		locals: { user },
		params: { paymentId }
	} as never;
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getDb.mockResolvedValue({ marker: 'db' });
	mocks.parsePayment.mockReturnValue({ marker: 'validated' });
});

describe('/api/subscription-payments/[paymentId]', () => {
	it('hides an immutable renewal payment as 404', async () => {
		mocks.updatePayment.mockRejectedValue(new SubscriptionDomainError('PAYMENT_NOT_FOUND'));
		const response = await PATCH(event('PATCH', '{}'));
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ ok: false, code: 'PAYMENT_NOT_FOUND' });
	});

	it('corrects an initial or manual payment without touching the subscription period', async () => {
		mocks.updatePayment.mockResolvedValue({ id: paymentId });
		const response = await PATCH(event('PATCH', '{}'));
		expect(response.status).toBe(200);
		expect(mocks.updatePayment).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			paymentId,
			{ marker: 'validated' }
		);
	});

	it('soft-deletes an editable payment', async () => {
		mocks.softDeletePayment.mockResolvedValue(undefined);
		const response = await DELETE(event('DELETE'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, data: { paymentId } });
	});
});
