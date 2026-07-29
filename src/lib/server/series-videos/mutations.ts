import { and, asc, eq, isNull, max } from 'drizzle-orm';
import type { Db } from '$lib/server/db/index.js';
import { series, seriesVideos } from '$lib/server/db/schema.js';
import { deleteCached } from '$lib/server/cache.js';
import {
	isSeriesVideoType,
	sortSeriesVideosByRegistry,
	type SeriesVideoType
} from '$lib/series-videos/registry.js';
import type { SeriesVideo, SeriesVideoErrorCode } from '$lib/admin/editor-types.js';
import { parseYouTubeUrl } from './youtube.js';

const messages: Record<SeriesVideoErrorCode, string> = {
	INVALID_TYPE: 'ประเภทวิดีโอไม่ถูกต้อง',
	INVALID_TITLE: 'ชื่อวิดีโอไม่ถูกต้อง',
	INVALID_YOUTUBE_URL: 'ลิงก์ YouTube ไม่ถูกต้อง',
	DUPLICATE_VIDEO: 'วิดีโอนี้ถูกเพิ่มแล้ว',
	INVALID_REORDER: 'ลำดับวิดีโอไม่ถูกต้อง',
	SERIES_NOT_FOUND: 'ไม่พบซีรีส์',
	VIDEO_NOT_FOUND: 'ไม่พบวิดีโอ'
};

export class SeriesVideoMutationError extends Error {
	constructor(
		public readonly code: SeriesVideoErrorCode,
		public readonly status: 400 | 404 | 409,
		message: string
	) {
		super(message);
		this.name = 'SeriesVideoMutationError';
	}
}

function domainError(code: SeriesVideoErrorCode, status: 400 | 404 | 409): SeriesVideoMutationError {
	return new SeriesVideoMutationError(code, status, messages[code]);
}

async function requireSeries(db: Db, seriesId: string): Promise<void> {
	const rows = await db
		.select({ id: series.id })
		.from(series)
		.where(and(eq(series.id, seriesId), isNull(series.deletedAt)))
		.limit(1);
	if (!rows[0]) throw domainError('SERIES_NOT_FOUND', 404);
}

function isVideoUniqueViolation(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const value = error as { code?: string; constraint?: string; message?: string };
	return value.code === '23505' && (
		value.constraint === 'series_videos_series_video_unique' ||
		value.message?.includes('series_videos_series_video_unique') === true
	);
}

export async function listSeriesVideos(db: Db, seriesId: string): Promise<SeriesVideo[]> {
	await requireSeries(db, seriesId);
	const rows = await db
		.select()
		.from(seriesVideos)
		.where(eq(seriesVideos.seriesId, seriesId))
		.orderBy(asc(seriesVideos.sortOrder), asc(seriesVideos.createdAt), asc(seriesVideos.id));
	return sortSeriesVideosByRegistry(
		rows.filter((row): row is SeriesVideo => isSeriesVideoType(row.type))
	);
}

export async function createSeriesVideo(
	db: Db,
	input: { seriesId: string; type: unknown; titleTh: unknown; titleEn: unknown; youtubeUrl: unknown }
): Promise<SeriesVideo> {
	if (!isSeriesVideoType(input.type)) throw domainError('INVALID_TYPE', 400);
	if (typeof input.titleTh !== 'string' || typeof input.titleEn !== 'string') {
		throw domainError('INVALID_TITLE', 400);
	}
	const titleTh = input.titleTh.trim();
	const titleEn = input.titleEn.trim();
	if (!titleTh || !titleEn || titleTh.length > 255 || titleEn.length > 255) {
		throw domainError('INVALID_TITLE', 400);
	}
	if (typeof input.youtubeUrl !== 'string') throw domainError('INVALID_YOUTUBE_URL', 400);
	const youtube = parseYouTubeUrl(input.youtubeUrl);
	if (!youtube) throw domainError('INVALID_YOUTUBE_URL', 400);
	await requireSeries(db, input.seriesId);

	const [orderRow] = await db
		.select({ maximum: max(seriesVideos.sortOrder) })
		.from(seriesVideos)
		.where(and(eq(seriesVideos.seriesId, input.seriesId), eq(seriesVideos.type, input.type)));
	try {
		const [created] = await db
			.insert(seriesVideos)
			.values({
				seriesId: input.seriesId,
				type: input.type,
				youtubeUrl: youtube.canonicalUrl,
				youtubeVideoId: youtube.videoId,
				titleTh,
				titleEn,
				sortOrder: (orderRow?.maximum ?? -1) + 1
			})
			.returning();
		if (!created || !isSeriesVideoType(created.type)) throw new Error('Series video insert failed');
		deleteCached(`query:series:${input.seriesId}`);
		return created as SeriesVideo;
	} catch (error) {
		if (isVideoUniqueViolation(error)) throw domainError('DUPLICATE_VIDEO', 409);
		throw error;
	}
}

export async function reorderSeriesVideos(
	db: Db,
	input: { seriesId: string; type: unknown; videoIds: unknown }
): Promise<void> {
	if (!isSeriesVideoType(input.type)) throw domainError('INVALID_TYPE', 400);
	if (!Array.isArray(input.videoIds) || input.videoIds.some((id) => typeof id !== 'string')) {
		throw domainError('INVALID_REORDER', 400);
	}
	const type = input.type;
	const videoIds = input.videoIds as string[];
	await requireSeries(db, input.seriesId);
	const current = await db
		.select({ id: seriesVideos.id })
		.from(seriesVideos)
		.where(and(eq(seriesVideos.seriesId, input.seriesId), eq(seriesVideos.type, type)));
	const currentIds = new Set(current.map(({ id }) => id));
	const requestedIds = new Set(videoIds);
	if (
		requestedIds.size !== videoIds.length ||
		videoIds.length !== current.length ||
		videoIds.some((id) => !currentIds.has(id)) ||
		current.some(({ id }) => !requestedIds.has(id))
	) throw domainError('INVALID_REORDER', 400);

	await db.transaction(async (tx) => {
		for (const [sortOrder, id] of videoIds.entries()) {
			await tx
				.update(seriesVideos)
				.set({ sortOrder })
				.where(and(
					eq(seriesVideos.id, id),
					eq(seriesVideos.seriesId, input.seriesId),
					eq(seriesVideos.type, type)
				));
		}
	});
	deleteCached(`query:series:${input.seriesId}`);
}

export async function deleteSeriesVideo(db: Db, seriesId: string, seriesVideoId: string): Promise<void> {
	const deleted = await db
		.delete(seriesVideos)
		.where(and(eq(seriesVideos.id, seriesVideoId), eq(seriesVideos.seriesId, seriesId)))
		.returning({ id: seriesVideos.id });
	if (!deleted[0]) throw domainError('VIDEO_NOT_FOUND', 404);
	deleteCached(`query:series:${seriesId}`);
}
