import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), parseRenew: vi.fn(), renew: vi.fn() }));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/validation.js', () => ({
	parseRenewSubscriptionRequest: mocks.parseRenew
}));
vi.mock('$lib/server/subscriptions/mutations.js', () => ({
	renewSubscription: mocks.renew
}));

const { POST } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as App.Locals['user'];
const subscriptionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function event() {
	const url = new URL(`https://example.test/api/subscriptions/${subscriptionId}/renew`);
	return {
		request: new Request(url, {
			method: 'POST',
			headers: { origin: url.origin, 'content-type': 'application/json' },
			body: '{}'
		}),
		url,
		locals: { user },
		params: { id: subscriptionId }
	} as never;
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getDb.mockResolvedValue({ marker: 'db' });
	mocks.parseRenew.mockReturnValue({ marker: 'validated' });
});

describe('/api/subscriptions/[id]/renew', () => {
	it('maps a duplicate confirmation to the stable conflict', async () => {
		mocks.renew.mockRejectedValue(
			new SubscriptionDomainError('RENEWAL_ALREADY_RECORDED')
		);
		const response = await POST(event());
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			ok: false,
			code: 'RENEWAL_ALREADY_RECORDED'
		});
	});

	it('returns only after the confirmed mutation succeeds', async () => {
		const result = {
			paymentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
			currentPeriodStart: '2026-08-25',
			currentPeriodEnd: '2026-09-24',
			renewalSequence: 1
		};
		mocks.renew.mockResolvedValue(result);
		const response = await POST(event());
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, data: result });
	});
});
