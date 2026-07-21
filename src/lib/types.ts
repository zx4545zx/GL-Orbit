export interface PublicUser {
	id: string;
	email: string;
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
	coverUrl: string | null;
	role: 'ADMIN' | 'USER';
}

export interface NotificationItem {
	id: string;
	seriesId: string | null;
	type: 'new_episode' | 'status_change' | 'announcement' | 'moment_like' | 'moment_comment';
	message: string;
	isRead: boolean;
	createdAt: string;
	seriesTitle: string | null;
	momentId?: string | null;
	commentId?: string | null;
	actorUserId?: string | null;
	metadata?: Record<string, unknown> | null;
	targetUrl?: string | null;
}

export interface PushSubscriptionInput {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
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

export interface WatchedSeriesItem {
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
	watchedSeries: WatchedSeriesItem[];
}

export interface ProfileUpdateResponse {
	success: true;
	message: string;
	user: ProfileUser;
}

export interface PasswordUpdateResponse {
	success: true;
	message: string;
	revokedCount: number;
}

export interface DeviceSessionItem {
	id: string;
	browser: string | null;
	operatingSystem: string | null;
	deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
	maskedIp: string | null;
	city: string | null;
	countryCode: string | null;
	createdAt: string;
	lastSeenAt: string;
	expiresAt: string;
	isCurrent: boolean;
}

export interface SessionsResponse {
	sessions: DeviceSessionItem[];
}

export interface SessionMutationResponse {
	success: true;
	revokedCount: number;
}
