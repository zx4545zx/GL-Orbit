import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { pushSubscriptions } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	const body = (await request.json()) as { endpoint?: unknown };
	const endpoint = typeof body.endpoint === 'string' ? body.endpoint : undefined;
	if (!endpoint) return json({ error: 'endpoint ไม่ถูกต้อง' }, { status: 400 });

	const db = await getDb();
	await db
		.delete(pushSubscriptions)
		.where(and(eq(pushSubscriptions.userId, locals.user.id), eq(pushSubscriptions.endpoint, endpoint)));

	return json({ success: true });
};
