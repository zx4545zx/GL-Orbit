import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { watched, series, studios } from '$lib/server/db/schema.js';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/watched
 * Body: { seriesId: string }
 * Toggle watched on/off. Returns { watched: boolean }
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

	// Check if already watched
	const existing = await db
		.select()
		.from(watched)
		.where(and(
			eq(watched.userId, locals.user.id),
			eq(watched.seriesId, seriesId)
		))
		.limit(1);

	if (existing.length > 0) {
		// Unwatch (mark as not watched)
		await db
			.delete(watched)
			.where(and(
				eq(watched.userId, locals.user.id),
				eq(watched.seriesId, seriesId)
			));
		return json({ watched: false });
	}

	// Mark as watched
	await db
		.insert(watched)
		.values({
			userId: locals.user.id,
			seriesId
		});

	return json({ watched: true });
};

/**
 * GET /api/watched
 * Returns list of series the current user has watched, ordered by most recent first.
 * Supports optional ?seriesId=xxx for single-check lookup.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	}

	const db = await getDb();

	// Optional: single series check (for WatchedButton initial state)
	const seriesId = url.searchParams.get('seriesId');

	if (seriesId) {
		const existing = await db
			.select({ id: watched.seriesId })
			.from(watched)
			.where(and(
				eq(watched.userId, locals.user.id),
				eq(watched.seriesId, seriesId)
			))
			.limit(1);

		return json({ watched: existing.length > 0 });
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
		.from(watched)
		.innerJoin(series, eq(watched.seriesId, series.id))
		.leftJoin(studios, eq(series.studioId, studios.id))
		.where(and(
			eq(watched.userId, locals.user.id),
			isNull(series.deletedAt)
		))
		.orderBy(desc(watched.createdAt));

	const items = result.map((s) => ({
		id: s.id,
		title: s.titleEn,
		subtitle: s.titleTh ?? '',
		poster: s.posterUrl ?? '/placeholders/poster.svg',
		status: s.status,
		studio: s.studioName ?? 'ไม่ระบุสตูดิโอ'
	}));

	return json({ watched: items });
};
