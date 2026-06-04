import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDb = vi.fn();

vi.mock('$lib/server/db/index.js', () => ({ getDb: mockGetDb }));
vi.mock('$lib/server/db/schema.js', () => {
	const table = (name: string) => new Proxy({}, {
		get(_, prop) {
			if (typeof prop === 'string') return { _: { name, field: prop } };
			return undefined;
		}
	});

	return {
		notifications: table('notifications'),
		series: table('series')
	};
});

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

async function jsonBody(response: Response) {
	return await response.json() as Record<string, unknown>;
}

describe('GET /api/notifications', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('starts list and count queries in parallel so the page is not delayed by sequential round trips', async () => {
		const rows = deferred<unknown[]>();
		const unread = deferred<unknown[]>();
		const total = deferred<unknown[]>();

		const select = vi.fn()
			.mockReturnValueOnce({
				from: vi.fn(() => ({
					innerJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(() => ({
								limit: vi.fn(() => ({
									offset: vi.fn(() => rows.promise)
								}))
							}))
						}))
					}))
				}))
			})
			.mockReturnValueOnce({
				from: vi.fn(() => ({
					where: vi.fn(() => unread.promise)
				}))
			})
			.mockReturnValueOnce({
				from: vi.fn(() => ({
					where: vi.fn(() => total.promise)
				}))
			});

		mockGetDb.mockResolvedValue({ select });

		const { GET } = await import('./+server.js');
		const responsePromise = GET({
			locals: { user: { id: 'user-1' } },
			url: new URL('http://localhost/api/notifications?limit=20&offset=0')
		} as never) as Promise<Response>;

		await Promise.resolve();
		await Promise.resolve();

		expect(select).toHaveBeenCalledTimes(3);

		rows.resolve([]);
		unread.resolve([{ count: 0 }]);
		total.resolve([{ count: 0 }]);

		const response = await responsePromise;
		expect(response.status).toBe(200);
		expect(await jsonBody(response)).toMatchObject({
			notifications: [],
			unreadCount: 0,
			totalCount: 0,
			hasMore: false
		});
	});
});
