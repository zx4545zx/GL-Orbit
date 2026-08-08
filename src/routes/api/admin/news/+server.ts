import { error, json } from '@sveltejs/kit';
import { and, desc, isNull, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { news } from '$lib/server/db/schema.js';
import { hasNewsSlugConflict, validateNewsWrite, type NewsWriteInput } from '$lib/server/news.js';
import type { RequestHandler } from './$types.js';

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'ADMIN') error(403, 'ไม่มีสิทธิ์เข้าถึง');
}

export const GET: RequestHandler = async ({ locals, url }) => {
	requireAdmin(locals);
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const db = await getDb();
	const where = isNull(news.deletedAt);
	const rows = await db.select().from(news).where(where).orderBy(desc(news.updatedAt), desc(news.id)).limit(limit).offset((page - 1) * limit);
	const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(news).where(where);
	return json({ data: rows, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	requireAdmin(locals);
	let body: NewsWriteInput;
	try { body = await request.json() as NewsWriteInput; } catch { return json({ success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 }); }
	const validated = validateNewsWrite(body);
	if (!validated.ok) return json({ success: false, error: validated.error }, { status: 400 });
	if (await hasNewsSlugConflict(validated.data.slug)) return json({ success: false, error: 'slug นี้ถูกใช้แล้ว' }, { status: 409 });
	const db = await getDb();
	const [created] = await db.insert(news).values({ ...validated.data, createdBy: locals.user!.id }).returning();
	return json({ success: true, data: created }, { status: 201 });
};
