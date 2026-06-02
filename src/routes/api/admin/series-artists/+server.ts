import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { seriesArtists, series, artists } from '$lib/server/db/schema.js';
import { eq, and, asc, sql } from 'drizzle-orm';
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
			seriesId: seriesArtists.seriesId,
			artistId: seriesArtists.artistId,
			roleName: seriesArtists.roleName,
			seriesTitle: series.titleEn,
			artistNickname: artists.nickname
		})
		.from(seriesArtists)
		.innerJoin(series, eq(seriesArtists.seriesId, series.id))
		.innerJoin(artists, eq(seriesArtists.artistId, artists.id))
		.orderBy(asc(series.titleEn), asc(artists.nickname))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(seriesArtists);

	return json({ data: result, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const { seriesId, artistId, roleName } = body;

	if (!seriesId || !artistId) {
		error(400, 'seriesId และ artistId เป็น required');
	}

	const db = await getDb();

	await db.insert(seriesArtists).values({
		seriesId,
		artistId,
		roleName: roleName ?? null
	});

	return json(
		{ success: true, data: { seriesId, artistId, roleName: roleName ?? null } },
		{ status: 201 }
	);
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const { id_seriesId, id_artistId, seriesId, artistId, roleName } = body;

	if (!id_seriesId || !id_artistId || !seriesId || !artistId) {
		error(400, 'id_seriesId, id_artistId, seriesId และ artistId เป็น required');
	}

	const db = await getDb();

	await db
		.delete(seriesArtists)
		.where(and(eq(seriesArtists.seriesId, id_seriesId), eq(seriesArtists.artistId, id_artistId)));

	await db.insert(seriesArtists).values({
		seriesId,
		artistId,
		roleName: roleName ?? null
	});

	return json({ success: true, data: { seriesId, artistId, roleName: roleName ?? null } });
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const seriesId = url.searchParams.get('seriesId');
	const artistId = url.searchParams.get('artistId');

	if (!seriesId || !artistId) {
		error(400, 'seriesId และ artistId เป็น required query parameters');
	}

	const db = await getDb();

	await db
		.delete(seriesArtists)
		.where(and(eq(seriesArtists.seriesId, seriesId), eq(seriesArtists.artistId, artistId)));

	return json({ success: true });
};
