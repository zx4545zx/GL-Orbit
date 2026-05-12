import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { platforms } from '$lib/server/db/schema.js';
import { isNull, asc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const offset = (page - 1) * limit;

	const db = await getDb();

	const allPlatforms = await db
		.select({
			id: platforms.id,
			name: platforms.name,
			logoUrl: platforms.logoUrl,
			baseUrl: platforms.baseUrl
		})
		.from(platforms)
		.where(isNull(platforms.deletedAt))
		.orderBy(asc(platforms.name))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(platforms)
		.where(isNull(platforms.deletedAt));

	return json({ data: allPlatforms, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};
