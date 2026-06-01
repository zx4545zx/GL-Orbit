import { getDb } from './db/index.js';
import { favorites, notifications } from './db/schema.js';
import { eq } from 'drizzle-orm';

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
