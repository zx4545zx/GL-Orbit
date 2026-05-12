import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { episodeSchedules, episodes, series, platforms } from '$lib/server/db/schema.js';
import { eq, and, isNull, asc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const offset = (page - 1) * limit;

	const db = await getDb();

	const result = await db
		.select({
			id: episodeSchedules.id,
			episodeId: episodeSchedules.episodeId,
			platformId: episodeSchedules.platformId,
			airDate: episodeSchedules.airDate,
			streamLink: episodeSchedules.streamLink,
			isUncut: episodeSchedules.isUncut,
			seriesTitle: series.titleEn,
			episodeNumber: episodes.episodeNumber,
			platformName: platforms.name
		})
		.from(episodeSchedules)
		.innerJoin(episodes, eq(episodeSchedules.episodeId, episodes.id))
		.innerJoin(series, eq(episodes.seriesId, series.id))
		.innerJoin(platforms, eq(episodeSchedules.platformId, platforms.id))
		.where(isNull(episodeSchedules.deletedAt))
		.orderBy(asc(episodeSchedules.airDate))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(episodeSchedules)
		.where(isNull(episodeSchedules.deletedAt));

	const data = result.map((r) => ({
		...r,
		airDate: r.airDate ? new Date(r.airDate).toISOString().slice(0, 16) : ''
	}));

	return json({ data, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};
