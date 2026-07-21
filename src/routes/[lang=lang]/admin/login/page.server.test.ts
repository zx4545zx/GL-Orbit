import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getUserByIdentifier: vi.fn(),
	verifyPassword: vi.fn(),
	createSession: vi.fn(),
	collectSessionMetadata: vi.fn()
}));

vi.mock('$lib/server/auth/user.js', () => ({ getUserByIdentifier: mocks.getUserByIdentifier }));
vi.mock('$lib/server/auth/password.js', () => ({ verifyPassword: mocks.verifyPassword }));
vi.mock('$lib/server/auth/session.js', () => ({ createSession: mocks.createSession }));
vi.mock('$lib/server/auth/session-metadata.js', () => ({
	collectSessionMetadata: mocks.collectSessionMetadata
}));

const DEVICE_METADATA = {
	browser: 'Chrome', operatingSystem: 'Windows', deviceType: 'desktop',
	maskedIp: '203.0.113.xxx', city: 'Bangkok', countryCode: 'TH'
};

describe('admin login action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.collectSessionMetadata.mockReturnValue(DEVICE_METADATA);
	});

	it('forwards normalized session metadata before redirecting', async () => {
		mocks.getUserByIdentifier.mockResolvedValue({
			id: 'admin-1', role: 'ADMIN', isActive: true, passwordHash: 'hash'
		});
		mocks.verifyPassword.mockResolvedValue(true);
		mocks.createSession.mockResolvedValue({
			token: 'session-token',
			expiresAt: new Date('2026-08-20T08:00:00.000Z')
		});
		const formData = new FormData();
		formData.set('identifier', 'admin');
		formData.set('password', 'secret123');
		const request = new Request('http://localhost/th/admin/login', {
			method: 'POST',
			body: formData
		});
		const cookies = { set: vi.fn() };
		const { actions } = await import('./+page.server.js');

		await expect(
			actions.default({
				request,
				cookies,
				params: { lang: 'th' },
				getClientAddress: () => '203.0.113.42'
			} as never)
		).rejects.toMatchObject({ status: 303, location: '/th/admin/series' });

		expect(mocks.collectSessionMetadata).toHaveBeenCalledWith(request, expect.any(Function));
		expect(mocks.createSession).toHaveBeenCalledWith('admin-1', DEVICE_METADATA);
		expect(cookies.set).toHaveBeenCalledWith(
			'session',
			'session-token',
			expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' })
		);
	});
});
