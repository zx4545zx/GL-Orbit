import { json } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { momentReports } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') return json({ error: 'FORBIDDEN' }, { status: 403 });
	const db = await getDb();
	return json({ reports: await db.select().from(momentReports).where(eq(momentReports.status, 'PENDING')).orderBy(asc(momentReports.createdAt)) });
};
