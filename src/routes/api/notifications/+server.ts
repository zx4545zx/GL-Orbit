import { json } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { notifications } from '$lib/server/db/schema.js';
import { getUserNotifications, parseNotificationPagination } from '$lib/server/notifications.js';
import { broadcastNotificationRead, broadcastNotificationsCleared, broadcastUnreadCount } from '$lib/server/notifications-sse.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	const { limit, offset } = parseNotificationPagination(url.searchParams);
	return json(await getUserNotifications(locals.user.id, limit, offset));
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
		broadcastNotificationRead(locals.user.id, notificationId);
	} else {
		await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));
		broadcastNotificationsCleared(locals.user.id);
	}
	const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));
	broadcastUnreadCount(locals.user.id, count);
	return json({ unreadCount: count });
};
