import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from './db/index.js';
import { favorites, notifications, series, users } from './db/schema.js';
import { broadcastNotification, broadcastUnreadCount } from './notifications-sse.js';
import { sendPushNotification } from './push-notifications.js';
import type { NotificationItem, NotificationsListResponse } from '$lib/types.js';

export type NotificationType = 'new_episode' | 'status_change' | 'announcement';

export interface NotificationRecord {
	id: string;
	userId: string;
	seriesId: string;
	type: NotificationType;
	message: string;
	isRead: boolean;
	createdAt: Date;
}

export function parseNotificationPagination(searchParams: URLSearchParams): { limit: number; offset: number } {
	const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);
	const limit = Number.isNaN(rawLimit) ? 20 : Math.min(50, Math.max(1, rawLimit));
	const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10);
	const offset = Number.isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
	return { limit, offset };
}

export async function getUserNotifications(
	userId: string,
	limit = 20,
	offset = 0
): Promise<NotificationsListResponse> {
	const db = await getDb();

	const listRowsPromise = db
		.select({
			id: notifications.id,
			seriesId: notifications.seriesId,
			type: notifications.type,
			message: notifications.message,
			isRead: notifications.isRead,
			createdAt: notifications.createdAt,
			seriesTitle: series.titleEn
		})
		.from(notifications)
		.leftJoin(series, eq(notifications.seriesId, series.id))
		.where(eq(notifications.userId, userId))
		.orderBy(desc(notifications.createdAt))
		.limit(limit)
		.offset(offset);

	const unreadCountPromise = db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

	const totalCountPromise = db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(eq(notifications.userId, userId));

	const [rawRows, [{ count: unreadCount }], [{ count: totalCount }]] = await Promise.all([
		listRowsPromise,
		unreadCountPromise,
		totalCountPromise
	]);

	const notificationItems: NotificationItem[] = rawRows.map((row) => ({
		...row,
		type: row.type as NotificationType,
		createdAt: row.createdAt.toISOString()
	}));

	return {
		notifications: notificationItems,
		unreadCount,
		totalCount,
		hasMore: offset + rawRows.length < totalCount,
		limit,
		offset
	};
}

async function enrichNotification(row: typeof notifications.$inferSelect): Promise<NotificationItem> {
	const db = await getDb();
	const seriesRow = row.seriesId
		? (await db.select({ titleEn: series.titleEn }).from(series).where(eq(series.id, row.seriesId)))[0]
		: undefined;

	return {
		id: row.id,
		seriesId: row.seriesId,
		type: row.type as NotificationType,
		message: row.message,
		isRead: row.isRead,
		createdAt: row.createdAt.toISOString(),
		seriesTitle: seriesRow?.titleEn ?? null
	};
}

export async function createAndBroadcastNotification(
	userId: string,
	seriesId: string,
	type: NotificationType,
	message: string
): Promise<NotificationItem> {
	const db = await getDb();

	const [row] = await db
		.insert(notifications)
		.values({ userId, seriesId, type, message })
		.returning();

	const item = await enrichNotification(row);
	broadcastNotification(userId, item);

	const [{ count: unreadCount }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
	broadcastUnreadCount(userId, unreadCount);

	await sendPushNotification(userId, item);

	return item;
}

export async function sendNotificationToUsers(
	seriesId: string,
	type: NotificationType,
	message: string,
	recipientType: 'followers' | 'global',
	actorId?: string
): Promise<number> {
	const db = await getDb();

	let userIds: string[];
	if (recipientType === 'followers') {
		const rows = await db
			.select({ userId: favorites.userId })
			.from(favorites)
			.where(eq(favorites.seriesId, seriesId));
		userIds = rows.map((r) => r.userId).filter((id) => id !== actorId);
	} else {
		const rows = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.isActive, true));
		userIds = rows.map((r) => r.id);
	}

	if (userIds.length === 0) return 0;

	const values = userIds.map((userId) => ({
		userId,
		seriesId,
		type,
		message
	}));

	const inserted = await db.insert(notifications).values(values).returning();

	await Promise.all(
		inserted.map(async (row) => {
			const item = await enrichNotification(row);
			broadcastNotification(row.userId, item);
			await sendPushNotification(row.userId, item);
		})
	);

	return inserted.length;
}

/**
 * Batch-create notifications for all followers of a series.
 * Skips the actor (e.g. admin who created the episode) so they don't notify themselves.
 * If there are no followers (or only the actor), no INSERT happens.
 */
export async function createFollowerNotifications(
	seriesId: string,
	type: NotificationType,
	message: string,
	actorId?: string
): Promise<number> {
	return sendNotificationToUsers(seriesId, type, message, 'followers', actorId);
}
