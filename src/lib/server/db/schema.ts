import { pgTable, uuid, varchar, text, timestamp, boolean, integer, time, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'USER']);
export const seriesStatusEnum = pgEnum('series_status', ['UPCOMING', 'ONGOING', 'ENDED']);

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: varchar('username', { length: 255 }).notNull().unique(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	displayName: varchar('display_name', { length: 255 }),
	avatarUrl: text('avatar_url'),
	coverUrl: text('cover_url'),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	role: userRoleEnum('role').notNull().default('USER'),
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
	posterUrl: text('poster_url'),
	status: seriesStatusEnum('status').notNull().default('UPCOMING'),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const seriesArtists = pgTable('series_artists', {
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	artistId: uuid('artist_id').notNull().references(() => artists.id, { onDelete: 'cascade' }),
	roleName: varchar('role_name', { length: 255 })
}, (table) => ({
	pk: { columns: [table.seriesId, table.artistId] }
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

export const notifications = pgTable('notifications', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	type: varchar('type', { length: 50 }).notNull(),
	message: text('message').notNull(),
	isRead: boolean('is_read').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
