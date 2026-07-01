import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series, studios, episodes, seriesGenres } from '$lib/server/db/schema.js';
import { isNull, eq, asc, sql, inArray, and } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const offset = (page - 1) * limit;

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
		.orderBy(asc(series.titleEn))
		.limit(limit)
		.offset(offset);

	const seriesIds = allSeries.map((s) => s.id);
	let episodeCounts: { seriesId: string; count: number }[] = [];
	if (seriesIds.length > 0) {
		const counts = await db
			.select({
				seriesId: episodes.seriesId,
				count: sql<number>`count(*)::int`
			})
			.from(episodes)
			.where(and(inArray(episodes.seriesId, seriesIds), isNull(episodes.deletedAt)))
			.groupBy(episodes.seriesId);
		episodeCounts = counts;
	}

	const countMap = new Map(episodeCounts.map((c) => [c.seriesId, c.count]));

	const data = allSeries.map((s) => ({
		id: s.id,
		title: s.titleEn,
		titleTh: s.titleTh ?? '',
		poster: s.posterUrl ?? '/placeholders/poster.svg',
		status: s.status,
		studio: s.studioName ?? 'ไม่ระบุสตูดิโอ',
		episodes: countMap.get(s.id) ?? 0
	}));

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(series)
		.where(isNull(series.deletedAt));

	return json({ data, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const { titleEn, titleTh, studioId, posterUrl, status, genreIds, descriptionTh, descriptionEn } = body;

	if (!titleEn) {
		return json({ success: false, error: 'กรุณากรอกชื่อซีรีส์ (EN)' }, { status: 400 });
	}

	const db = await getDb();

	const [inserted] = await db.insert(series).values({
		titleEn,
		titleTh: titleTh ?? null,
		descriptionTh: descriptionTh ?? null,
		descriptionEn: descriptionEn ?? null,
		studioId: studioId ?? null,
		posterUrl: posterUrl ?? null,
		status: status ?? 'UPCOMING'
	}).returning({
		id: series.id,
		titleEn: series.titleEn,
		titleTh: series.titleTh,
		descriptionTh: series.descriptionTh,
		descriptionEn: series.descriptionEn,
		studioId: series.studioId,
		posterUrl: series.posterUrl,
		status: series.status
	});

	if (genreIds?.length > 0) {
		await db.insert(seriesGenres).values(genreIds.map((gid: string) => ({ seriesId: inserted.id, genreId: gid })));
	}

	return json({ success: true, data: inserted }, { status: 201 });
};
