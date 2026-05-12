import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { artistSocials, artists } from '$lib/server/db/schema.js';
import { eq, asc, sql } from 'drizzle-orm';
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
			id: artistSocials.id,
			artistId: artistSocials.artistId,
			platform: artistSocials.platform,
			url: artistSocials.url,
			iconUrl: artistSocials.iconUrl,
			artistNickname: artists.nickname
		})
		.from(artistSocials)
		.innerJoin(artists, eq(artistSocials.artistId, artists.id))
		.orderBy(asc(artists.nickname), asc(artistSocials.platform))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(artistSocials);

	return json({ data: result, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};
