import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(), list: vi.fn(), create: vi.fn(), reorder: vi.fn()
}));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/series-videos/mutations.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/series-videos/mutations.js')>();
	return { ...actual, listSeriesVideos: mocks.list, createSeriesVideo: mocks.create, reorderSeriesVideos: mocks.reorder };
});

import { SeriesVideoMutationError } from '$lib/server/series-videos/mutations.js';
const { GET, POST, PUT } = await import('./+server.js');

const admin = { id: 'admin', role: 'ADMIN' } as App.Locals['user'];
function event(method: 'GET' | 'POST' | 'PUT', body?: string, user: App.Locals['user'] = admin) {
	return {
		params: { id: 'series-path' }, locals: { user },
		request: new Request('http://localhost/api/admin/series/series-path/videos', {
			method, headers: { 'content-type': 'application/json' }, ...(body === undefined ? {} : { body })
		})
	} as never;
}

beforeEach(() => { vi.clearAllMocks(); mocks.getDb.mockResolvedValue({ marker: 'db' }); });

describe('/api/admin/series/[id]/videos', () => {
	it.each([null, { id: 'user', role: 'USER' }])('guards every method before database access', async (user) => {
		for (const [handler, method] of [[GET, 'GET'], [POST, 'POST'], [PUT, 'PUT']] as const) {
			const response = await handler(event(method, method === 'GET' ? undefined : '{}', user as App.Locals['user']));
			expect(response.status).toBe(403);
		}
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('returns listed data and preserves a missing-parent domain response', async () => {
		mocks.list.mockResolvedValueOnce([{ id: 'video' }]);
		let response = await GET(event('GET'));
		expect(await response.json()).toEqual({ success: true, data: [{ id: 'video' }] });
		expect(mocks.list).toHaveBeenCalledWith({ marker: 'db' }, 'series-path');

		mocks.list.mockRejectedValueOnce(new SeriesVideoMutationError('SERIES_NOT_FOUND', 404, 'ไม่พบซีรีส์'));
		response = await GET(event('GET'));
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ success: false, code: 'SERIES_NOT_FOUND', error: 'ไม่พบซีรีส์' });
	});

	it('POST forwards VLOG plus only accepted fields and the path series ID', async () => {
		mocks.create.mockResolvedValue({ id: 'created' });
		const response = await POST(event('POST', JSON.stringify({
			type: 'VLOG', titleTh: 'ไทย', titleEn: 'English', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
			seriesId: 'attacker', youtubeVideoId: 'attacker', sortOrder: 999, canonicalUrl: 'attacker', createdAt: 'attacker'
		})));
		expect(response.status).toBe(201);
		expect(mocks.create).toHaveBeenCalledWith({ marker: 'db' }, {
			seriesId: 'series-path', type: 'VLOG', titleTh: 'ไทย', titleEn: 'English', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ'
		});
	});

	it('PUT forwards exact reorder body plus path series ID', async () => {
		const response = await PUT(event('PUT', JSON.stringify({ type: 'PILOT', videoIds: ['a'], seriesId: 'attacker' })));
		expect(response.status).toBe(200);
		expect(mocks.reorder).toHaveBeenCalledWith({ marker: 'db' }, { seriesId: 'series-path', type: 'PILOT', videoIds: ['a'] });
	});

	it.each([
		[POST, 'POST', 'INVALID_TYPE'],
		[PUT, 'PUT', 'INVALID_REORDER']
	] as const)('maps malformed JSON to a stable 400 code before DB access', async (handler, method, code) => {
		const response = await handler(event(method, '{'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false, code });
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('preserves domain errors and redacts unexpected failures', async () => {
		mocks.create.mockRejectedValueOnce(new SeriesVideoMutationError('DUPLICATE_VIDEO', 409, 'วิดีโอนี้ถูกเพิ่มแล้ว'));
		let response = await POST(event('POST', '{}'));
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ success: false, code: 'DUPLICATE_VIDEO', error: 'วิดีโอนี้ถูกเพิ่มแล้ว' });

		mocks.reorder.mockRejectedValueOnce(new Error('database password leaked'));
		response = await PUT(event('PUT', '{}'));
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
	});
});
