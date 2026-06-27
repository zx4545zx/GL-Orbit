import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { studioSocials, studios } from '$lib/server/db/schema.js';
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
			id: studioSocials.id,
			studioId: studioSocials.studioId,
			platform: studioSocials.platform,
			url: studioSocials.url,
			iconUrl: studioSocials.iconUrl,
			studioName: studios.name
		})
		.from(studioSocials)
		.innerJoin(studios, eq(studioSocials.studioId, studios.id))
		.where(isNull(studios.deletedAt))
		.orderBy(asc(studios.name), asc(studioSocials.platform))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(studioSocials)
		.innerJoin(studios, eq(studioSocials.studioId, studios.id))
		.where(isNull(studios.deletedAt));

	return json({ data: result, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const { studioId, platform, url, iconUrl } = body;

	if (!studioId || !platform || !url) {
		return json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน (studioId, platform, url)' }, { status: 400 });
	}

	const db = await getDb();

	const [inserted] = await db
		.insert(studioSocials)
		.values({ studioId, platform, url, iconUrl: iconUrl ?? null })
		.returning({
			id: studioSocials.id,
			studioId: studioSocials.studioId,
			platform: studioSocials.platform,
			url: studioSocials.url,
			iconUrl: studioSocials.iconUrl
		});

	return json({ success: true, data: inserted }, { status: 201 });
};
