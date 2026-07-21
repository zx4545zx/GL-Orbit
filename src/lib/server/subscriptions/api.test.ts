import { describe, expect, it, vi } from 'vitest';
import { SubscriptionDomainError } from './errors.js';
import {
	apiSuccess,
	handleSubscriptionApi,
	readJsonObject,
	requireApiUser,
	requireMutationOrigin,
	serverValidationToday
} from './api.js';

describe('subscription API transport', () => {
	it('returns private no-store success responses', async () => {
		const response = apiSuccess({ id: 'one' }, 201);
		expect(response.status).toBe(201);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(await response.json()).toEqual({ ok: true, data: { id: 'one' } });
	});

	it('maps stable domain failures without exposing internal messages', async () => {
		const response = await handleSubscriptionApi(async () => {
			throw new SubscriptionDomainError('RENEWAL_CONFLICT');
		});
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ ok: false, code: 'RENEWAL_CONFLICT' });
	});

	it('maps malformed JSON to 400 and unknown errors to a generic 500', async () => {
		const malformed = new Request('https://example.test/api/subscriptions', {
			method: 'POST',
			body: '{'
		});
		await expect(readJsonObject(malformed)).rejects.toMatchObject({ status: 400 });
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const response = await handleSubscriptionApi(async () => {
			throw new Error('secret database detail');
		});
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ ok: false, code: 'INTERNAL_ERROR' });
		consoleError.mockRestore();
	});

	it('requires auth and an exact mutation origin', () => {
		expect(() => requireApiUser(null)).toThrowError(
			expect.objectContaining({ code: 'AUTH_REQUIRED' })
		);
		expect(() =>
			requireMutationOrigin(
				new Request('https://example.test/api', {
					method: 'POST',
					headers: { origin: 'https://evil.test' }
				}),
				new URL('https://example.test/api')
			)
		).toThrowError(expect.objectContaining({ status: 400 }));
	});

	it('constructs the server tolerance date without ISO conversion', () => {
		expect(serverValidationToday(new Date('2026-07-21T23:30:00.000Z'))).toBe('2026-07-21');
	});
});
