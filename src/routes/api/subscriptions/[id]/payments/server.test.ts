import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	parsePayment: vi.fn(),
	createPayment: vi.fn(),
	updateSubscription: vi.fn(),
	listPayments: vi.fn()
}));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/validation.js', () => ({
	parseCreatePaymentRequest: mocks.parsePayment
}));
vi.mock('$lib/server/subscriptions/mutations.js', () => ({
	createManualPayment: mocks.createPayment,
	updateSubscription: mocks.updateSubscription
}));
vi.mock('$lib/server/subscriptions/queries.js', () => ({
	listSubscriptionPayments: mocks.listPayments
}));

const { GET, POST } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as App.Locals['user'];
const subscriptionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function event(
	eventUser: App.Locals['user'] = user,
	method: 'GET' | 'POST' = 'POST',
	search = ''
) {
	const url = new URL(`https://example.test/api/subscriptions/${subscriptionId}/payments${search}`);
	return {
		request: new Request(url, {
			method,
			headers: method === 'POST' ? { origin: url.origin, 'content-type': 'application/json' } : undefined,
			body: method === 'POST' ? '{}' : undefined
		}),
		url,
		locals: { user: eventUser },
		params: { id: subscriptionId }
	} as never;
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/subscriptions/[id]/payments', () => {
	it('returns an owned 25-row payment page using the opaque cursor', async () => {
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.listPayments.mockResolvedValue({ items: [{ id: 'payment' }], nextCursor: 'next' });

		const response = await GET(event(user, 'GET', '?cursor=opaque'));

		expect(response.status).toBe(200);
		expect(mocks.listPayments).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			subscriptionId,
			'opaque',
			25
		);
		expect(response.headers.get('cache-control')).toContain('no-store');
	});

	it('returns 422 for a malformed non-empty cursor', async () => {
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.listPayments.mockRejectedValue(
			new SubscriptionDomainError('INVALID_INPUT', { cursor: ['invalid'] })
		);

		const response = await GET(event(user, 'GET', '?cursor=bad'));

		expect(response.status).toBe(422);
		expect(await response.json()).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
	});
});

describe('POST /api/subscriptions/[id]/payments', () => {
	it('requires authentication before opening a database connection', async () => {
		const response = await POST(event(null));
		expect(response.status).toBe(401);
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('hides a foreign or deleted subscription as 404', async () => {
		mocks.parsePayment.mockReturnValue({ marker: 'validated' });
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.createPayment.mockRejectedValue(
			new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND')
		);
		const response = await POST(event());
		expect(response.status).toBe(404);
	});

	it('creates one validated manual payment without changing a period', async () => {
		const parsed = {
			operationId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
			amount: '219',
			currency: 'THB',
			paidDate: '2026-07-21',
			servicePeriodStart: '2026-07-01',
			servicePeriodEnd: '2026-07-31'
		};
		mocks.parsePayment.mockReturnValue(parsed);
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.createPayment.mockResolvedValue({
			id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
		});

		const response = await POST(event());

		expect(response.status).toBe(201);
		expect(mocks.createPayment).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			subscriptionId,
			parsed
		);
		expect(mocks.updateSubscription).not.toHaveBeenCalled();
	});
});
