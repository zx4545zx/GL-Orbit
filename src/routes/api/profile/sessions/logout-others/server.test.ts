import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	checkRateLimit: vi.fn(),
	rateLimitKey: vi.fn((action: string, userId: string) => `${action}:${userId}`)
}));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/rate-limit/index.js', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('$lib/server/rate-limit/keys.js', () => ({ rateLimitKey: mocks.rateLimitKey }));

const { POST } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as NonNullable<App.Locals['user']>;
const currentSession = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' } as NonNullable<
	App.Locals['session']
>;

function makeDb(rows: unknown[]) {
	const returning = vi.fn().mockResolvedValue(rows);
	const where = vi.fn(() => ({ returning }));
	return { db: { delete: vi.fn(() => ({ where })) }, where, returning };
}

describe('POST /api/profile/sessions/logout-others', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
	});

	it('requires both authenticated locals', async () => {
		const response = await POST({ locals: { session: currentSession } } as never);
		expect(response.status).toBe(401);
	});

	it('returns Retry-After when rate limited', async () => {
		mocks.checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 28 });
		const response = await POST({ locals: { user, session: currentSession } } as never);
		expect(response.status).toBe(429);
		expect(response.headers.get('Retry-After')).toBe('28');
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it.each([
		{ rows: [{ id: 'session-2' }, { id: 'session-3' }], expectedCount: 2 },
		{ rows: [] as { id: string }[], expectedCount: 0 }
	])(
		'preserves the current session and returns count $expectedCount',
		async ({ rows, expectedCount }) => {
			const database = makeDb(rows);
			mocks.getDb.mockResolvedValue(database.db);
			const response = await POST({ locals: { user, session: currentSession } } as never);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ success: true, revokedCount: expectedCount });
			expect(database.where).toHaveBeenCalledOnce();
			expect(mocks.checkRateLimit).toHaveBeenCalledWith(
				`sessions:mutate:${user.id}`, 10, 60
			);
		}
	);

	it('returns a generic error when deletion fails', async () => {
		const database = makeDb([]);
		database.returning.mockRejectedValue(new Error('database details'));
		mocks.getDb.mockResolvedValue(database.db);
		const response = await POST({ locals: { user, session: currentSession } } as never);
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: 'ไม่สามารถออกจากระบบอุปกรณ์อื่นได้' });
	});
});
