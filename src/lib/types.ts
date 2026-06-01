export interface NotificationItem {
	id: string;
	seriesId: string;
	type: 'new_episode' | 'status_change';
	message: string;
	isRead: boolean;
	createdAt: string;
	seriesTitle: string;
}

export interface UnreadCountResponse {
	count: number;
}

export interface NotificationsListResponse {
	notifications: NotificationItem[];
	unreadCount: number;
}

export interface MarkReadResponse {
	unreadCount: number;
}
