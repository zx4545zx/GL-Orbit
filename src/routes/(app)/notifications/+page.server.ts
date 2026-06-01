import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { notifications, series } from '$lib/server/db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const db = await getDb();
	const limit = 20;
	const offset = 0;

	type NotificationType = 'new_episode' | 'status_change';

	const rawRows = await db
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
		.where(eq(notifications.userId, locals.user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(limit)
		.offset(offset);

	const rows = rawRows.map((r) => ({
		id: r.id,
		seriesId: r.seriesId,
		type: r.type as NotificationType,
		message: r.message,
		isRead: r.isRead,
		createdAt: r.createdAt.toISOString(),
		seriesTitle: r.seriesTitle
	}));

	const [{ count: unreadCount }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));

	const [{ count: totalCount }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(eq(notifications.userId, locals.user.id));

	return {
		notifications: rows,
		unreadCount,
		totalCount,
		hasMore: totalCount > limit
	};
};
