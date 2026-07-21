import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), parseReverse: vi.fn(), reverse: vi.fn() }));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/validation.js', () => ({
	parseReverseRenewalRequest: mocks.parseReverse
}));
vi.mock('$lib/server/subscriptions/mutations.js', () => ({
	reverseLatestRenewal: mocks.reverse
}));

const { POST } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as App.Locals['user'];
const subscriptionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function event() {
	const url = new URL(
		`https://example.test/api/subscriptions/${subscriptionId}/reverse-latest-renewal`
	);
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
	mocks.parseReverse.mockReturnValue({
		paymentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
	});
});

describe('/api/subscriptions/[id]/reverse-latest-renewal', () => {
	it('maps an ineligible reversal to the stable conflict', async () => {
		mocks.reverse.mockRejectedValue(
			new SubscriptionDomainError('RENEWAL_REVERSAL_NOT_ALLOWED')
		);
		const response = await POST(event());
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			ok: false,
			code: 'RENEWAL_REVERSAL_NOT_ALLOWED'
		});
	});

	it('returns the restored period after an eligible reversal', async () => {
		const result = {
			paymentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
			currentPeriodStart: '2026-07-25',
			currentPeriodEnd: '2026-08-24',
			renewalSequence: 0
		};
		mocks.reverse.mockResolvedValue(result);
		const response = await POST(event());
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, data: result });
	});
});
