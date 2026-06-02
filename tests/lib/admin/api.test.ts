import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global.fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

interface TestItem {
	id: string;
	name: string;
}

interface MockResponse {
	ok: boolean;
	status: number;
	json: () => Promise<unknown>;
}

function okResponse(data: unknown): MockResponse {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve(data)
	};
}

function errorResponse(status: number, error?: string): MockResponse {
	return {
		ok: false,
		status,
		json: () => Promise.resolve(error ? { error } : {})
	};
}

describe('createAdminApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('list() sends GET request with page and limit', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockResolvedValue(okResponse({
			success: true,
			data: [{ id: '1', name: 'Test' }],
			page: 1,
			limit: 20,
			total: 1,
			totalPages: 1
		}));

		const api = createAdminApi<TestItem>('series');
		const result = await api.list(1, 20);

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/admin/series?page=1&limit=20',
			expect.objectContaining({
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' }
			})
		);
		expect(result.success).toBe(true);
	});

	it('listAll() sends GET request with limit=999', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockResolvedValue(okResponse({
			success: true,
			data: [],
			page: 1,
			limit: 999,
			total: 0,
			totalPages: 0
		}));

		const api = createAdminApi<TestItem>('studios');
		const result = await api.listAll();

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/admin/studios?limit=999',
			expect.objectContaining({
				credentials: 'include'
			})
		);
		expect(result.success).toBe(true);
	});

	it('create() sends POST request with JSON body', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockResolvedValue(okResponse({ success: true, data: { id: '1', name: 'New' } }));

		const api = createAdminApi<TestItem>('series');
		const body = { name: 'New Series' };
		const result = await api.create(body);

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/admin/series',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify(body),
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' }
			})
		);
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ id: '1', name: 'New' });
	});

	it('update() sends PUT request with JSON body', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockResolvedValue(okResponse({ success: true, data: { id: '1', name: 'Updated' } }));

		const api = createAdminApi<TestItem>('artists');
		const body = { name: 'Updated Name' };
		const result = await api.update('1', body);

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/admin/artists/1',
			expect.objectContaining({
				method: 'PUT',
				body: JSON.stringify(body),
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' }
			})
		);
		expect(result.success).toBe(true);
	});

	it('remove() sends DELETE request', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockResolvedValue(okResponse({ success: true }));

		const api = createAdminApi<TestItem>('platforms');
		const result = await api.remove('42');

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/admin/platforms/42',
			expect.objectContaining({
				method: 'DELETE',
				credentials: 'include'
			})
		);
		expect(result.success).toBe(true);
	});

	it('returns error when fetch throws (network error)', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockRejectedValue(new Error('Network failure'));

		const api = createAdminApi<TestItem>('series');
		const result = await api.list();

		expect(result.success).toBe(false);
		expect(result.error).toBe('เกิดข้อผิดพลาดในการเชื่อมต่อ');
	});

	it('returns error for non-ok HTTP response with error message', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockResolvedValue(errorResponse(404, 'ไม่พบข้อมูล'));

		const api = createAdminApi<TestItem>('series');
		const result = await api.list();

		expect(result.success).toBe(false);
		expect(result.error).toBe('ไม่พบข้อมูล');
	});

	it('returns HTTP status text for non-ok response without error message', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockResolvedValue(errorResponse(500));

		const api = createAdminApi<TestItem>('series');
		const result = await api.list();

		expect(result.success).toBe(false);
		expect(result.error).toBe('HTTP 500');
	});

	it('uses default page=1 and limit=20 for list()', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockResolvedValue(okResponse({
			success: true,
			data: [],
			page: 1,
			limit: 20,
			total: 0,
			totalPages: 0
		}));

		const api = createAdminApi<TestItem>('episodes');
		await api.list();

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/admin/episodes?page=1&limit=20',
			expect.anything()
		);
	});

	it('always sends credentials: include', async () => {
		const { createAdminApi } = await import('../../../src/lib/admin/api.js');
		mockFetch.mockResolvedValue(okResponse({ success: true }));

		const api = createAdminApi<TestItem>('test');
		await api.list();
		await api.listAll();
		await api.create({});
		await api.update('x', {});
		await api.remove('x');

		const calls = mockFetch.mock.calls;
		for (const [, options] of calls) {
			expect(options).toHaveProperty('credentials', 'include');
		}
	});
});
