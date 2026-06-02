import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDb = vi.fn();
vi.mock('$lib/server/db/index.js', () => ({ getDb: mockGetDb }));
vi.mock('$lib/server/db/schema.js', () => ({
	seriesSchedules: { id: 'id', seriesId: 'series_id', platformId: 'platform_id', dayOfWeek: 'day_of_week', airTime: 'air_time', isUncut: 'is_uncut' },
	series: { id: 'id' },
	platforms: { id: 'id' }
}));

function makeLocals(user: unknown = null) {
	return { user } as never;
}

async function catchStatus(fn: () => unknown): Promise<number> {
	try {
		await fn();
		return 0;
	} catch (e: unknown) {
		return (e as { status: number }).status ?? -1;
	}
}

describe('POST /api/admin/schedules', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 403 when not logged in', async () => {
		const { POST } = await import('../../../src/routes/api/admin/schedules/+server.js');
		const status = await catchStatus(() =>
			POST({ locals: makeLocals(), request: new Request('http://localhost', { method: 'POST' }) } as never)
		);
		expect(status).toBe(403);
	});

	it('returns 403 when user is not admin', async () => {
		const { POST } = await import('../../../src/routes/api/admin/schedules/+server.js');
		const status = await catchStatus(() =>
			POST({ locals: makeLocals({ role: 'USER' }), request: new Request('http://localhost', { method: 'POST' }) } as never)
		);
		expect(status).toBe(403);
	});

	it('returns 400 when required fields missing', async () => {
		const { POST } = await import('../../../src/routes/api/admin/schedules/+server.js');
		const status = await catchStatus(() =>
			POST({
				locals: makeLocals({ role: 'ADMIN', id: 'admin-id' }),
				request: new Request('http://localhost', {
					method: 'POST',
					body: JSON.stringify({})
				})
			} as never)
		);
		expect(status).toBe(400);
	});

	it('returns 400 when seriesId is missing', async () => {
		const { POST } = await import('../../../src/routes/api/admin/schedules/+server.js');
		const status = await catchStatus(() =>
			POST({
				locals: makeLocals({ role: 'ADMIN', id: 'admin-id' }),
				request: new Request('http://localhost', {
					method: 'POST',
					body: JSON.stringify({ platformId: 'p1', dayOfWeek: 1, airTime: '20:00' })
				})
			} as never)
		);
		expect(status).toBe(400);
	});

	it('returns 400 when dayOfWeek is missing', async () => {
		const { POST } = await import('../../../src/routes/api/admin/schedules/+server.js');
		const status = await catchStatus(() =>
			POST({
				locals: makeLocals({ role: 'ADMIN', id: 'admin-id' }),
				request: new Request('http://localhost', {
					method: 'POST',
					body: JSON.stringify({ seriesId: 's1', platformId: 'p1', airTime: '20:00' })
				})
			} as never)
		);
		expect(status).toBe(400);
	});

	it('returns 201 on successful creation with default isUncut', async () => {
		const mockReturning = vi.fn().mockResolvedValue([{ id: 'new-id', seriesId: 's1', platformId: 'p1', dayOfWeek: 1, airTime: '20:00', isUncut: false }]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockDb = { insert: vi.fn().mockReturnValue({ values: mockValues }) };
		mockGetDb.mockResolvedValue(mockDb);

		const { POST } = await import('../../../src/routes/api/admin/schedules/+server.js');
		const response = await POST({
			locals: makeLocals({ role: 'ADMIN', id: 'admin-id' }),
			request: new Request('http://localhost', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seriesId: 's1', platformId: 'p1', dayOfWeek: 1, airTime: '20:00' })
			})
		} as never) as Response;
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.data).toBeDefined();
		expect(body.data.id).toBe('new-id');
	});

	it('returns 201 on successful creation with isUncut=true', async () => {
		const mockReturning = vi.fn().mockResolvedValue([{ id: 'new-id', seriesId: 's1', platformId: 'p1', dayOfWeek: 1, airTime: '20:00', isUncut: true }]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockDb = { insert: vi.fn().mockReturnValue({ values: mockValues }) };
		mockGetDb.mockResolvedValue(mockDb);

		const { POST } = await import('../../../src/routes/api/admin/schedules/+server.js');
		const response = await POST({
			locals: makeLocals({ role: 'ADMIN', id: 'admin-id' }),
			request: new Request('http://localhost', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seriesId: 's1', platformId: 'p1', dayOfWeek: 1, airTime: '20:00', isUncut: true })
			})
		} as never) as Response;
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.data).toBeDefined();
		expect(body.data.isUncut).toBe(true);
	});
});

describe('PUT /api/admin/schedules/[id]', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 403 when not logged in', async () => {
		const { PUT } = await import('../../../src/routes/api/admin/schedules/[id]/+server.js');
		const status = await catchStatus(() =>
			PUT({ locals: makeLocals(), params: { id: 'some-id' }, request: new Request('http://localhost', { method: 'PUT' }) } as never)
		);
		expect(status).toBe(403);
	});

	it('returns 403 when user is not admin', async () => {
		const { PUT } = await import('../../../src/routes/api/admin/schedules/[id]/+server.js');
		const status = await catchStatus(() =>
			PUT({ locals: makeLocals({ role: 'USER' }), params: { id: 'some-id' }, request: new Request('http://localhost', { method: 'PUT' }) } as never)
		);
		expect(status).toBe(403);
	});

	it('returns 400 when required fields missing', async () => {
		const { PUT } = await import('../../../src/routes/api/admin/schedules/[id]/+server.js');
		const status = await catchStatus(() =>
			PUT({
				locals: makeLocals({ role: 'ADMIN', id: 'admin-id' }),
				params: { id: 'some-id' },
				request: new Request('http://localhost', {
					method: 'PUT',
					body: JSON.stringify({})
				})
			} as never)
		);
		expect(status).toBe(400);
	});

	it('returns 200 on successful update', async () => {
		const mockReturning = vi.fn().mockResolvedValue([{ id: 'existing-id', seriesId: 's1', platformId: 'p1', dayOfWeek: 2, airTime: '21:00', isUncut: false }]);
		const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		const mockDb = {
			update: vi.fn().mockReturnValue({ set: mockSet })
		};
		mockGetDb.mockResolvedValue(mockDb);

		const { PUT } = await import('../../../src/routes/api/admin/schedules/[id]/+server.js');
		const response = await PUT({
			locals: makeLocals({ role: 'ADMIN', id: 'admin-id' }),
			params: { id: 'existing-id' },
			request: new Request('http://localhost', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seriesId: 's1', platformId: 'p1', dayOfWeek: 2, airTime: '21:00' })
			})
		} as never) as Response;
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.data).toBeDefined();
		expect(body.data.id).toBe('existing-id');
	});
});

describe('DELETE /api/admin/schedules/[id]', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 403 when not logged in', async () => {
		const { DELETE } = await import('../../../src/routes/api/admin/schedules/[id]/+server.js');
		const status = await catchStatus(() =>
			DELETE({ locals: makeLocals(), params: { id: 'some-id' }, request: new Request('http://localhost', { method: 'DELETE' }) } as never)
		);
		expect(status).toBe(403);
	});

	it('returns 403 when user is not admin', async () => {
		const { DELETE } = await import('../../../src/routes/api/admin/schedules/[id]/+server.js');
		const status = await catchStatus(() =>
			DELETE({ locals: makeLocals({ role: 'USER' }), params: { id: 'some-id' }, request: new Request('http://localhost', { method: 'DELETE' }) } as never)
		);
		expect(status).toBe(403);
	});

	it('returns 200 on successful deletion', async () => {
		const mockWhere = vi.fn().mockResolvedValue(undefined);
		const mockDb = {
			delete: vi.fn().mockReturnValue({
				where: mockWhere
			})
		};
		mockGetDb.mockResolvedValue(mockDb);

		const { DELETE } = await import('../../../src/routes/api/admin/schedules/[id]/+server.js');
		const response = await DELETE({
			locals: makeLocals({ role: 'ADMIN', id: 'admin-id' }),
			params: { id: 'to-delete' },
			request: new Request('http://localhost', { method: 'DELETE' })
		} as never) as Response;
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.success).toBe(true);
	});
});
