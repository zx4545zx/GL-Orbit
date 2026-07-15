import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { artists, momentArtists, momentBookmarks, momentLikes, momentMedia, momentSeries, momentShips, moments, series, ships, users } from '../db/schema.js';
import { getCached, setCached } from '../cache.js';
import { encodeCursor } from './cursor.js';
import { serializeMomentAuthor } from './serializers.js';

export type MomentFilter = { id?: string; limit?: number; cursor?: { createdAt: string; id: string } | null; seriesId?: string | null; artistId?: string | null; shipId?: string | null; authorId?: string | null; bookmarked?: boolean; viewerId?: string };

export type MomentSeriesOption = { id: string; label: string };

export async function getMomentSeriesOptions(lang: string): Promise<MomentSeriesOption[]> {
	const db = await getDb();
	const rows = await db
		.select({ id: series.id, titleTh: series.titleTh, titleEn: series.titleEn })
		.from(series)
		.where(isNull(series.deletedAt));
	return rows
		.map((row) => ({ id: row.id, label: (lang === 'th' ? row.titleTh || row.titleEn : row.titleEn || row.titleTh || '').trim() }))
		.filter((row) => row.label.length > 0)
		.sort((a, b) => a.label.localeCompare(b.label, lang === 'th' ? 'th' : 'en'));
}

export async function getMoments(filter: MomentFilter = {}) {
	const db = await getDb(); const limit = Math.min(50, Math.max(1, filter.limit ?? 20));
	if (filter.bookmarked && !filter.viewerId) return { moments: [], nextCursor: null };
	const clauses = [eq(moments.status, 'PUBLISHED')];
	if (filter.id) clauses.push(eq(moments.id, filter.id));
	if (filter.authorId) clauses.push(eq(moments.authorId, filter.authorId));
	if (filter.cursor) clauses.push(sql`(${moments.createdAt}, ${moments.id}) < (${filter.cursor.createdAt}::timestamptz, ${filter.cursor.id}::uuid)`);
	if (filter.seriesId) clauses.push(sql`exists (select 1 from moment_series ms where ms.moment_id = ${moments.id} and ms.series_id = ${filter.seriesId})`);
	if (filter.artistId) clauses.push(sql`exists (select 1 from moment_artists ma where ma.moment_id = ${moments.id} and ma.artist_id = ${filter.artistId})`);
	if (filter.shipId) clauses.push(sql`exists (select 1 from moment_ships mh where mh.moment_id = ${moments.id} and mh.ship_id = ${filter.shipId})`);
	if (filter.bookmarked && filter.viewerId) clauses.push(sql`exists (select 1 from moment_bookmarks mb where mb.moment_id = ${moments.id} and mb.user_id = ${filter.viewerId})`);
	const rows = await db.select({ id: moments.id, authorId: moments.authorId, body: moments.body, sourceUrl: moments.sourceUrl, sourceCanonicalUrl: moments.sourceCanonicalUrl, sourceProvider: moments.sourceProvider, sourceExternalId: moments.sourceExternalId, embedStatus: moments.embedStatus, embedMetadata: moments.embedMetadata, likeCount: moments.likeCount, commentCount: moments.commentCount, createdAt: moments.createdAt, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl }).from(moments).innerJoin(users, eq(moments.authorId, users.id)).where(and(...clauses)).orderBy(desc(moments.createdAt), desc(moments.id)).limit(limit + 1);
	const page = rows.slice(0, limit); const ids = page.map((row) => row.id);
	const [media, seriesTags, artistTags, shipTags, likedRows, bookmarkedRows] = ids.length ? await Promise.all([
		db.select({ id: momentMedia.id, momentId: momentMedia.momentId, externalUrl: momentMedia.externalUrl, storageKey: momentMedia.storageKey, sourceType: momentMedia.sourceType, altText: momentMedia.altText, sortOrder: momentMedia.sortOrder }).from(momentMedia).where(inArray(momentMedia.momentId, ids)).orderBy(momentMedia.sortOrder),
		db.select({ momentId: momentSeries.momentId, id: series.id, label: series.titleEn }).from(momentSeries).innerJoin(series, eq(momentSeries.seriesId, series.id)).where(and(inArray(momentSeries.momentId, ids), isNull(series.deletedAt))),
		db.select({ momentId: momentArtists.momentId, id: artists.id, label: artists.nickname }).from(momentArtists).innerJoin(artists, eq(momentArtists.artistId, artists.id)).where(and(inArray(momentArtists.momentId, ids), isNull(artists.deletedAt))),
		db.select({ momentId: momentShips.momentId, id: ships.id, label: ships.name }).from(momentShips).innerJoin(ships, eq(momentShips.shipId, ships.id)).where(and(inArray(momentShips.momentId, ids), eq(ships.isPublished, true))),
		filter.viewerId ? db.select({ momentId: momentLikes.momentId }).from(momentLikes).where(and(eq(momentLikes.userId, filter.viewerId), inArray(momentLikes.momentId, ids))) : Promise.resolve([]),
		filter.viewerId ? db.select({ momentId: momentBookmarks.momentId }).from(momentBookmarks).where(and(eq(momentBookmarks.userId, filter.viewerId), inArray(momentBookmarks.momentId, ids))) : Promise.resolve([])
	]) : [[], [], [], [], [], []];
	const likedIds = new Set(likedRows.map(({ momentId }) => momentId));
	const bookmarkedIds = new Set(bookmarkedRows.map(({ momentId }) => momentId));
	return {
		moments: page.map((row) => ({
			...row,
			liked: likedIds.has(row.id),
			bookmarked: bookmarkedIds.has(row.id),
			author: serializeMomentAuthor(row),
			media: media.filter((item) => item.momentId === row.id),
			seriesIds: seriesTags.filter((item) => item.momentId === row.id).map((item) => item.id),
			artistIds: artistTags.filter((item) => item.momentId === row.id).map((item) => item.id),
			shipIds: shipTags.filter((item) => item.momentId === row.id).map((item) => item.id),
			entityTags: [
				...seriesTags.filter((item) => item.momentId === row.id).map((item) => ({ kind: 'series' as const, id: item.id, label: item.label })),
				...artistTags.filter((item) => item.momentId === row.id).map((item) => ({ kind: 'artist' as const, id: item.id, label: item.label })),
				...shipTags.filter((item) => item.momentId === row.id).map((item) => ({ kind: 'ship' as const, id: item.id, label: item.label }))
			]
		})),
		nextCursor: rows.length > limit ? encodeCursor({ createdAt: page.at(-1)!.createdAt.toISOString(), id: page.at(-1)!.id }) : null
	};
}

export async function getMoment(id: string, viewerId?: string) {
	const db = await getDb();
	const row = await db.select({ id: moments.id, authorId: moments.authorId, status: moments.status }).from(moments).where(eq(moments.id, id)).limit(1);
	if (!row[0] || (row[0].status !== 'PUBLISHED' && row[0].authorId !== viewerId)) return null;
	if (row[0].status !== 'PUBLISHED') return null;
	return (await getMoments({ id, limit: 1, viewerId })).moments[0] ?? null;
}

export async function getMomentComments(momentId: string, limit = 50) {
	const db = await getDb();
	return db.execute(sql`SELECT c.id, c.moment_id AS "momentId", c.author_id AS "authorId", c.parent_id AS "parentId", c.body, c.status, c.created_at AS "createdAt", u.username, u.display_name AS "displayName", u.avatar_url AS "avatarUrl" FROM moment_comments c JOIN users u ON u.id = c.author_id WHERE c.moment_id = ${momentId} AND c.status <> 'HIDDEN' ORDER BY c.created_at ASC, c.id ASC LIMIT ${Math.min(100, Math.max(1, limit))}`);
}

export async function getHaloProfile(username: string) {
	const db = await getDb();
	const [profile] = await db
		.select({ id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl, coverUrl: users.coverUrl })
		.from(users)
		.where(and(eq(users.username, username), eq(users.isActive, true), isNull(users.deletedAt)))
		.limit(1);
	if (!profile) return null;

	const [stats] = await db
		.select({
			momentCount: sql<number>`count(*)::int`,
			glowCount: sql<number>`coalesce(sum(${moments.likeCount}), 0)::int`
		})
		.from(moments)
		.where(and(eq(moments.authorId, profile.id), eq(moments.status, 'PUBLISHED')));

	return { ...profile, momentCount: stats?.momentCount ?? 0, glowCount: stats?.glowCount ?? 0 };
}

export type HaloDiscoveryItem = {
	kind: 'series' | 'artist' | 'ship';
	id: string;
	label: string;
	momentCount: number;
};

export async function getHaloDiscovery(limit = 4): Promise<HaloDiscoveryItem[]> {
	const db = await getDb();
	const safeLimit = Math.min(10, Math.max(1, limit));
	const cacheKey = `halo-discovery:${safeLimit}`;
	const cached = getCached<HaloDiscoveryItem[]>(cacheKey);
	if (cached) return cached;

	const [seriesRows, artistRows, shipRows] = await Promise.all([
		db.select({ id: series.id, label: series.titleEn, momentCount: sql<number>`count(distinct ${moments.id})::int` })
			.from(momentSeries)
			.innerJoin(moments, eq(momentSeries.momentId, moments.id))
			.innerJoin(series, eq(momentSeries.seriesId, series.id))
			.where(and(eq(moments.status, 'PUBLISHED'), isNull(series.deletedAt)))
			.groupBy(series.id, series.titleEn)
			.orderBy(desc(sql`count(distinct ${moments.id})`), asc(series.titleEn))
			.limit(safeLimit),
		db.select({ id: artists.id, label: artists.nickname, momentCount: sql<number>`count(distinct ${moments.id})::int` })
			.from(momentArtists)
			.innerJoin(moments, eq(momentArtists.momentId, moments.id))
			.innerJoin(artists, eq(momentArtists.artistId, artists.id))
			.where(and(eq(moments.status, 'PUBLISHED'), isNull(artists.deletedAt)))
			.groupBy(artists.id, artists.nickname)
			.orderBy(desc(sql`count(distinct ${moments.id})`), asc(artists.nickname))
			.limit(safeLimit),
		db.select({ id: ships.id, label: ships.name, momentCount: sql<number>`count(distinct ${moments.id})::int` })
			.from(momentShips)
			.innerJoin(moments, eq(momentShips.momentId, moments.id))
			.innerJoin(ships, eq(momentShips.shipId, ships.id))
			.where(and(eq(moments.status, 'PUBLISHED'), eq(ships.isPublished, true)))
			.groupBy(ships.id, ships.name)
			.orderBy(desc(sql`count(distinct ${moments.id})`), asc(ships.name))
			.limit(safeLimit)
	]);

	const result = [
		...seriesRows.map((item) => ({ ...item, kind: 'series' as const })),
		...artistRows.map((item) => ({ ...item, kind: 'artist' as const })),
		...shipRows.map((item) => ({ ...item, kind: 'ship' as const }))
	].sort((a, b) => b.momentCount - a.momentCount).slice(0, safeLimit);

	setCached(cacheKey, result, 30_000);
	return result;
}
