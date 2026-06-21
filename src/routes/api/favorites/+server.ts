import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { favorites, series, studios } from '$lib/server/db/schema.js';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/favorites
 * Body: { seriesId: string }
 * Toggle favorite on/off. Returns { favorited: boolean }
 * Auth required: 401 if no session
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	}

	const { seriesId } = await request.json() as { seriesId: string };
	if (!seriesId || typeof seriesId !== 'string') {
		return json({ error: 'กรุณาระบุ seriesId' }, { status: 400 });
	}

	const db = await getDb();

	// Check if already favorited
	const existing = await db
		.select()
		.from(favorites)
		.where(and(
			eq(favorites.userId, locals.user.id),
			eq(favorites.seriesId, seriesId)
		))
		.limit(1);

	if (existing.length > 0) {
		// Unfavorite
		await db
			.delete(favorites)
			.where(and(
				eq(favorites.userId, locals.user.id),
				eq(favorites.seriesId, seriesId)
			));
		return json({ favorited: false });
	}

	// Favorite
	await db
		.insert(favorites)
		.values({
			userId: locals.user.id,
			seriesId
		});

	return json({ favorited: true });
};

/**
 * GET /api/favorites
 * Returns list of series the current user has favorited, ordered by most recent first.
 * Supports optional ?seriesId=xxx for single-check lookup.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	}

	const db = await getDb();

	// Optional: single series check (for FavoriteButton initial state)
	const seriesId = url.searchParams.get('seriesId');

	if (seriesId) {
		const existing = await db
			.select({ id: favorites.seriesId })
			.from(favorites)
			.where(and(
				eq(favorites.userId, locals.user.id),
				eq(favorites.seriesId, seriesId)
			))
			.limit(1);

		return json({ favorited: existing.length > 0 });
	}

	// Full list
	const result = await db
		.select({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			posterUrl: series.posterUrl,
			status: series.status,
			studioName: studios.name
		})
		.from(favorites)
		.innerJoin(series, eq(favorites.seriesId, series.id))
		.leftJoin(studios, eq(series.studioId, studios.id))
		.where(and(
			eq(favorites.userId, locals.user.id),
			isNull(series.deletedAt)
		))
		.orderBy(desc(favorites.createdAt));

	const items = result.map((s) => ({
		id: s.id,
		title: s.titleEn,
		subtitle: s.titleTh ?? '',
		poster: s.posterUrl ?? '/placeholders/poster.svg',
		status: s.status,
		studio: s.studioName ?? 'ไม่ระบุสตูดิโอ'
	}));

	return json({ favorites: items });
};
