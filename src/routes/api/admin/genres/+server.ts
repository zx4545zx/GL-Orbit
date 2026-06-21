import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { genres } from '$lib/server/db/schema.js';
import { asc, sql, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const offset = (page - 1) * limit;

	const db = await getDb();

	const allGenres = await db
		.select({ id: genres.id, name: genres.name })
		.from(genres)
		.orderBy(asc(genres.name))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(genres);

	return json({ data: allGenres, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const { name } = body;

	if (!name) {
		return json({ success: false, error: 'กรุณากรอกชื่อประเภท' }, { status: 400 });
	}

	const db = await getDb();

	try {
		const [inserted] = await db.insert(genres).values({ name }).returning({ id: genres.id, name: genres.name });
		return json({ success: true, data: inserted }, { status: 201 });
	} catch (err: unknown) {
		if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
			return json({ success: false, error: 'ประเภทนี้มีอยู่แล้ว' }, { status: 400 });
		}
		throw err;
	}
};
