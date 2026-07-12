import { check, index, jsonb, pgEnum, pgTable, primaryKey, text, time, timestamp, uniqueIndex, uuid, varchar, boolean, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'USER']);
export const seriesStatusEnum = pgEnum('series_status', ['UPCOMING', 'ONGOING', 'ENDED']);
export const momentSourceProviderEnum = pgEnum('moment_source_provider', ['YOUTUBE', 'TIKTOK', 'X', 'OTHER']);
export const momentEmbedStatusEnum = pgEnum('moment_embed_status', ['READY', 'FALLBACK', 'FAILED']);
export const momentStatusEnum = pgEnum('moment_status', ['UPLOADING', 'PUBLISHED', 'HIDDEN', 'DELETED']);
export const momentMediaTypeEnum = pgEnum('moment_media_type', ['IMAGE']);
export const momentMediaSourceEnum = pgEnum('moment_media_source', ['EXTERNAL', 'UPLOAD']);
export const momentCommentStatusEnum = pgEnum('moment_comment_status', ['PUBLISHED', 'HIDDEN', 'DELETED']);
export const momentReportReasonEnum = pgEnum('moment_report_reason', ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'COPYRIGHT', 'MISLEADING', 'OTHER']);
export const momentReportStatusEnum = pgEnum('moment_report_status', ['PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED']);

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: varchar('username', { length: 255 }).notNull().unique(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	displayName: varchar('display_name', { length: 255 }),
	avatarUrl: text('avatar_url'),
	coverUrl: text('cover_url'),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	role: userRoleEnum('role').notNull().default('USER'),
	preferredLanguage: varchar('preferred_language', { length: 10 }).notNull().default('th'),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const sessions = pgTable('sessions', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const studios = pgTable('studios', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	logoUrl: text('logo_url'),
	officialSite: text('official_site'),
	createdBy: uuid('created_by').references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const studioSocials = pgTable('studio_socials', {
	id: uuid('id').defaultRandom().primaryKey(),
	studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
	platform: varchar('platform', { length: 255 }).notNull(),
	url: text('url').notNull(),
	iconUrl: text('icon_url')
});

export const platforms = pgTable('platforms', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	logoUrl: text('logo_url'),
	baseUrl: text('base_url'),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const artists = pgTable('artists', {
	id: uuid('id').defaultRandom().primaryKey(),
	nickname: varchar('nickname', { length: 255 }).notNull(),
	fullNameTh: varchar('full_name_th', { length: 255 }),
	fullNameEn: varchar('full_name_en', { length: 255 }).notNull(),
	profileImageUrl: text('profile_image_url'),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const ships = pgTable('ships', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	slug: varchar('slug', { length: 255 }).notNull().unique(),
	artist1Id: uuid('artist_1_id').notNull().references(() => artists.id, { onDelete: 'restrict' }),
	artist2Id: uuid('artist_2_id').notNull().references(() => artists.id, { onDelete: 'restrict' }),
	pairKey: varchar('pair_key', { length: 80 }).notNull().unique(),
	imageUrl: text('image_url'),
	description: text('description'),
	startedAt: timestamp('started_at', { withTimezone: true }),
	hashtags: jsonb('hashtags').$type<string[]>().notNull().default([]),
	isFeatured: boolean('is_featured').notNull().default(false),
	isPublished: boolean('is_published').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const artistSocials = pgTable('artist_socials', {
	id: uuid('id').defaultRandom().primaryKey(),
	artistId: uuid('artist_id').notNull().references(() => artists.id, { onDelete: 'cascade' }),
	platform: varchar('platform', { length: 255 }).notNull(),
	url: text('url').notNull(),
	iconUrl: text('icon_url')
});

export const series = pgTable('series', {
	id: uuid('id').defaultRandom().primaryKey(),
	studioId: uuid('studio_id').references(() => studios.id),
	titleTh: varchar('title_th', { length: 255 }),
	titleEn: varchar('title_en', { length: 255 }).notNull(),
	descriptionTh: text('description_th'),
	descriptionEn: text('description_en'),
	posterUrl: text('poster_url'),
	coverUrl: text('cover_url'),
	status: seriesStatusEnum('status').notNull().default('UPCOMING'),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const seriesGalleryImages = pgTable('series_gallery_images', {
	id: uuid('id').defaultRandom().primaryKey(),
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	imageUrl: text('image_url').notNull(),
	caption: text('caption'),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const seriesArtists = pgTable('series_artists', {
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	artistId: uuid('artist_id').notNull().references(() => artists.id, { onDelete: 'cascade' }),
	roleName: varchar('role_name', { length: 255 })
}, (table) => ({
	pk: { columns: [table.seriesId, table.artistId] }
}));

export const shipSeries = pgTable('ship_series', {
	shipId: uuid('ship_id').notNull().references(() => ships.id, { onDelete: 'cascade' }),
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	pk: { columns: [table.shipId, table.seriesId] }
}));

export const favorites = pgTable('favorites', {
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	pk: { columns: [table.userId, table.seriesId] }
}));

export const watched = pgTable('watched', {
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	pk: { columns: [table.userId, table.seriesId] }
}));

export const genres = pgTable('genres', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const seriesGenres = pgTable('series_genres', {
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	genreId: uuid('genre_id').notNull().references(() => genres.id, { onDelete: 'cascade' })
}, (table) => ({
	pk: { columns: [table.seriesId, table.genreId] }
}));

export const seriesSchedules = pgTable('series_schedules', {
	id: uuid('id').defaultRandom().primaryKey(),
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	platformId: uuid('platform_id').notNull().references(() => platforms.id),
	dayOfWeek: integer('day_of_week').notNull(),
	airTime: time('air_time').notNull(),
	isUncut: boolean('is_uncut').notNull().default(false)
});

export const episodes = pgTable('episodes', {
	id: uuid('id').defaultRandom().primaryKey(),
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	episodeNumber: integer('episode_number').notNull(),
	title: varchar('title', { length: 255 }),
	coverUrl: text('cover_url'),
	trailerUrl: text('trailer_url'),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const episodeSchedules = pgTable('episode_schedules', {
	id: uuid('id').defaultRandom().primaryKey(),
	episodeId: uuid('episode_id').notNull().references(() => episodes.id, { onDelete: 'cascade' }),
	platformId: uuid('platform_id').notNull().references(() => platforms.id),
	airDate: timestamp('air_date', { withTimezone: true }).notNull(),
	streamLink: text('stream_link'),
	isUncut: boolean('is_uncut').notNull().default(false),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const moments = pgTable('moments', {
	id: uuid('id').defaultRandom().primaryKey(),
	authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	body: text('body'),
	sourceUrl: text('source_url'),
	sourceCanonicalUrl: text('source_canonical_url'),
	sourceProvider: momentSourceProviderEnum('source_provider').notNull(),
	sourceExternalId: varchar('source_external_id', { length: 255 }),
	embedStatus: momentEmbedStatusEnum('embed_status').notNull().default('FALLBACK'),
	embedMetadata: jsonb('embed_metadata').$type<{ title?: string; authorName?: string; thumbnailUrl?: string; providerName?: string }>().notNull().default({}),
	status: momentStatusEnum('status').notNull().default('PUBLISHED'),
	pendingMediaCount: integer('pending_media_count').notNull().default(0),
	language: varchar('language', { length: 10 }),
	likeCount: integer('like_count').notNull().default(0),
	commentCount: integer('comment_count').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => ({
	authorSourceUnique: uniqueIndex('moments_author_source_unique').on(table.authorId, table.sourceCanonicalUrl),
	feedIndex: index('moments_feed_idx').on(table.status, table.createdAt, table.id),
	authorIndex: index('moments_author_idx').on(table.authorId, table.createdAt, table.id),
	likeCountNonNegative: check('moments_like_count_non_negative', sql`${table.likeCount} >= 0`),
	commentCountNonNegative: check('moments_comment_count_non_negative', sql`${table.commentCount} >= 0`),
	pendingMediaCountRange: check('moments_pending_media_count_range', sql`${table.pendingMediaCount} BETWEEN 0 AND 4`),
	pendingMediaStatus: check('moments_pending_media_status', sql`${table.status} <> 'UPLOADING' OR ${table.pendingMediaCount} > 0`)
}));

export const momentMedia = pgTable('moment_media', {
	id: uuid('id').defaultRandom().primaryKey(),
	momentId: uuid('moment_id').notNull().references(() => moments.id, { onDelete: 'cascade' }),
	mediaType: momentMediaTypeEnum('media_type').notNull().default('IMAGE'),
	sourceType: momentMediaSourceEnum('source_type').notNull().default('EXTERNAL'),
	externalUrl: text('external_url'), storageKey: text('storage_key'), altText: varchar('alt_text', { length: 500 }),
	sortOrder: integer('sort_order').notNull().default(0), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	momentIndex: index('moment_media_moment_idx').on(table.momentId, table.sortOrder),
	momentSortUnique: uniqueIndex('moment_media_moment_sort_unique').on(table.momentId, table.sortOrder),
	externalOnly: check('moment_media_external_only', sql`(${table.sourceType} <> 'EXTERNAL') OR (${table.externalUrl} IS NOT NULL AND ${table.storageKey} IS NULL)`)
}));

export const momentLikes = pgTable('moment_likes', {
	momentId: uuid('moment_id').notNull().references(() => moments.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({ pk: primaryKey({ columns: [table.momentId, table.userId] }), userIndex: index('moment_likes_user_idx').on(table.userId, table.createdAt) }));

export const momentBookmarks = pgTable('moment_bookmarks', {
	momentId: uuid('moment_id').notNull().references(() => moments.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({ pk: primaryKey({ columns: [table.momentId, table.userId] }), userIndex: index('moment_bookmarks_user_idx').on(table.userId, table.createdAt) }));

export const momentComments = pgTable('moment_comments', {
	id: uuid('id').defaultRandom().primaryKey(),
	momentId: uuid('moment_id').notNull().references(() => moments.id, { onDelete: 'cascade' }),
	authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	parentId: uuid('parent_id'), body: text('body').notNull(),
	status: momentCommentStatusEnum('status').notNull().default('PUBLISHED'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => ({
	momentIndex: index('moment_comments_moment_idx').on(table.momentId, table.createdAt, table.id), parentIndex: index('moment_comments_parent_idx').on(table.parentId, table.createdAt, table.id),
	parentNotSelf: check('moment_comments_parent_not_self', sql`${table.parentId} IS NULL OR ${table.parentId} <> ${table.id}`)
}));

export const momentSeries = pgTable('moment_series', { momentId: uuid('moment_id').notNull().references(() => moments.id, { onDelete: 'cascade' }), seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }) }, (table) => ({ pk: primaryKey({ columns: [table.momentId, table.seriesId] }), entityIndex: index('moment_series_series_idx').on(table.seriesId, table.momentId) }));
export const momentArtists = pgTable('moment_artists', { momentId: uuid('moment_id').notNull().references(() => moments.id, { onDelete: 'cascade' }), artistId: uuid('artist_id').notNull().references(() => artists.id, { onDelete: 'cascade' }) }, (table) => ({ pk: primaryKey({ columns: [table.momentId, table.artistId] }), entityIndex: index('moment_artists_artist_idx').on(table.artistId, table.momentId) }));
export const momentShips = pgTable('moment_ships', { momentId: uuid('moment_id').notNull().references(() => moments.id, { onDelete: 'cascade' }), shipId: uuid('ship_id').notNull().references(() => ships.id, { onDelete: 'cascade' }) }, (table) => ({ pk: primaryKey({ columns: [table.momentId, table.shipId] }), entityIndex: index('moment_ships_ship_idx').on(table.shipId, table.momentId) }));

export const momentReports = pgTable('moment_reports', {
	id: uuid('id').defaultRandom().primaryKey(), reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	momentId: uuid('moment_id').references(() => moments.id, { onDelete: 'cascade' }), commentId: uuid('comment_id').references(() => momentComments.id, { onDelete: 'cascade' }),
	reason: momentReportReasonEnum('reason').notNull(), details: text('details'), status: momentReportStatusEnum('status').notNull().default('PENDING'),
	reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }), reviewedAt: timestamp('reviewed_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	pendingIndex: index('moment_reports_pending_idx').on(table.status, table.createdAt),
	targetExactlyOne: check('moment_reports_target_check', sql`(${table.momentId} IS NOT NULL)::int + (${table.commentId} IS NOT NULL)::int = 1`),
	reporterMomentUnique: uniqueIndex('moment_reports_reporter_moment_unique').on(table.reporterId, table.momentId).where(sql`${table.momentId} IS NOT NULL`),
	reporterCommentUnique: uniqueIndex('moment_reports_reporter_comment_unique').on(table.reporterId, table.commentId).where(sql`${table.commentId} IS NOT NULL`)
}));

export const momentModerationActions = pgTable('moment_moderation_actions', {
	id: uuid('id').defaultRandom().primaryKey(), momentId: uuid('moment_id').notNull().references(() => moments.id, { onDelete: 'cascade' }),
	actorUserId: uuid('actor_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), action: varchar('action', { length: 20 }).notNull(), reason: text('reason'), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({ momentIndex: index('moment_moderation_actions_moment_idx').on(table.momentId, table.createdAt) }));

export const rateLimitWindows = pgTable('rate_limit_windows', {
	key: varchar('key', { length: 255 }).primaryKey(), windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull(), requestCount: integer('request_count').notNull().default(0), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({ requestCountNonNegative: check('rate_limit_windows_request_count_non_negative', sql`${table.requestCount} >= 0`) }));

export const notifications = pgTable('notifications', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	seriesId: uuid('series_id').references(() => series.id, { onDelete: 'cascade' }),
	actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
	momentId: uuid('moment_id').references(() => moments.id, { onDelete: 'cascade' }),
	commentId: uuid('comment_id').references(() => momentComments.id, { onDelete: 'cascade' }),
	metadata: jsonb('metadata').$type<Record<string, unknown>>(),
	type: varchar('type', { length: 50 }).notNull(),
	message: text('message').notNull(),
	isRead: boolean('is_read').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const pushSubscriptions = pgTable('push_subscriptions', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	endpoint: text('endpoint').notNull().unique(),
	p256dh: text('p256dh').notNull(),
	auth: text('auth').notNull(),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const chatConversations = pgTable('chat_conversations', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 120 }).notNull().default('New chat'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const chatMessages = pgTable('chat_messages', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	question: text('question').notNull(),
	reply: text('reply').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const chatConversationMessages = pgTable('chat_conversation_messages', {
	id: uuid('id').defaultRandom().primaryKey(),
	conversationId: uuid('conversation_id').notNull().references(() => chatConversations.id, { onDelete: 'cascade' }),
	role: varchar('role', { length: 20 }).notNull(),
	content: text('content').notNull(),
	context: jsonb('context'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
