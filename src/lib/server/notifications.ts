import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from './db/index.js';
import { favorites, notifications, series } from './db/schema.js';
import type { NotificationItem, NotificationsListResponse } from '$lib/types.js';

export type NotificationType = 'new_episode' | 'status_change';

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
		.innerJoin(series, eq(notifications.seriesId, series.id))
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
	const db = await getDb();

	// Get all followers for this series
	const followers = await db
		.select({ userId: favorites.userId })
		.from(favorites)
		.where(eq(favorites.seriesId, seriesId));

	if (followers.length === 0) {
		return 0;
	}

	// Filter out the actor (don't notify yourself)
	const targetUserIds = actorId
		? followers.filter((f) => f.userId !== actorId).map((f) => f.userId)
		: followers.map((f) => f.userId);

	if (targetUserIds.length === 0) {
		return 0;
	}

	// Batch INSERT
	const values = targetUserIds.map((userId) => ({
		userId,
		seriesId,
		type,
		message
	}));

	await db.insert(notifications).values(values);

	return targetUserIds.length;
}
