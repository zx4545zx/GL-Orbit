import { error, json } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { news } from '$lib/server/db/schema.js';
import { hasNewsSlugConflict, validateNewsWrite, type NewsWriteInput } from '$lib/server/news.js';
import type { RequestHandler } from './$types.js';

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'ADMIN') error(403, 'ไม่มีสิทธิ์เข้าถึง');
}

export const GET: RequestHandler = async ({ locals, params }) => {
	requireAdmin(locals);
	const db = await getDb();
	const [item] = await db.select().from(news).where(and(eq(news.id, params.id), isNull(news.deletedAt))).limit(1);
	if (!item) error(404, 'ไม่พบข่าว');
	return json({ success: true, data: item });
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	requireAdmin(locals);
	let body: NewsWriteInput;
	try { body = await request.json() as NewsWriteInput; } catch { return json({ success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 }); }
	const validated = validateNewsWrite(body);
	if (!validated.ok) return json({ success: false, error: validated.error }, { status: 400 });
	const db = await getDb();
	const [existing] = await db.select({ id: news.id }).from(news).where(and(eq(news.id, params.id), isNull(news.deletedAt))).limit(1);
	if (!existing) error(404, 'ไม่พบข่าว');
	if (await hasNewsSlugConflict(validated.data.slug, params.id)) return json({ success: false, error: 'slug นี้ถูกใช้แล้ว' }, { status: 409 });
	const [updated] = await db.update(news).set({ ...validated.data, updatedAt: new Date() }).where(eq(news.id, params.id)).returning();
	return json({ success: true, data: updated });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	requireAdmin(locals);
	const db = await getDb();
	const [deleted] = await db.update(news).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(news.id, params.id), isNull(news.deletedAt))).returning({ id: news.id });
	if (!deleted) error(404, 'ไม่พบข่าว');
	return json({ success: true });
};
