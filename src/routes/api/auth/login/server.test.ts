import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUserByIdentifier = vi.fn();
const verifyPassword = vi.fn();
const createSession = vi.fn();

vi.mock('$lib/server/auth/user.js', () => ({ getUserByIdentifier }));
vi.mock('$lib/server/auth/password.js', () => ({ verifyPassword }));
vi.mock('$lib/server/auth/session.js', () => ({ createSession }));

const makeCookies = () => ({ set: vi.fn() });

async function jsonBody(response: Response) {
	return await response.json() as Record<string, unknown>;
}

describe('POST /api/auth/login', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 400 with Thai error when identifier or password is missing', async () => {
		const { POST } = await import('./+server.js');
		const cookies = makeCookies();
		const response = await POST({
			request: new Request('http://localhost/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ identifier: '', password: '' })
			}),
			cookies
		} as never) as Response;

		expect(response.status).toBe(400);
		expect(await jsonBody(response)).toEqual({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
		expect(cookies.set).not.toHaveBeenCalled();
	});

	it('returns 400 with Thai error for invalid credentials', async () => {
		getUserByIdentifier.mockResolvedValue(null);
		const { POST } = await import('./+server.js');
		const response = await POST({
			request: new Request('http://localhost/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ identifier: 'user@example.com', password: 'wrongpass' })
			}),
			cookies: makeCookies()
		} as never) as Response;

		expect(response.status).toBe(400);
		expect(await jsonBody(response)).toEqual({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
	});

	it('sets a secure session cookie and returns compact user JSON on success', async () => {
		const expiresAt = new Date('2026-07-02T00:00:00.000Z');
		getUserByIdentifier.mockResolvedValue({
			id: 'user-1', username: 'orbit', email: 'orbit@example.com', displayName: 'Orbit',
			avatarUrl: null, passwordHash: 'hash', role: 'USER', isActive: true
		});
		verifyPassword.mockResolvedValue(true);
		createSession.mockResolvedValue({ token: 'session-token', expiresAt });
		const cookies = makeCookies();
		const { POST } = await import('./+server.js');

		const response = await POST({
			request: new Request('http://localhost/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ identifier: 'orbit', password: 'secret123' })
			}),
			cookies
		} as never) as Response;

		expect(response.status).toBe(200);
		expect(cookies.set).toHaveBeenCalledWith('session', 'session-token', expect.objectContaining({
			httpOnly: true,
			sameSite: 'lax',
			path: '/',
			expires: expiresAt
		}));
		expect(await jsonBody(response)).toEqual({
			success: true,
			user: { id: 'user-1', username: 'orbit', email: 'orbit@example.com', displayName: 'Orbit', avatarUrl: null, role: 'USER' }
		});
	});
});
