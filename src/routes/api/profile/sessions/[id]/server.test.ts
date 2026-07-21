import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	checkRateLimit: vi.fn(),
	rateLimitKey: vi.fn((action: string, userId: string) => `${action}:${userId}`)
}));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/rate-limit/index.js', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('$lib/server/rate-limit/keys.js', () => ({ rateLimitKey: mocks.rateLimitKey }));

const { DELETE } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as NonNullable<App.Locals['user']>;
const currentSession = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' } as NonNullable<
	App.Locals['session']
>;
const targetId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function makeEvent(id: string, locals: Record<string, unknown> = { user, session: currentSession }) {
	return { locals, params: { id } } as never;
}

function makeDb(rows: unknown[]) {
	const returning = vi.fn().mockResolvedValue(rows);
	const where = vi.fn(() => ({ returning }));
	return { db: { delete: vi.fn(() => ({ where })) }, where, returning };
}

describe('DELETE /api/profile/sessions/[id]', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
	});

	it('requires both authenticated locals', async () => {
		const response = await DELETE(makeEvent(targetId, { user }));
		expect(response.status).toBe(401);
		expect(mocks.checkRateLimit).not.toHaveBeenCalled();
	});

	it('rejects malformed UUIDs before mutation', async () => {
		const response = await DELETE(makeEvent('not-a-uuid'));
		expect(response.status).toBe(400);
		expect(mocks.checkRateLimit).not.toHaveBeenCalled();
	});

	it('returns Retry-After when rate limited', async () => {
		mocks.checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 47 });
		const response = await DELETE(makeEvent(targetId));
		expect(response.status).toBe(429);
		expect(response.headers.get('Retry-After')).toBe('47');
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('refuses to revoke the current session', async () => {
		const response = await DELETE(makeEvent(currentSession.id));
		expect(response.status).toBe(400);
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it.each([{ rows: [{ id: targetId }] }, { rows: [] }])(
		'deletes by owner and returns an idempotent count for $rows',
		async ({ rows }) => {
			const database = makeDb(rows);
			mocks.getDb.mockResolvedValue(database.db);
			const response = await DELETE(makeEvent(targetId));
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ success: true, revokedCount: rows.length });
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
		const response = await DELETE(makeEvent(targetId));
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: 'ไม่สามารถยกเลิกเซสชันได้' });
	});
});
