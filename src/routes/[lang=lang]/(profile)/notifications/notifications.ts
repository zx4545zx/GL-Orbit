/**
 * Client-side fetch module for notifications page.
 * Used by +page.svelte to load data on mount.
 */

import type { NotificationItem } from '$lib/types.js';

export interface NotificationsFetchResult {
	notifications: NotificationItem[];
	unreadCount: number;
	totalCount: number;
	hasMore: boolean;
	limit: number;
	offset: number;
	loadError: string;
}

export async function fetchNotifications(limit = 20, offset = 0): Promise<NotificationsFetchResult> {
	try {
		const res = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`);
		if (!res.ok) {
			return {
				notifications: [],
				unreadCount: 0,
				totalCount: 0,
				hasMore: false,
				limit,
				offset,
				loadError: 'ไม่สามารถโหลดการแจ้งเตือนได้'
			};
		}
		const data = await res.json();
		return {
			...data,
			limit,
			offset,
			loadError: ''
		};
	} catch {
		return {
			notifications: [],
			unreadCount: 0,
			totalCount: 0,
			hasMore: false,
			limit,
			offset,
			loadError: 'ไม่สามารถโหลดการแจ้งเตือนได้'
		};
	}
}
