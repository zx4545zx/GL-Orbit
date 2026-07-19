import webpush from 'web-push';
import { and, eq, inArray, or } from 'drizzle-orm';
import { getDb } from './db/index.js';
import { pushSubscriptions } from './db/schema.js';
import type { NotificationItem, PushSubscriptionInput } from '$lib/types.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
	webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const SUBSCRIPTION_BATCH_SIZE = 500;
const DELIVERY_BATCH_SIZE = 50;

export interface PushNotificationRecipient {
	userId: string;
	item: NotificationItem;
}

function chunks<T>(values: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let index = 0; index < values.length; index += size) {
		result.push(values.slice(index, index + size));
	}
	return result;
}

export async function sendPushNotifications(recipients: PushNotificationRecipient[]): Promise<void> {
	if (!vapidPublicKey || !vapidPrivateKey) return;
	if (recipients.length === 0) return;

	const db = await getDb();
	const itemsByUser = new Map<string, NotificationItem[]>();
	for (const { userId, item } of recipients) {
		const items = itemsByUser.get(userId) ?? [];
		items.push(item);
		itemsByUser.set(userId, items);
	}

	const staleSubscriptions = new Map<string, { id: string; endpoint: string; p256dh: string; auth: string }>();
	for (const userIdBatch of chunks([...itemsByUser.keys()], SUBSCRIPTION_BATCH_SIZE)) {
		const subscriptions = await db
			.select()
			.from(pushSubscriptions)
			.where(inArray(pushSubscriptions.userId, userIdBatch));

		const deliveries = subscriptions.flatMap((subscription) =>
			(itemsByUser.get(subscription.userId) ?? []).map((item) => ({ subscription, item }))
		);
		for (const deliveryBatch of chunks(deliveries, DELIVERY_BATCH_SIZE)) {
			await Promise.all(deliveryBatch.map(async ({ subscription, item }) => {
				const pushSubscription: PushSubscriptionInput = {
					endpoint: subscription.endpoint,
					keys: { p256dh: subscription.p256dh, auth: subscription.auth }
				};
				try {
					await webpush.sendNotification(
						pushSubscription,
						JSON.stringify({
							title: item.seriesTitle ?? 'GL-Orbit',
							body: item.message,
							data: { url: item.targetUrl ?? (item.seriesId ? `/series/${item.seriesId}` : '/notifications') }
						})
					);
				} catch (error: unknown) {
					const statusCode = error && typeof error === 'object' && 'statusCode' in error
						? (error as { statusCode?: unknown }).statusCode
						: undefined;
					if (statusCode === 404 || statusCode === 410) {
						staleSubscriptions.set(subscription.id, {
							id: subscription.id,
							endpoint: subscription.endpoint,
							p256dh: subscription.p256dh,
							auth: subscription.auth
						});
					}
				}
			}));
		}
	}

	for (const staleBatch of chunks([...staleSubscriptions.values()], SUBSCRIPTION_BATCH_SIZE)) {
		const conditions = staleBatch.map((subscription) => and(
			eq(pushSubscriptions.id, subscription.id),
			eq(pushSubscriptions.endpoint, subscription.endpoint),
			eq(pushSubscriptions.p256dh, subscription.p256dh),
			eq(pushSubscriptions.auth, subscription.auth)
		));
		const condition = or(...conditions);
		if (condition) await db.delete(pushSubscriptions).where(condition);
	}
}

export async function sendPushNotification(userId: string, item: NotificationItem): Promise<void> {
	await sendPushNotifications([{ userId, item }]);
}
