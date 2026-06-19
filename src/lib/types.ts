export interface PublicUser {
	id: string;
	email: string;
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
	role: 'ADMIN' | 'USER';
}

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
	totalCount: number;
	hasMore: boolean;
	limit: number;
	offset: number;
}

export interface MarkReadResponse {
	unreadCount: number;
}

export interface ApiErrorResponse {
	error: string;
	fields?: Record<string, string>;
}

export interface AuthSuccessResponse {
	success: true;
	user: PublicUser;
}

export interface FavoriteSeriesItem {
	id: string;
	title: string;
	subtitle: string;
	poster: string;
	status: 'UPCOMING' | 'ONGOING' | 'ENDED';
	studio: string;
}

export interface ProfileUser extends PublicUser {
	createdAt: string;
}

export interface ProfileResponse {
	user: ProfileUser;
	favoriteSeries: FavoriteSeriesItem[];
}

export interface ProfileUpdateResponse {
	success: true;
	message: string;
	user: ProfileUser;
}

export interface PasswordUpdateResponse {
	success: true;
	message: string;
}
