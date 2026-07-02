import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { pushSubscriptions } from '$lib/server/db/schema.js';
import type { PushSubscriptionInput } from '$lib/types.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	const body = (await request.json()) as { subscription?: Partial<PushSubscriptionInput> };
	const sub = body.subscription;
	if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
		return json({ error: 'ข้อมูล subscription ไม่ครบถ้วน' }, { status: 400 });
	}

	const db = await getDb();
	const existing = await db
		.select({ id: pushSubscriptions.id })
		.from(pushSubscriptions)
		.where(eq(pushSubscriptions.endpoint, sub.endpoint));

	if (existing.length > 0) {
		await db
			.update(pushSubscriptions)
			.set({
				userId: locals.user.id,
				p256dh: sub.keys.p256dh,
				auth: sub.keys.auth,
				userAgent: request.headers.get('user-agent') ?? '',
				updatedAt: new Date()
			})
			.where(eq(pushSubscriptions.endpoint, sub.endpoint));
	} else {
		await db.insert(pushSubscriptions).values({
			userId: locals.user.id,
			endpoint: sub.endpoint,
			p256dh: sub.keys.p256dh,
			auth: sub.keys.auth,
			userAgent: request.headers.get('user-agent') ?? ''
		});
	}

	return json({ success: true });
};
