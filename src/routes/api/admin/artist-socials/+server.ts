import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { artistSocials, artists } from '$lib/server/db/schema.js';
import { asc, eq, isNull, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const offset = (page - 1) * limit;

	const db = await getDb();

	const result = await db
		.select({
			id: artistSocials.id,
			artistId: artistSocials.artistId,
			platform: artistSocials.platform,
			url: artistSocials.url,
			iconUrl: artistSocials.iconUrl,
			artistNickname: artists.nickname
		})
		.from(artistSocials)
		.innerJoin(artists, eq(artistSocials.artistId, artists.id))
		.where(isNull(artists.deletedAt))
		.orderBy(asc(artists.nickname), asc(artistSocials.platform))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(artistSocials)
		.innerJoin(artists, eq(artistSocials.artistId, artists.id))
		.where(isNull(artists.deletedAt));

	return json({ data: result, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const { artistId, platform, url, iconUrl } = body;

	if (!artistId || !platform || !url) {
		return json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน (artistId, platform, url)' }, { status: 400 });
	}

	const db = await getDb();

	const [inserted] = await db
		.insert(artistSocials)
		.values({ artistId, platform, url, iconUrl: iconUrl ?? null })
		.returning({
			id: artistSocials.id,
			artistId: artistSocials.artistId,
			platform: artistSocials.platform,
			url: artistSocials.url,
			iconUrl: artistSocials.iconUrl
		});

	return json({ success: true, data: inserted }, { status: 201 });
};
