import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { momentArtists, momentBookmarks, momentMedia, momentSeries, momentShips, moments, users } from '../db/schema.js';
import { encodeCursor } from './cursor.js';
import { serializeMomentAuthor } from './serializers.js';

export type MomentFilter = { id?: string; limit?: number; cursor?: { createdAt: string; id: string } | null; seriesId?: string | null; artistId?: string | null; shipId?: string | null; authorId?: string | null; bookmarked?: boolean; viewerId?: string };

export async function getMoments(filter: MomentFilter = {}) {
	const db = await getDb(); const limit = Math.min(50, Math.max(1, filter.limit ?? 20));
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
	const [media, seriesTags, artistTags, shipTags] = ids.length ? await Promise.all([db.select().from(momentMedia).where(sql`${momentMedia.momentId} = any(${ids})`).orderBy(momentMedia.sortOrder), db.select().from(momentSeries).where(sql`${momentSeries.momentId} = any(${ids})`), db.select().from(momentArtists).where(sql`${momentArtists.momentId} = any(${ids})`), db.select().from(momentShips).where(sql`${momentShips.momentId} = any(${ids})`)]) : [[], [], [], []];
	return { moments: page.map((row) => ({ ...row, author: serializeMomentAuthor(row), media: media.filter((item) => item.momentId === row.id), seriesIds: seriesTags.filter((item) => item.momentId === row.id).map((item) => item.seriesId), artistIds: artistTags.filter((item) => item.momentId === row.id).map((item) => item.artistId), shipIds: shipTags.filter((item) => item.momentId === row.id).map((item) => item.shipId) })), nextCursor: rows.length > limit ? encodeCursor({ createdAt: page.at(-1)!.createdAt.toISOString(), id: page.at(-1)!.id }) : null };
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
