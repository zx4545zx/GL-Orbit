import { describe, expect, it, vi } from 'vitest';

const getDb = vi.fn();
vi.mock('$lib/server/db/index.js', () => ({ getDb }));

describe('PATCH /api/admin/moments/[id]/moderate', () => {
	it('rejects unknown moderation actions before database work', async () => {
		const { PATCH } = await import('./+server.js');
		const response = await PATCH({
			params: { id: 'moment-1' },
			locals: { user: { id: 'admin-1', role: 'ADMIN' } },
			request: new Request('http://localhost/api/admin/moments/moment-1/moderate', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ action: 'PUBLISH' })
			})
		} as never);

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ code: 'INVALID_ACTION' });
		expect(getDb).not.toHaveBeenCalled();
	});
});
