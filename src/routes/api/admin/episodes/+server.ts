import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { episodes, series } from '$lib/server/db/schema.js';
import { isNull, eq, asc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const offset = (page - 1) * limit;

	const db = await getDb();

	const allEpisodes = await db
		.select({
			id: episodes.id,
			seriesId: episodes.seriesId,
			seriesTitle: series.titleEn,
			episodeNumber: episodes.episodeNumber,
			title: episodes.title,
			coverUrl: episodes.coverUrl,
			trailerUrl: episodes.trailerUrl
		})
		.from(episodes)
		.innerJoin(series, eq(episodes.seriesId, series.id))
		.where(isNull(episodes.deletedAt))
		.orderBy(asc(series.titleEn), asc(episodes.episodeNumber))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(episodes)
		.where(isNull(episodes.deletedAt));

	return json({ data: allEpisodes, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};
