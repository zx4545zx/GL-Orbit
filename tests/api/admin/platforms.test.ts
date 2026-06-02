import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();

const mockGetDb = vi.fn(() => ({
	insert: mockInsert,
	update: mockUpdate,
}));

vi.mock('$lib/server/db/index.js', () => ({ getDb: mockGetDb }));
vi.mock('$lib/server/db/schema.js', () => ({
	platforms: {
		id: 'id',
		name: 'name',
		logoUrl: 'logo_url',
		baseUrl: 'base_url',
		deletedAt: 'deleted_at',
	},
}));

async function jsonBody(response: Response) {
	return (await response.json()) as Record<string, unknown>;
}

function makeLocals(user: { role: string } | null = null) {
	return { user } as never;
}

function makeRequest(url: string, method: string, body?: unknown): Request {
	return new Request(url, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});
}

async function extractError(fn: () => Response | Promise<Response>): Promise<{ status: number; body: Record<string, unknown> }> {
	try {
		const res = await fn();
		const body = await jsonBody(res);
		return { status: res.status, body };
	} catch (e: unknown) {
		const err = e as { status?: number; body?: Record<string, unknown> };
		return { status: err.status ?? 500, body: err.body ?? {} };
	}
}

describe('POST /api/admin/platforms', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockInsert.mockReturnValue({ values: mockValues });
		mockValues.mockReturnValue({ returning: mockReturning });
		mockUpdate.mockReturnValue({ set: mockSet });
		mockSet.mockReturnValue({ where: mockWhere });
		mockWhere.mockReturnValue({ returning: mockReturning });
	});

	it('returns 403 when not admin', async () => {
		const { POST } = await import('../../../src/routes/api/admin/platforms/+server.js');
		const { status } = await extractError(() =>
			POST({
				locals: makeLocals({ role: 'USER' }),
				request: makeRequest('http://localhost/api/admin/platforms', 'POST', { name: 'Test' }),
			} as never),
		);
		expect(status).toBe(403);
	});

	it('returns 403 when not logged in', async () => {
		const { POST } = await import('../../../src/routes/api/admin/platforms/+server.js');
		const { status } = await extractError(() =>
			POST({
				locals: makeLocals(null),
				request: makeRequest('http://localhost/api/admin/platforms', 'POST', { name: 'Test' }),
			} as never),
		);
		expect(status).toBe(403);
	});

	it('returns 400 when name is missing', async () => {
		const { POST } = await import('../../../src/routes/api/admin/platforms/+server.js');
		const { status } = await extractError(() =>
			POST({
				locals: makeLocals({ role: 'ADMIN' }),
				request: makeRequest('http://localhost/api/admin/platforms', 'POST', {}),
			} as never),
		);
		expect(status).toBe(400);
	});

	it('returns 400 when name is empty string', async () => {
		const { POST } = await import('../../../src/routes/api/admin/platforms/+server.js');
		const { status } = await extractError(() =>
			POST({
				locals: makeLocals({ role: 'ADMIN' }),
				request: makeRequest('http://localhost/api/admin/platforms', 'POST', { name: '' }),
			} as never),
		);
		expect(status).toBe(400);
	});

	it('returns 201 when creating platform with name only', async () => {
		mockReturning.mockResolvedValue([{ id: '1', name: 'Test Platform', logoUrl: null, baseUrl: null }]);

		const { POST } = await import('../../../src/routes/api/admin/platforms/+server.js');
		const { status, body } = await extractError(() =>
			POST({
				locals: makeLocals({ role: 'ADMIN' }),
				request: makeRequest('http://localhost/api/admin/platforms', 'POST', { name: 'Test Platform' }),
			} as never),
		);
		expect(status).toBe(201);
		expect(body).toHaveProperty('data');
		expect((body.data as Record<string, unknown>).name).toBe('Test Platform');
	});

	it('returns 201 when creating platform with all fields', async () => {
		mockReturning.mockResolvedValue([{ id: '1', name: 'Test', logoUrl: 'https://logo.test', baseUrl: 'https://test.com' }]);

		const { POST } = await import('../../../src/routes/api/admin/platforms/+server.js');
		const { status, body } = await extractError(() =>
			POST({
				locals: makeLocals({ role: 'ADMIN' }),
				request: makeRequest('http://localhost/api/admin/platforms', 'POST', {
					name: 'Test',
					logoUrl: 'https://logo.test',
					baseUrl: 'https://test.com',
				}),
			} as never),
		);
		expect(status).toBe(201);
		expect((body.data as Record<string, unknown>).name).toBe('Test');
	});
});

describe('PUT /api/admin/platforms/[id]', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockInsert.mockReturnValue({ values: mockValues });
		mockValues.mockReturnValue({ returning: mockReturning });
		mockUpdate.mockReturnValue({ set: mockSet });
		mockSet.mockReturnValue({ where: mockWhere });
		mockWhere.mockReturnValue({ returning: mockReturning });
	});

	it('returns 403 when not admin', async () => {
		const { PUT } = await import('../../../src/routes/api/admin/platforms/[id]/+server.js');
		const { status } = await extractError(() =>
			PUT({
				locals: makeLocals({ role: 'USER' }),
				params: { id: '123' },
				request: makeRequest('http://localhost/api/admin/platforms/123', 'PUT', { name: 'Test' }),
			} as never),
		);
		expect(status).toBe(403);
	});

	it('returns 400 when name is empty string', async () => {
		const { PUT } = await import('../../../src/routes/api/admin/platforms/[id]/+server.js');
		const { status } = await extractError(() =>
			PUT({
				locals: makeLocals({ role: 'ADMIN' }),
				params: { id: '123' },
				request: makeRequest('http://localhost/api/admin/platforms/123', 'PUT', { name: '' }),
			} as never),
		);
		expect(status).toBe(400);
	});

	it('returns 200 when updating platform name', async () => {
		mockReturning.mockResolvedValue([{ id: '123', name: 'Updated', logoUrl: null, baseUrl: null }]);

		const { PUT } = await import('../../../src/routes/api/admin/platforms/[id]/+server.js');
		const { status, body } = await extractError(() =>
			PUT({
				locals: makeLocals({ role: 'ADMIN' }),
				params: { id: '123' },
				request: makeRequest('http://localhost/api/admin/platforms/123', 'PUT', { name: 'Updated' }),
			} as never),
		);
		expect(status).toBe(200);
		expect(body).toHaveProperty('data');
		expect((body.data as Record<string, unknown>).name).toBe('Updated');
	});

	it('returns 200 when updating optional fields', async () => {
		mockReturning.mockResolvedValue([{ id: '123', name: 'Test', logoUrl: 'https://new-logo.test', baseUrl: 'https://new-base.test' }]);

		const { PUT } = await import('../../../src/routes/api/admin/platforms/[id]/+server.js');
		const { status, body } = await extractError(() =>
			PUT({
				locals: makeLocals({ role: 'ADMIN' }),
				params: { id: '123' },
				request: makeRequest('http://localhost/api/admin/platforms/123', 'PUT', {
					name: 'Test',
					logoUrl: 'https://new-logo.test',
					baseUrl: 'https://new-base.test',
				}),
			} as never),
		);
		expect(status).toBe(200);
		expect((body.data as Record<string, unknown>).logoUrl).toBe('https://new-logo.test');
		expect((body.data as Record<string, unknown>).baseUrl).toBe('https://new-base.test');
	});

	it('returns 404 when platform not found', async () => {
		mockReturning.mockResolvedValue([]);

		const { PUT } = await import('../../../src/routes/api/admin/platforms/[id]/+server.js');
		const { status } = await extractError(() =>
			PUT({
				locals: makeLocals({ role: 'ADMIN' }),
				params: { id: 'nonexistent' },
				request: makeRequest('http://localhost/api/admin/platforms/nonexistent', 'PUT', { name: 'Test' }),
			} as never),
		);
		expect(status).toBe(404);
	});
});

describe('DELETE /api/admin/platforms/[id]', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockInsert.mockReturnValue({ values: mockValues });
		mockValues.mockReturnValue({ returning: mockReturning });
		mockUpdate.mockReturnValue({ set: mockSet });
		mockSet.mockReturnValue({ where: mockWhere });
		mockWhere.mockReturnValue({ returning: mockReturning });
	});

	it('returns 403 when not admin', async () => {
		const { DELETE } = await import('../../../src/routes/api/admin/platforms/[id]/+server.js');
		const { status } = await extractError(() =>
			DELETE({
				locals: makeLocals({ role: 'USER' }),
				params: { id: '123' },
			} as never),
		);
		expect(status).toBe(403);
	});

	it('returns 200 when soft-deleting platform', async () => {
		const deletedAt = new Date();
		mockReturning.mockResolvedValue([{ id: '123', name: 'Test', logoUrl: null, baseUrl: null, deletedAt }]);

		const { DELETE } = await import('../../../src/routes/api/admin/platforms/[id]/+server.js');
		const { status, body } = await extractError(() =>
			DELETE({
				locals: makeLocals({ role: 'ADMIN' }),
				params: { id: '123' },
			} as never),
		);
		expect(status).toBe(200);
		expect(body).toHaveProperty('data');
		expect(mockUpdate).toHaveBeenCalled();
		expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: expect.any(Date) }));
	});

	it('returns 404 when platform not found', async () => {
		mockReturning.mockResolvedValue([]);

		const { DELETE } = await import('../../../src/routes/api/admin/platforms/[id]/+server.js');
		const { status } = await extractError(() =>
			DELETE({
				locals: makeLocals({ role: 'ADMIN' }),
				params: { id: 'nonexistent' },
			} as never),
		);
		expect(status).toBe(404);
	});
});
