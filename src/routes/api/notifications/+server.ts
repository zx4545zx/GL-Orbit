import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { notifications, series } from '$lib/server/db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	const rawLimit = parseInt(url.searchParams.get('limit') ?? '20', 10);
	const limit = Number.isNaN(rawLimit) ? 20 : Math.min(50, Math.max(1, rawLimit));
	const rawOffset = parseInt(url.searchParams.get('offset') ?? '0', 10);
	const offset = Number.isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
	const db = await getDb();

	const rawRows = await db
		.select({ id: notifications.id, seriesId: notifications.seriesId, type: notifications.type, message: notifications.message, isRead: notifications.isRead, createdAt: notifications.createdAt, seriesTitle: series.titleEn })
		.from(notifications)
		.innerJoin(series, eq(notifications.seriesId, series.id))
		.where(eq(notifications.userId, locals.user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(limit)
		.offset(offset);

	const [{ count: unreadCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));
	const [{ count: totalCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(eq(notifications.userId, locals.user.id));

	return json({
		notifications: rawRows.map((r) => ({ ...r, type: r.type as 'new_episode' | 'status_change', createdAt: r.createdAt.toISOString() })),
		unreadCount,
		totalCount,
		hasMore: offset + rawRows.length < totalCount,
		limit,
		offset
	});
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	let notificationId: string | undefined;
	try {
		const body = await request.json() as { notificationId?: unknown };
		notificationId = typeof body.notificationId === 'string' ? body.notificationId : undefined;
	} catch {
		notificationId = undefined;
	}

	const db = await getDb();
	if (notificationId) {
		await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, locals.user.id)));
	} else {
		await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));
	}
	const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));
	return json({ unreadCount: count });
};
