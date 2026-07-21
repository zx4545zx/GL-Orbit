import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	parseCreate: vi.fn(),
	create: vi.fn(),
	list: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/validation.js', () => ({
	parseCreateSubscriptionRequest: mocks.parseCreate
}));
vi.mock('$lib/server/subscriptions/mutations.js', () => ({
	createSubscription: mocks.create
}));
vi.mock('$lib/server/subscriptions/queries.js', () => ({
	listSubscriptions: mocks.list
}));

const { GET, POST } = await import('./+server.js');

const user = {
	id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	role: 'USER'
} as App.Locals['user'];

function event(
	body: string | undefined,
	eventUser: App.Locals['user'] = user,
	method: 'GET' | 'POST' = 'POST'
) {
	const url = new URL('https://example.test/api/subscriptions');
	return {
		request: new Request(url, {
			method,
			headers: { origin: url.origin, 'content-type': 'application/json' },
			...(body === undefined ? {} : { body })
		}),
		url,
		locals: { user: eventUser },
		params: {}
	} as never;
}

beforeEach(() => vi.clearAllMocks());

describe('/api/subscriptions', () => {
	it('lists only the authenticated user subscriptions', async () => {
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.list.mockResolvedValue([{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }]);

		const response = await GET(event(undefined, user, 'GET'));

		expect(response.status).toBe(200);
		expect(mocks.list).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
		);
	});

	it('requires authentication before opening a database connection', async () => {
		const response = await POST(event('{}', null));
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ ok: false, code: 'AUTH_REQUIRED' });
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('rejects malformed JSON before invoking the mutation', async () => {
		const response = await POST(event('{'));
		expect(response.status).toBe(400);
		expect(mocks.create).not.toHaveBeenCalled();
	});

	it('creates only after validation', async () => {
		const parsed = { marker: 'validated' };
		mocks.parseCreate.mockReturnValue(parsed);
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.create.mockResolvedValue({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' });

		const response = await POST(event('{}'));

		expect(response.status).toBe(201);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(mocks.create).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			parsed
		);
	});
});
