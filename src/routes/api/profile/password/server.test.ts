import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	verifyPassword: vi.fn(),
	hashPassword: vi.fn(),
	checkRateLimit: vi.fn(),
	rateLimitKey: vi.fn((action: string, id: string) => `${action}:${id}`)
}));

vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/auth/password.js', () => ({
	verifyPassword: mocks.verifyPassword,
	hashPassword: mocks.hashPassword
}));
vi.mock('$lib/server/rate-limit/index.js', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('$lib/server/rate-limit/keys.js', () => ({ rateLimitKey: mocks.rateLimitKey }));

const { POST } = await import('./+server.js');
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const sessionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const user = { id: userId } as NonNullable<App.Locals['user']>;
const session = { id: sessionId } as NonNullable<App.Locals['session']>;

function request(body: Record<string, unknown> = {}) {
	return new Request('http://localhost/api/profile/password', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}

function validRequest() {
	return request({
		currentPassword: 'current-secret',
		newPassword: 'new-secret',
		confirmPassword: 'new-secret'
	});
}

function makeDb(executeResult: unknown = { rows: [{ revoked_count: 2 }] }) {
	const limit = vi.fn().mockResolvedValue([{ id: userId, passwordHash: 'stored-hash' }]);
	const where = vi.fn(() => ({ limit }));
	const from = vi.fn(() => ({ where }));
	const execute = vi.fn().mockResolvedValue(executeResult);
	return { db: { select: vi.fn(() => ({ from })), execute }, execute };
}

describe('POST /api/profile/password', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.verifyPassword.mockResolvedValue(true);
		mocks.hashPassword.mockResolvedValue('new-hash');
		mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
	});

	it('returns 401 unless both user and current session are present', async () => {
		for (const locals of [{}, { user }, { session }]) {
			const response = await POST({ locals, request: validRequest() } as never);
			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ error: 'กรุณาเข้าสู่ระบบ' });
		}
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('does not mutate when the current password is invalid', async () => {
		const database = makeDb();
		mocks.getDb.mockResolvedValue(database.db);
		mocks.verifyPassword.mockResolvedValue(false);

		const response = await POST({ locals: { user, session }, request: validRequest() } as never);

		expect(response.status).toBe(400);
		expect(database.execute).not.toHaveBeenCalled();
		expect(mocks.hashPassword).not.toHaveBeenCalled();
	});

	it('rate limits password verification attempts per user', async () => {
		mocks.checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 42 });

		const response = await POST({ locals: { user, session }, request: validRequest() } as never);

		expect(response.status).toBe(429);
		expect(response.headers.get('Retry-After')).toBe('42');
		expect(mocks.checkRateLimit).toHaveBeenCalledWith(`profile:password:${userId}`, 10, 60);
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('updates the password and revokes other sessions in one parameterized statement', async () => {
		const database = makeDb({ rows: [{ revoked_count: '2' }] });
		mocks.getDb.mockResolvedValue(database.db);

		const response = await POST({ locals: { user, session }, request: validRequest() } as never);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			success: true,
			message: 'เปลี่ยนรหัสผ่านสำเร็จ',
			revokedCount: 2
		});
		expect(mocks.hashPassword).toHaveBeenCalledWith('new-secret');
		expect(database.execute).toHaveBeenCalledOnce();
		const statement = database.execute.mock.calls[0][0] as {
			queryChunks: Array<{ value?: unknown[] }>;
		};
		const serialized = JSON.stringify(statement);
		expect(serialized).toContain('WITH updated_user AS');
		expect(serialized).toContain('DELETE FROM sessions');
		expect(serialized).toContain('id <>');
		expect(serialized).toContain('new-hash');
		expect(serialized).toContain(userId);
		expect(serialized).toContain(sessionId);
	});

	it('returns a generic 500 when the atomic mutation fails', async () => {
		const database = makeDb();
		database.execute.mockRejectedValue(new Error('schema and identifier details'));
		mocks.getDb.mockResolvedValue(database.db);

		const response = await POST({ locals: { user, session }, request: validRequest() } as never);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
	});
});
