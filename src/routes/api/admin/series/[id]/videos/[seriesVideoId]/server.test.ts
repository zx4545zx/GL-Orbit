import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), remove: vi.fn() }));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/series-videos/mutations.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/series-videos/mutations.js')>();
	return { ...actual, deleteSeriesVideo: mocks.remove };
});
import { SeriesVideoMutationError } from '$lib/server/series-videos/mutations.js';
const { DELETE } = await import('./+server.js');

const admin = { id: 'admin', role: 'ADMIN' } as App.Locals['user'];
function event(user: App.Locals['user'] = admin) {
	return { params: { id: 'series-path', seriesVideoId: 'video-path' }, locals: { user } } as never;
}

beforeEach(() => { vi.clearAllMocks(); mocks.getDb.mockResolvedValue({ marker: 'db' }); });

describe('DELETE /api/admin/series/[id]/videos/[seriesVideoId]', () => {
	it.each([null, { id: 'user', role: 'USER' }])('requires ADMIN before opening DB', async (user) => {
		const response = await DELETE(event(user as App.Locals['user']));
		expect(response.status).toBe(403);
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('deletes using only scoped path identifiers', async () => {
		const response = await DELETE(event());
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
		expect(mocks.remove).toHaveBeenCalledWith({ marker: 'db' }, 'series-path', 'video-path');
	});

	it('preserves VIDEO_NOT_FOUND and redacts unexpected errors', async () => {
		mocks.remove.mockRejectedValueOnce(new SeriesVideoMutationError('VIDEO_NOT_FOUND', 404, 'ไม่พบวิดีโอ'));
		let response = await DELETE(event());
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ success: false, code: 'VIDEO_NOT_FOUND', error: 'ไม่พบวิดีโอ' });

		mocks.remove.mockRejectedValueOnce(new Error('secret detail'));
		response = await DELETE(event());
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
	});
});
