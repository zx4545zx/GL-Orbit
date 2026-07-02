import type { NotificationItem } from '$lib/types.js';

const controllers = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

export function subscribeUserNotifications(userId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
	const set = controllers.get(userId) ?? new Set();
	set.add(controller);
	controllers.set(userId, set);

	return () => {
		set.delete(controller);
		if (set.size === 0) controllers.delete(userId);
	};
}

export function broadcastNotification(userId: string, notification: NotificationItem) {
	const set = controllers.get(userId);
	if (!set) return;
	const data = new TextEncoder().encode(
		`event: notification\ndata: ${JSON.stringify(notification)}\n\n`
	);
	for (const c of set) {
		try {
			c.enqueue(data);
		} catch {
			set.delete(c);
		}
	}
}

export function broadcastUnreadCount(userId: string, count: number) {
	const set = controllers.get(userId);
	if (!set) return;
	const data = new TextEncoder().encode(
		`event: count\ndata: ${JSON.stringify({ count })}\n\n`
	);
	for (const c of set) {
		try {
			c.enqueue(data);
		} catch {
			set.delete(c);
		}
	}
}
