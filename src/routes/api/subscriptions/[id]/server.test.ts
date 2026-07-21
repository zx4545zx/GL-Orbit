import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	getDetail: vi.fn(),
	parseUpdate: vi.fn(),
	update: vi.fn(),
	softDelete: vi.fn()
}));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/queries.js', () => ({
	getSubscriptionDetail: mocks.getDetail
}));
vi.mock('$lib/server/subscriptions/validation.js', () => ({
	parseUpdateSubscriptionRequest: mocks.parseUpdate
}));
vi.mock('$lib/server/subscriptions/mutations.js', () => ({
	updateSubscription: mocks.update,
	softDeleteSubscription: mocks.softDelete
}));

const { DELETE, GET, PATCH } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as App.Locals['user'];
const subscriptionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function event(method: 'GET' | 'PATCH' | 'DELETE', body?: string) {
	const url = new URL(`https://example.test/api/subscriptions/${subscriptionId}`);
	return {
		request: new Request(url, {
			method,
			headers: { origin: url.origin, 'content-type': 'application/json' },
			...(body === undefined ? {} : { body })
		}),
		url,
		locals: { user },
		params: { id: subscriptionId }
	} as never;
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getDb.mockResolvedValue({ marker: 'db' });
});

describe('/api/subscriptions/[id]', () => {
	it('hides a foreign subscription as 404', async () => {
		mocks.getDetail.mockRejectedValue(new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND'));
		const response = await GET(event('GET'));
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ ok: false, code: 'SUBSCRIPTION_NOT_FOUND' });
	});

	it('validates and updates using the authenticated owner', async () => {
		const parsed = { marker: 'validated' };
		mocks.parseUpdate.mockReturnValue(parsed);
		mocks.update.mockResolvedValue({ id: subscriptionId });

		const response = await PATCH(event('PATCH', '{}'));

		expect(response.status).toBe(200);
		expect(mocks.update).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			subscriptionId,
			parsed
		);
	});

	it('soft-deletes by owner and returns the resource id', async () => {
		mocks.softDelete.mockResolvedValue(undefined);
		const response = await DELETE(event('DELETE'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, data: { id: subscriptionId } });
	});
});
