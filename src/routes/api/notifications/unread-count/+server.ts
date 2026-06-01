import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { notifications } from '$lib/server/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ count: 0 });
	}

	const db = await getDb();

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));

	return json({ count });
};
