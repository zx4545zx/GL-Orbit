import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), upsert: vi.fn(), remove: vi.fn() }));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/mutations.js', () => ({
	upsertSubscriptionBudget: mocks.upsert,
	deleteSubscriptionBudget: mocks.remove
}));

const { DELETE, PUT } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as App.Locals['user'];

function event(method: 'PUT' | 'DELETE', currency: string, body?: string) {
	const url = new URL(`https://example.test/api/subscription-budgets/${currency}`);
	return {
		request: new Request(url, {
			method,
			headers: { origin: url.origin, 'content-type': 'application/json' },
			...(body === undefined ? {} : { body })
		}),
		url,
		locals: { user },
		params: { currency }
	} as never;
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getDb.mockResolvedValue({ marker: 'db' });
});

describe('/api/subscription-budgets/[currency]', () => {
	it('rejects an invalid currency and invalid limit with field errors', async () => {
		const invalidCurrency = await PUT(
			event('PUT', 'XX', JSON.stringify({ monthlyLimit: '100', warningPercent: 80 }))
		);
		expect(invalidCurrency.status).toBe(422);

		const invalidLimit = await PUT(
			event('PUT', 'USD', JSON.stringify({ monthlyLimit: '0', warningPercent: 80 }))
		);
		expect(invalidLimit.status).toBe(422);
		expect(mocks.upsert).not.toHaveBeenCalled();
	});

	it('upserts a canonical per-currency budget', async () => {
		mocks.upsert.mockResolvedValue({ currency: 'USD' });
		const response = await PUT(
			event('PUT', 'usd', JSON.stringify({ monthlyLimit: '100', warningPercent: 80 }))
		);
		expect(response.status).toBe(200);
		expect(mocks.upsert).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			'USD',
			{ monthlyLimit: '100', warningPercent: 80 }
		);
	});

	it('deletes only the authenticated user budget for that currency', async () => {
		mocks.remove.mockResolvedValue(undefined);
		const response = await DELETE(event('DELETE', 'usd'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, data: { currency: 'USD' } });
	});

	it('allows deleting an uppercase legacy catalog code', async () => {
		mocks.remove.mockResolvedValue(undefined);
		const response = await DELETE(event('DELETE', 'ZZZ'));
		expect(response.status).toBe(200);
		expect(mocks.remove).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			'ZZZ'
		);
	});
});
