import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { notifications, series } from '$lib/server/db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	}

	const rawLimit = parseInt(url.searchParams.get('limit') ?? '5', 10);
	const limit = Number.isNaN(rawLimit) ? 5 : Math.min(50, Math.max(1, rawLimit));
	const db = await getDb();

	const rows = await db
		.select({
			id: notifications.id,
			userId: notifications.userId,
			seriesId: notifications.seriesId,
			type: notifications.type,
			message: notifications.message,
			isRead: notifications.isRead,
			createdAt: notifications.createdAt,
			seriesTitle: series.titleEn
		})
		.from(notifications)
		.innerJoin(series, eq(notifications.seriesId, series.id))
		.where(eq(notifications.userId, locals.user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(limit);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));

	return json({ notifications: rows, unreadCount: count });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	}

	const body = await request.json();
	const notificationId: string | undefined = body.notificationId;

	const db = await getDb();

	if (notificationId) {
		// Mark single notification as read
		await db
			.update(notifications)
			.set({ isRead: true })
			.where(and(eq(notifications.id, notificationId), eq(notifications.userId, locals.user.id)));
	} else {
		// Mark all as read
		await db
			.update(notifications)
			.set({ isRead: true })
			.where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));
	}

	// Return updated unread count
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));

	return json({ unreadCount: count });
};
