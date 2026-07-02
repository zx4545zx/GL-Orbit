import type { NotificationItem } from '$lib/types.js';

export interface NotificationStreamCallbacks {
	onNotification?: (item: NotificationItem) => void;
	onCount?: (count: number) => void;
	onRead?: (notificationId: string) => void;
	onCleared?: () => void;
	onConnected?: () => void;
}

export function connectNotificationStream(callbacks: NotificationStreamCallbacks) {
	const source = new EventSource('/api/notifications/stream');

	source.addEventListener('connected', () => {
		callbacks.onConnected?.();
	});

	source.addEventListener('notification', (event) => {
		const item: NotificationItem = JSON.parse(event.data);
		callbacks.onNotification?.(item);
	});

	source.addEventListener('count', (event) => {
		const payload: { count: number } = JSON.parse(event.data);
		callbacks.onCount?.(payload.count);
	});

	source.addEventListener('read', (event) => {
		const payload: { notificationId: string } = JSON.parse(event.data);
		callbacks.onRead?.(payload.notificationId);
	});

	source.addEventListener('cleared', () => {
		callbacks.onCleared?.();
	});

	source.addEventListener('error', () => {
		// auto-reconnect is built into EventSource
	});

	return () => source.close();
}
