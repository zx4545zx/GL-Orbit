import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));

const { GET, PUT, DELETE } = await import('./+server.js');
const user = { id: 'user', role: 'USER' } as App.Locals['user'];
function event(method: 'GET' | 'PUT' | 'DELETE') {
	return { locals: { user }, params: { id: 'news-id' }, request: new Request('http://localhost/api/admin/news/news-id', { method, ...(method === 'PUT' ? { body: '{}', headers: { 'content-type': 'application/json' } } : {}) }) } as never;
}

describe('/api/admin/news/[id]', () => {
	beforeEach(() => vi.clearAllMocks());
	it.each([[GET, 'GET'], [PUT, 'PUT'], [DELETE, 'DELETE']] as const)('guards %s before DB access', async (handler, method) => {
		await expect(handler(event(method))).rejects.toMatchObject({ status: 403 });
		expect(mocks.getDb).not.toHaveBeenCalled();
	});
});
