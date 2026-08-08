import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));

const { GET, POST } = await import('./+server.js');
const admin = { id: 'admin', role: 'ADMIN' } as App.Locals['user'];
const user = { id: 'user', role: 'USER' } as App.Locals['user'];
function event(method: 'GET' | 'POST', body?: string, currentUser: App.Locals['user'] = admin) {
	return { locals: { user: currentUser }, url: new URL('http://localhost/api/admin/news'), request: new Request('http://localhost/api/admin/news', { method, ...(body ? { body, headers: { 'content-type': 'application/json' } } : {}) }) } as never;
}

describe('/api/admin/news', () => {
	beforeEach(() => vi.clearAllMocks());
	it.each([[GET, 'GET'], [POST, 'POST']] as const)('guards %s before DB access', async (handler, method) => {
		await expect(handler(event(method, method === 'POST' ? '{}' : undefined, user))).rejects.toMatchObject({ status: 403 });
		expect(mocks.getDb).not.toHaveBeenCalled();
	});
});
