import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUserByEmail = vi.fn();
const getUserByUsername = vi.fn();
const createUser = vi.fn();
const hashPassword = vi.fn();
const createSession = vi.fn();

vi.mock('$lib/server/auth/user.js', () => ({ getUserByEmail, getUserByUsername, createUser }));
vi.mock('$lib/server/auth/password.js', () => ({ hashPassword }));
vi.mock('$lib/server/auth/session.js', () => ({ createSession }));

const makeCookies = () => ({ set: vi.fn() });

async function jsonBody(response: Response) {
	return await response.json() as Record<string, unknown>;
}

describe('POST /api/auth/register', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 400 when required fields are missing', async () => {
		const { POST } = await import('./+server.js');
		const response = await POST({
			request: new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ username: '', email: '', password: '' })
			}),
			cookies: makeCookies()
		} as never) as Response;
		expect(response.status).toBe(400);
		expect(await jsonBody(response)).toEqual({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
	});

	it('returns 400 when password is too short', async () => {
		const { POST } = await import('./+server.js');
		const response = await POST({
			request: new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ username: 'test', email: 'test@test.com', password: 'abc' })
			}),
			cookies: makeCookies()
		} as never) as Response;
		expect(response.status).toBe(400);
		expect(await jsonBody(response)).toEqual({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
	});

	it('returns 400 when passwords do not match', async () => {
		const { POST } = await import('./+server.js');
		const response = await POST({
			request: new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ username: 'test', email: 'test@test.com', password: 'secret123', confirmPassword: 'different' })
			}),
			cookies: makeCookies()
		} as never) as Response;
		expect(response.status).toBe(400);
		expect(await jsonBody(response)).toEqual({ error: 'รหัสผ่านไม่ตรงกัน' });
	});

	it('returns 400 when email is already taken', async () => {
		getUserByEmail.mockResolvedValue({ id: 'existing' });
		getUserByUsername.mockResolvedValue(null);
		const { POST } = await import('./+server.js');
		const response = await POST({
			request: new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ username: 'newuser', email: 'taken@test.com', password: 'secret123', confirmPassword: 'secret123' })
			}),
			cookies: makeCookies()
		} as never) as Response;
		expect(response.status).toBe(400);
		expect(await jsonBody(response)).toEqual({ error: 'อีเมลนี้ถูกใช้งานแล้ว', fields: { email: 'อีเมลนี้ถูกใช้งานแล้ว' } });
	});

	it('returns 400 when username is already taken', async () => {
		getUserByEmail.mockResolvedValue(null);
		getUserByUsername.mockResolvedValue({ id: 'existing' });
		const { POST } = await import('./+server.js');
		const response = await POST({
			request: new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ username: 'taken', email: 'new@test.com', password: 'secret123', confirmPassword: 'secret123' })
			}),
			cookies: makeCookies()
		} as never) as Response;
		expect(response.status).toBe(400);
		expect(await jsonBody(response)).toEqual({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', fields: { username: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' } });
	});

	it('creates user, sets session cookie, and returns user JSON on success', async () => {
		getUserByEmail.mockResolvedValue(null);
		getUserByUsername.mockResolvedValue(null);
		hashPassword.mockResolvedValue('hashed123');
		createUser.mockResolvedValue({ id: 'user-1', username: 'newuser', email: 'new@test.com', displayName: 'newuser', avatarUrl: null, role: 'USER' });
		const expiresAt = new Date('2026-07-02T00:00:00.000Z');
		createSession.mockResolvedValue({ token: 'session-token', expiresAt });
		const cookies = makeCookies();

		const { POST } = await import('./+server.js');
		const response = await POST({
			request: new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ username: 'newuser', email: 'new@test.com', password: 'secret123', confirmPassword: 'secret123' })
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
			user: { id: 'user-1', username: 'newuser', email: 'new@test.com', displayName: 'newuser', avatarUrl: null, role: 'USER' }
		});
	});
});
