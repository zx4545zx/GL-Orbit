import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, and, isNull, desc } from 'drizzle-orm';

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop';

function serializeUser(user: NonNullable<App.Locals['user']>) {
	return {
		id: user.id,
		email: user.email,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
		role: user.role,
		createdAt: user.createdAt.toISOString()
	};
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	const db = await getDb();
	const favoriteSeries = await db
		.select({ id: schema.series.id, titleEn: schema.series.titleEn, titleTh: schema.series.titleTh, posterUrl: schema.series.posterUrl, status: schema.series.status, studioName: schema.studios.name })
		.from(schema.favorites)
		.innerJoin(schema.series, eq(schema.favorites.seriesId, schema.series.id))
		.leftJoin(schema.studios, eq(schema.series.studioId, schema.studios.id))
		.where(and(eq(schema.favorites.userId, locals.user.id), isNull(schema.series.deletedAt)))
		.orderBy(desc(schema.favorites.createdAt));

	return json({
		user: serializeUser(locals.user),
		favoriteSeries: favoriteSeries.map((s) => ({ id: s.id, title: s.titleEn, subtitle: s.titleTh ?? '', poster: s.posterUrl ?? FALLBACK_POSTER, status: s.status, studio: s.studioName ?? 'ไม่ระบุสตูดิโอ' }))
	});
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	let body: { displayName?: unknown; avatarUrl?: unknown };
	try { body = await request.json(); } catch { return json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 }); }
	const displayName = typeof body.displayName === 'string' && body.displayName.trim() ? body.displayName.trim() : null;
	const avatarUrl = typeof body.avatarUrl === 'string' && body.avatarUrl.trim() ? body.avatarUrl.trim() : null;

	const db = await getDb();
	const [updated] = await db
		.update(schema.users)
		.set({ displayName, avatarUrl, updatedAt: new Date() })
		.where(eq(schema.users.id, locals.user.id))
		.returning();

	if (!updated) return json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
	return json({ success: true, message: 'อัปเดตโปรไฟล์สำเร็จ', user: serializeUser(updated) });
};
