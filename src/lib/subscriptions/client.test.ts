import { describe, expect, it, vi } from 'vitest';
import type { FieldErrorCode, SubscriptionErrorCode } from './types.js';
import {
	deviceLocalToday,
	SubscriptionApiRequestError,
	subscriptionErrorMessage,
	subscriptionFetch,
	subscriptionFieldErrorMessage
} from './client.js';

const errorCodes: SubscriptionErrorCode[] = [
	'AUTH_REQUIRED',
	'INVALID_INPUT',
	'INTERNAL_ERROR',
	'UNSUPPORTED_CURRENCY',
	'PLATFORM_NOT_FOUND',
	'SUBSCRIPTION_NOT_FOUND',
	'PAYMENT_NOT_FOUND',
	'RENEWAL_CONFLICT',
	'RENEWAL_ALREADY_RECORDED',
	'RENEWAL_REVERSAL_NOT_ALLOWED'
];

const fieldErrorCodes: FieldErrorCode[] = [
	'required',
	'invalid',
	'too_long',
	'out_of_range',
	'future_date',
	'fraction_digits',
	'source_xor',
	'date_order',
	'duplicate'
];

describe('subscription browser helpers', () => {
	it('builds today from local fields rather than toISOString', () => {
		const value = {
			getFullYear: () => 2026,
			getMonth: () => 6,
			getDate: () => 21
		} as Date;
		expect(deviceLocalToday(value)).toBe('2026-07-21');
	});

	it('returns successful wrapped data and always requests private JSON', async () => {
		const fetcher = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true, data: { id: 'one' } }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);

		await expect(
			subscriptionFetch('/api/subscriptions', { method: 'POST', body: '{}' }, fetcher)
		).resolves.toEqual({ id: 'one' });
		expect(fetcher).toHaveBeenCalledWith(
			'/api/subscriptions',
			expect.objectContaining({ credentials: 'same-origin', cache: 'no-store' })
		);
	});

	it('throws the stable API body without treating failure as success', async () => {
		const fetcher = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: false, code: 'RENEWAL_CONFLICT' }), {
				status: 409,
				headers: { 'content-type': 'application/json' }
			})
		);

		await expect(
			subscriptionFetch('/api/subscriptions/x/renew', { method: 'POST' }, fetcher)
		).rejects.toMatchObject({
			status: 409,
			code: 'RENEWAL_CONFLICT'
		} satisfies Partial<SubscriptionApiRequestError>);
	});

	it('treats a malformed successful response as an internal failure', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response('not-json', { status: 200 }));
		await expect(subscriptionFetch('/api/subscriptions', {}, fetcher)).rejects.toMatchObject({
			status: 500,
			code: 'INTERNAL_ERROR'
		} satisfies Partial<SubscriptionApiRequestError>);
	});

	it('localizes every stable API and field error code', () => {
		for (const code of errorCodes) {
			expect(subscriptionErrorMessage(new SubscriptionApiRequestError(422, code))).not.toBe('');
		}
		for (const code of fieldErrorCodes) {
			expect(subscriptionFieldErrorMessage(code)).not.toBe('');
		}
	});
});
