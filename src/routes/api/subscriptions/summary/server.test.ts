import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getSummary: vi.fn() }));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/summary-query.js', () => ({
	getSubscriptionSummary: mocks.getSummary
}));

const { GET } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as App.Locals['user'];

function event(today?: string) {
	const url = new URL('https://example.test/api/subscriptions/summary');
	if (today !== undefined) url.searchParams.set('today', today);
	return {
		request: new Request(url),
		url,
		locals: { user },
		params: {}
	} as never;
}

beforeEach(() => vi.clearAllMocks());

describe('/api/subscriptions/summary', () => {
	it.each([undefined, '2026-02-31'])('rejects a missing or invalid local date', async (today) => {
		const response = await GET(event(today));
		expect(response.status).toBe(422);
		expect(mocks.getSummary).not.toHaveBeenCalled();
	});

	it('queries the authenticated user with the validated civil date', async () => {
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.getSummary.mockResolvedValue({ today: '2026-07-21', actual: [] });

		const response = await GET(event('2026-07-21'));

		expect(response.status).toBe(200);
		expect(mocks.getSummary).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			'2026-07-21'
		);
	});
});
