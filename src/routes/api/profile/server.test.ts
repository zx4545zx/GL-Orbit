import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDb = vi.fn();
vi.mock('$lib/server/db/index.js', () => ({ getDb: mockGetDb }));
vi.mock('$lib/server/db/schema.js', () => ({}));

async function jsonBody(response: Response) {
	return await response.json() as Record<string, unknown>;
}

function makeLocals(user: unknown = null) {
	return { user } as never;
}

describe('GET /api/profile', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 401 when not logged in', async () => {
		const { GET } = await import('./+server.js');
		const response = await GET({ locals: makeLocals() } as never) as Response;
		expect(response.status).toBe(401);
		expect(await jsonBody(response)).toEqual({ error: 'กรุณาเข้าสู่ระบบ' });
	});
});

describe('PATCH /api/profile', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 401 when not logged in', async () => {
		const { PATCH } = await import('./+server.js');
		const response = await PATCH({ locals: makeLocals(), request: new Request('http://localhost/api/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: '{}' }) } as never) as Response;
		expect(response.status).toBe(401);
		expect(await jsonBody(response)).toEqual({ error: 'กรุณาเข้าสู่ระบบ' });
	});
});
