import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { getDb } from './db/index.js';
import { pushSubscriptions } from './db/schema.js';
import type { NotificationItem, PushSubscriptionInput } from '$lib/types.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
	webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function sendPushNotification(userId: string, item: NotificationItem) {
	if (!vapidPublicKey || !vapidPrivateKey) return;

	const db = await getDb();
	const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

	for (const sub of subs) {
		const pushSub: PushSubscriptionInput = {
			endpoint: sub.endpoint,
			keys: { p256dh: sub.p256dh, auth: sub.auth }
		};

		try {
			await webpush.sendNotification(
				pushSub,
				JSON.stringify({
					title: item.seriesTitle ?? 'GL-Orbit',
					body: item.message,
					data: { url: item.seriesId ? `/series/${item.seriesId}` : '/notifications' }
				})
			);
		} catch (err: any) {
			if (err.statusCode === 410 || err.statusCode === 404) {
				await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
			}
		}
	}
}
