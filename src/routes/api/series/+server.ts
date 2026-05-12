import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series, studios } from '$lib/server/db/schema.js';
import { isNull, eq, asc, sql } from 'drizzle-orm';
import { getCached, setCached } from '$lib/server/cache.js';
import type { RequestHandler } from './$types.js';

const CACHE_TTL = 30_000;

export const GET: RequestHandler = async ({ url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const limit = 20;
	const offset = (page - 1) * limit;

	const cacheKey = `api:series:page:${page}`;
	const cached = getCached(cacheKey, CACHE_TTL);
	if (cached) {
		return json(cached);
	}

	const db = await getDb();

	const [countResult] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(series)
		.where(isNull(series.deletedAt));

	const total = countResult?.count ?? 0;

	const allSeries = await db
		.select({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			posterUrl: series.posterUrl,
			status: series.status,
			studioName: studios.name
		})
		.from(series)
		.leftJoin(studios, eq(series.studioId, studios.id))
		.where(isNull(series.deletedAt))
		.orderBy(asc(series.titleEn))
		.limit(limit)
		.offset(offset);

	const result = {
		items: allSeries.map((s) => ({
			id: s.id,
			title: s.titleEn,
			subtitle: s.titleTh ?? '',
			poster: s.posterUrl ?? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
			status: s.status,
			studio: s.studioName ?? 'ไม่ระบุสตูดิโอ'
		})),
		total,
		page,
		limit
	};

	setCached(cacheKey, result, CACHE_TTL);
	return json(result);
};
