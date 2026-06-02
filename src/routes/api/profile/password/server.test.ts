import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDb = vi.fn();
const mockVerifyPassword = vi.fn();
const mockHashPassword = vi.fn();
vi.mock('$lib/server/db/index.js', () => ({ getDb: mockGetDb }));
vi.mock('$lib/server/db/schema.js', () => ({}));
vi.mock('$lib/server/auth/password.js', () => ({ verifyPassword: mockVerifyPassword, hashPassword: mockHashPassword }));

async function jsonBody(response: Response) {
	return await response.json() as Record<string, unknown>;
}

function makeLocals(user: unknown = null) {
	return { user } as never;
}

describe('POST /api/profile/password', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 401 when not logged in', async () => {
		const { POST } = await import('./+server.js');
		const response = await POST({ locals: makeLocals(), request: new Request('http://localhost/api/profile/password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }) } as never) as Response;
		expect(response.status).toBe(401);
		expect(await jsonBody(response)).toEqual({ error: 'กรุณาเข้าสู่ระบบ' });
	});
});
