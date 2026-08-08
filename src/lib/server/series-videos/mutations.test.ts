import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ deleteCached: vi.fn() }));
vi.mock('$lib/server/cache.js', () => ({ deleteCached: mocks.deleteCached }));

import {
	createSeriesVideo,
	deleteSeriesVideo,
	listSeriesVideos,
	reorderSeriesVideos,
	SeriesVideoMutationError
} from './mutations.js';

const seriesId = '11111111-1111-4111-8111-111111111111';
const videoId = '22222222-2222-4222-8222-222222222222';
const secondVideoId = '33333333-3333-4333-8333-333333333333';
const createdAt = new Date('2026-07-29T00:00:00Z');

function selectable(result: unknown[]) {
	const terminal = {
		limit: vi.fn().mockResolvedValue(result),
		orderBy: vi.fn().mockResolvedValue(result),
		then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(result).then(resolve)
	};
	return { from: vi.fn(() => ({ where: vi.fn(() => terminal) })) };
}

function dbMock(selectResults: unknown[][], options: {
	insertResult?: unknown[];
	insertError?: unknown;
	deleteResult?: unknown[];
} = {}) {
	const selects = selectResults.map(selectable);
	const values = vi.fn(() => ({
		returning: options.insertError
			? vi.fn().mockRejectedValue(options.insertError)
			: vi.fn().mockResolvedValue(options.insertResult ?? [])
	}));
	const returning = vi.fn().mockResolvedValue(options.deleteResult ?? []);
	const deleteWhere = vi.fn(() => ({ returning }));
	const txWhere = vi.fn().mockResolvedValue(undefined);
	const txSet = vi.fn(() => ({ where: txWhere }));
	const txUpdate = vi.fn(() => ({ set: txSet }));
	const transaction = vi.fn(async (callback: (tx: unknown) => Promise<void>) => callback({ update: txUpdate }));
	const db: any = {
			select: vi.fn(() => selects.shift()),
			insert: vi.fn(() => ({ values })),
			delete: vi.fn(() => ({ where: deleteWhere })),
			transaction
		};
	return {
		db,
		values,
		deleteWhere,
		transaction,
		txUpdate,
		txSet,
		txWhere
	};
}

function validInput(overrides: Record<string, unknown> = {}) {
	return {
		seriesId,
		type: 'TRAILER',
		titleTh: ' ตัวอย่างไทย ',
		titleEn: ' English trailer ',
		youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ?t=1',
		...overrides
	};
}

function expectDomain(error: unknown, code: string, status: number) {
	expect(error).toBeInstanceOf(SeriesVideoMutationError);
	expect(error).toMatchObject({ code, status });
}

beforeEach(() => vi.clearAllMocks());

describe('series video mutations', () => {
	it('lists only an existing series and returns deterministic registry order', async () => {
		const rows = [
			{ id: secondVideoId, seriesId, type: 'PILOT', sortOrder: 0, createdAt },
			{ id: videoId, seriesId, type: 'TRAILER', sortOrder: 0, createdAt },
			{ id: 'invalid', seriesId, type: 'TEASER', sortOrder: 0, createdAt }
		];
		const { db } = dbMock([[{ id: seriesId }], rows]);
		await expect(listSeriesVideos(db, seriesId)).resolves.toEqual([rows[1], rows[0]]);
	});

	it('rejects a missing or soft-deleted parent with SERIES_NOT_FOUND', async () => {
		const { db } = dbMock([[]]);
		await listSeriesVideos(db, seriesId).catch((error: unknown) => expectDomain(error, 'SERIES_NOT_FOUND', 404));
	});

	it.each([
		[validInput({ type: 'TEASER' }), 'INVALID_TYPE'],
		[validInput({ titleTh: ' ' }), 'INVALID_TITLE'],
		[validInput({ titleEn: 'x'.repeat(256) }), 'INVALID_TITLE'],
		[validInput({ titleTh: 3 }), 'INVALID_TITLE'],
		[validInput({ youtubeUrl: 'http://youtube.com/watch?v=dQw4w9WgXcQ' }), 'INVALID_YOUTUBE_URL'],
		[validInput({ youtubeUrl: 3 }), 'INVALID_YOUTUBE_URL']
	])('validates create input before database work', async (input, code) => {
		const { db } = dbMock([]);
		await createSeriesVideo(db, input).catch((error: unknown) => expectDomain(error, code, 400));
		expect(db.select).not.toHaveBeenCalled();
		expect(mocks.deleteCached).not.toHaveBeenCalled();
	});

	it('appends within series/type, canonicalizes URL, trims titles, then invalidates cache', async () => {
		const created = {
			id: videoId, seriesId, type: 'TRAILER', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			youtubeVideoId: 'dQw4w9WgXcQ', titleTh: 'ตัวอย่างไทย', titleEn: 'English trailer', sortOrder: 4, createdAt
		};
		const { db, values } = dbMock([[{ id: seriesId }], [{ maximum: 3 }]], { insertResult: [created] });
		await expect(createSeriesVideo(db, validInput())).resolves.toEqual(created);
		expect(values).toHaveBeenCalledWith({
			seriesId, type: 'TRAILER', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			youtubeVideoId: 'dQw4w9WgXcQ', titleTh: 'ตัวอย่างไทย', titleEn: 'English trailer', sortOrder: 4
		});
		expect(mocks.deleteCached).toHaveBeenCalledOnce();
		expect(mocks.deleteCached).toHaveBeenCalledWith(`query:series:${seriesId}`);
	});

	it.each(['MUSIC', 'REACTION', 'VLOG', 'EVENT', 'OTHER'] as const)('accepts and persists the %s video type', async (type) => {
		const created = {
			id: videoId, seriesId, type, youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			youtubeVideoId: 'dQw4w9WgXcQ', titleTh: 'ชื่อไทย', titleEn: 'English title', sortOrder: 0, createdAt
		};
		const { db, values } = dbMock([[{ id: seriesId }], [{ maximum: null }]], { insertResult: [created] });
		await expect(createSeriesVideo(db, validInput({ type, titleTh: 'ชื่อไทย', titleEn: 'English title' }))).resolves.toEqual(created);
		expect(values).toHaveBeenCalledWith(expect.objectContaining({ type }));
	});

	it('starts an empty group at zero', async () => {
		const created = { id: videoId, seriesId, type: 'TRAILER', sortOrder: 0, createdAt };
		const { db, values } = dbMock([[{ id: seriesId }], [{ maximum: null }]], { insertResult: [created] });
		await createSeriesVideo(db, validInput());
		expect(values).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 0 }));
	});

	it('maps only the named unique violation and never invalidates failed writes', async () => {
		const duplicate = { code: '23505', constraint: 'series_videos_series_video_unique', detail: 'secret' };
		const { db } = dbMock([[{ id: seriesId }], [{ maximum: 0 }]], { insertError: duplicate });
		await createSeriesVideo(db, validInput()).catch((error: unknown) => expectDomain(error, 'DUPLICATE_VIDEO', 409));
		expect(mocks.deleteCached).not.toHaveBeenCalled();

		const other = { code: '23505', constraint: 'other_unique' };
		const second = dbMock([[{ id: seriesId }], [{ maximum: 0 }]], { insertError: other });
		await expect(createSeriesVideo(second.db, validInput())).rejects.toBe(other);
	});

	it.each([
		{ videoIds: ['a', 'a'] },
		{ videoIds: [] },
		{ videoIds: ['a'] },
		{ videoIds: ['a', 'extra'] }
	])('rejects any reorder that is not the exact current group', async ({ videoIds }) => {
		const { db, transaction } = dbMock([[{ id: seriesId }], [{ id: 'a' }, { id: 'b' }]]);
		await reorderSeriesVideos(db, { seriesId, type: 'TRAILER', videoIds })
			.catch((error: unknown) => expectDomain(error, 'INVALID_REORDER', 400));
		expect(transaction).not.toHaveBeenCalled();
		expect(mocks.deleteCached).not.toHaveBeenCalled();
	});

	it('accepts an empty exact group and runs one transaction', async () => {
		const { db, transaction, txUpdate } = dbMock([[{ id: seriesId }], []]);
		await reorderSeriesVideos(db, { seriesId, type: 'PILOT', videoIds: [] });
		expect(transaction).toHaveBeenCalledOnce();
		expect(txUpdate).not.toHaveBeenCalled();
		expect(mocks.deleteCached).toHaveBeenCalledWith(`query:series:${seriesId}`);
	});

	it('updates exact IDs contiguously in one transaction before cache invalidation', async () => {
		const { db, transaction, txSet, txWhere } = dbMock([[{ id: seriesId }], [{ id: videoId }, { id: secondVideoId }]]);
		await reorderSeriesVideos(db, { seriesId, type: 'TRAILER', videoIds: [secondVideoId, videoId] });
		expect(transaction).toHaveBeenCalledOnce();
		expect(txSet).toHaveBeenNthCalledWith(1, { sortOrder: 0 });
		expect(txSet).toHaveBeenNthCalledWith(2, { sortOrder: 1 });
		expect(txWhere).toHaveBeenCalledTimes(2);
		expect(mocks.deleteCached).toHaveBeenCalledOnce();
	});

	it('validates reorder type and body before database work', async () => {
		for (const input of [
			{ seriesId, type: 'TEASER', videoIds: [] },
			{ seriesId, type: 'TRAILER', videoIds: 'bad' },
			{ seriesId, type: 'TRAILER', videoIds: [1] }
		]) {
			const { db } = dbMock([]);
			await reorderSeriesVideos(db, input).catch((error: unknown) =>
				expectDomain(error, input.type === 'TEASER' ? 'INVALID_TYPE' : 'INVALID_REORDER', 400));
			expect(db.select).not.toHaveBeenCalled();
		}
	});

	it('deletes by scoped identifiers and invalidates only after a returned row', async () => {
		const { db, deleteWhere } = dbMock([], { deleteResult: [{ id: videoId }] });
		await deleteSeriesVideo(db, seriesId, videoId);
		expect(deleteWhere).toHaveBeenCalledOnce();
		expect(mocks.deleteCached).toHaveBeenCalledWith(`query:series:${seriesId}`);
	});

	it('returns VIDEO_NOT_FOUND for an out-of-series/missing video without invalidation', async () => {
		const { db } = dbMock([], { deleteResult: [] });
		await deleteSeriesVideo(db, seriesId, videoId).catch((error: unknown) => expectDomain(error, 'VIDEO_NOT_FOUND', 404));
		expect(mocks.deleteCached).not.toHaveBeenCalled();
	});
});
