import { getDb } from '$lib/server/db/index.js';
import { series, studios } from '$lib/server/db/schema.js';
import { isNull, eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const db = await getDb();
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
		.orderBy(asc(series.titleEn));

	return {
		series: allSeries.map((s) => ({
			id: s.id,
			title: s.titleEn,
			subtitle: s.titleTh ?? '',
			poster: s.posterUrl ?? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
			status: s.status,
			studio: s.studioName ?? 'ไม่ระบุสตูดิโอ'
		}))
	};
};
