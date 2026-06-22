import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { artists } from '$lib/server/db/schema.js';
import { isNull, asc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const offset = (page - 1) * limit;

	const db = await getDb();

	const allArtists = await db
		.select({
			id: artists.id,
			nickname: artists.nickname,
			fullNameTh: artists.fullNameTh,
			fullNameEn: artists.fullNameEn,
			profileImageUrl: artists.profileImageUrl
		})
		.from(artists)
		.where(isNull(artists.deletedAt))
		.orderBy(asc(artists.nickname))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(artists)
		.where(isNull(artists.deletedAt));

	return json({ data: allArtists, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const nickname = body.nickname?.trim();
	if (!nickname) {
		error(400, 'กรุณาระบุชื่อเล่น');
	}

	const fullNameEn = body.fullNameEn?.trim();
	if (!fullNameEn) {
		error(400, 'กรุณาระบุชื่อเต็ม (EN)');
	}

	const fullNameTh = body.fullNameTh?.trim() || null;
	const profileImageUrl = body.profileImageUrl?.trim() || null;

	const db = await getDb();

	const [created] = await db
		.insert(artists)
		.values({
			nickname,
			fullNameTh,
			fullNameEn,
			profileImageUrl
		})
		.returning({
			id: artists.id,
			nickname: artists.nickname,
			fullNameTh: artists.fullNameTh,
			fullNameEn: artists.fullNameEn,
			profileImageUrl: artists.profileImageUrl
		});

	return json(created, { status: 201 });
};
