import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { studios } from '$lib/server/db/schema.js';
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

	const allStudios = await db
		.select({
			id: studios.id,
			name: studios.name,
			logoUrl: studios.logoUrl,
			officialSite: studios.officialSite
		})
		.from(studios)
		.where(isNull(studios.deletedAt))
		.orderBy(asc(studios.name))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(studios)
		.where(isNull(studios.deletedAt));

	return json({ data: allStudios, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const { name, logoUrl, officialSite } = body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		error(400, 'กรุณาระบุชื่อสตูดิโอ');
	}

	const db = await getDb();

	const [created] = await db
		.insert(studios)
		.values({
			name: name.trim(),
			logoUrl: logoUrl ?? null,
			officialSite: officialSite ?? null,
			createdBy: locals.user.id
		})
		.returning({
			id: studios.id,
			name: studios.name,
			logoUrl: studios.logoUrl,
			officialSite: studios.officialSite
		});

	return json(created, { status: 201 });
};
