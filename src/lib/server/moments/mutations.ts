import { randomUUID } from 'node:crypto';
import { getDb } from '../db/index.js';

type CreateMomentInput = {
	authorId: string;
	body?: string | null;
	sourceUrl: string | null;
	sourceCanonicalUrl: string | null;
	provider: 'YOUTUBE' | 'TIKTOK' | 'X' | 'OTHER';
	externalId?: string;
	embedStatus?: 'READY' | 'FALLBACK' | 'FAILED';
	embedMetadata?: Record<string, unknown>;
	imageUrls: string[];
	pendingMediaCount: number;
	seriesIds?: string[];
	artistIds?: string[];
	shipIds?: string[];
};

export async function createMoment(input: CreateMomentInput): Promise<{ id: string }> {
	const db = await getDb();
	const sql = db.$client;
	const id = randomUUID();
	const status = input.pendingMediaCount > 0 ? 'UPLOADING' : 'PUBLISHED';
	const statements = [sql`INSERT INTO moments (id, author_id, body, source_url, source_canonical_url, source_provider, source_external_id, embed_status, embed_metadata, status, pending_media_count) VALUES (${id}, ${input.authorId}, ${input.body ?? null}, ${input.sourceUrl}, ${input.sourceCanonicalUrl}, ${input.provider}, ${input.externalId ?? null}, ${input.embedStatus ?? 'FALLBACK'}, ${JSON.stringify(input.embedMetadata ?? {})}::jsonb, ${status}, ${input.pendingMediaCount})`];
	for (const [sortOrder, externalUrl] of input.imageUrls.entries()) {
		statements.push(sql`INSERT INTO moment_media (id, moment_id, external_url, sort_order) VALUES (${randomUUID()}, ${id}, ${externalUrl}, ${sortOrder})`);
	}
	for (const seriesId of input.seriesIds ?? []) statements.push(sql`INSERT INTO moment_series (moment_id, series_id) VALUES (${id}, ${seriesId})`);
	for (const artistId of input.artistIds ?? []) statements.push(sql`INSERT INTO moment_artists (moment_id, artist_id) VALUES (${id}, ${artistId})`);
	for (const shipId of input.shipIds ?? []) statements.push(sql`INSERT INTO moment_ships (moment_id, ship_id) VALUES (${id}, ${shipId})`);
	await sql.transaction(statements);
	return { id };
}

export type MomentMediaUploadAccess = 'OK' | 'FORBIDDEN' | 'FULL' | 'INVALID_STATE';

function resultRows<T>(result: unknown): T[] {
	if (Array.isArray(result)) return result as T[];
	if (result && typeof result === 'object' && 'rows' in result && Array.isArray(result.rows)) return result.rows as T[];
	return [];
}

export async function getMomentMediaUploadAccess(momentId: string, authorId: string): Promise<MomentMediaUploadAccess> {
	const db = await getDb(); const sql = db.$client;
	const result = await sql`SELECT m.author_id, m.status, m.pending_media_count, count(mm.id)::integer AS media_count FROM moments m LEFT JOIN moment_media mm ON mm.moment_id = m.id WHERE m.id = ${momentId} GROUP BY m.id`;
	const [moment] = resultRows<{ author_id: string; status: string; media_count: number; pending_media_count: number }>(result);
	if (!moment || moment.author_id !== authorId) return 'FORBIDDEN';
	if (moment.status !== 'UPLOADING' && !(moment.status === 'PUBLISHED' && Number(moment.pending_media_count) === 0)) return 'INVALID_STATE';
	return Number(moment.media_count) >= 4 ? 'FULL' : 'OK';
}

export async function appendMomentMedia(input: { momentId: string; authorId: string; key: string; url: string }): Promise<boolean> {
	const db = await getDb(); const sql = db.$client;
	const result = await sql.transaction([
		sql`SELECT id FROM moments WHERE id = ${input.momentId} AND author_id = ${input.authorId} AND (status = 'UPLOADING' OR (status = 'PUBLISHED' AND pending_media_count = 0)) FOR UPDATE`,
		sql`
			WITH counts AS (
				SELECT m.id,
					(SELECT count(*)::integer FROM moment_media WHERE moment_id = m.id) AS media_count,
					(SELECT count(*)::integer FROM moment_media WHERE moment_id = m.id AND source_type = 'UPLOAD') AS upload_count
				FROM moments m
				WHERE m.id = ${input.momentId} AND m.author_id = ${input.authorId}
					AND (m.status = 'UPLOADING' OR (m.status = 'PUBLISHED' AND m.pending_media_count = 0))
			)
			INSERT INTO moment_media (id, moment_id, source_type, storage_key, external_url, sort_order)
			SELECT ${randomUUID()}, c.id, 'UPLOAD', ${input.key}, ${input.url}, c.media_count
			FROM counts c JOIN moments m ON m.id = c.id
			WHERE c.media_count < 4 AND (m.status <> 'UPLOADING' OR c.upload_count < m.pending_media_count)
			ON CONFLICT (moment_id, sort_order) DO NOTHING
			RETURNING moment_id
		`,
		sql`
			UPDATE moments m SET status = 'PUBLISHED', updated_at = now()
			WHERE m.id = ${input.momentId} AND m.author_id = ${input.authorId} AND m.status = 'UPLOADING'
				AND (SELECT count(*) FROM moment_media WHERE moment_id = m.id AND source_type = 'UPLOAD') = m.pending_media_count
			RETURNING m.id
		`
	]);
	return resultRows<{ moment_id: string }>(result[1]).length > 0;
}

export async function updateMoment(id: string, authorId: string, input: Pick<CreateMomentInput, 'body' | 'sourceUrl' | 'sourceCanonicalUrl' | 'provider' | 'externalId' | 'embedStatus' | 'embedMetadata' | 'seriesIds' | 'artistIds' | 'shipIds'> & { mediaIds: string[]; stagedMedia: Array<{ key: string; url: string; token: string }> }): Promise<boolean> {
	const db = await getDb(); const sql = db.$client;
	if (input.mediaIds.length + input.stagedMedia.length > 4 || new Set(input.mediaIds).size !== input.mediaIds.length) return false;
	const owned = sql`EXISTS (SELECT 1 FROM moments WHERE id = ${id} AND author_id = ${authorId} AND status = 'PUBLISHED')`;
	const statements = [sql`UPDATE moments SET body = ${input.body ?? null}, source_url = ${input.sourceUrl}, source_canonical_url = ${input.sourceCanonicalUrl}, source_provider = ${input.provider}, source_external_id = ${input.externalId ?? null}, embed_status = ${input.embedStatus ?? 'FALLBACK'}, embed_metadata = ${JSON.stringify(input.embedMetadata ?? {})}::jsonb, updated_at = now() WHERE id = ${id} AND author_id = ${authorId} AND status = 'PUBLISHED' RETURNING id`, sql`DELETE FROM moment_media WHERE moment_id = ${id} AND ${owned} AND id <> ALL(${input.mediaIds})`, sql`UPDATE moment_media SET sort_order = sort_order + 100 WHERE moment_id = ${id} AND ${owned} AND id = ANY(${input.mediaIds})`, sql`UPDATE moment_media SET sort_order = ordered.sort_order FROM unnest(${input.mediaIds}::uuid[]) WITH ORDINALITY AS ordered(id, sort_order) WHERE moment_media.moment_id = ${id} AND moment_media.id = ordered.id AND ${owned}`, sql`DELETE FROM moment_series WHERE moment_id = ${id} AND ${owned}`, sql`DELETE FROM moment_artists WHERE moment_id = ${id} AND ${owned}`, sql`DELETE FROM moment_ships WHERE moment_id = ${id} AND ${owned}`];
	for (const [index, media] of input.stagedMedia.entries()) statements.push(sql`INSERT INTO moment_media (id, moment_id, source_type, storage_key, external_url, sort_order) SELECT ${randomUUID()}, ${id}, 'UPLOAD', ${media.key}, ${media.url}, ${input.mediaIds.length + index} WHERE ${owned}`);
	for (const seriesId of input.seriesIds ?? []) statements.push(sql`INSERT INTO moment_series (moment_id, series_id) SELECT ${id}, ${seriesId} WHERE ${owned}`);
	for (const artistId of input.artistIds ?? []) statements.push(sql`INSERT INTO moment_artists (moment_id, artist_id) SELECT ${id}, ${artistId} WHERE ${owned}`);
	for (const shipId of input.shipIds ?? []) statements.push(sql`INSERT INTO moment_ships (moment_id, ship_id) SELECT ${id}, ${shipId} WHERE ${owned}`);
	const result = await sql.transaction(statements); return resultRows<{ id: string }>(result[0]).length > 0;
}

export async function deleteMoment(id: string, actorId: string): Promise<boolean> {
	const db = await getDb(); const sql = db.$client;
	const result = await sql.transaction([sql`UPDATE moments SET status = 'DELETED', deleted_at = now(), updated_at = now() WHERE id = ${id} AND author_id = ${actorId} AND status = 'PUBLISHED' RETURNING id`]);
	return resultRows<{ id: string }>(result[0]).length > 0;
}

export async function setMomentLike(momentId: string, userId: string, liked: boolean): Promise<void> {
	const db = await getDb(); const sql = db.$client;
	const statements = liked
		? [sql`WITH inserted AS (INSERT INTO moment_likes (moment_id, user_id) VALUES (${momentId}, ${userId}) ON CONFLICT DO NOTHING RETURNING moment_id) INSERT INTO notifications (user_id, actor_user_id, moment_id, type, message, metadata) SELECT m.author_id, ${userId}, m.id, 'moment_like', 'New reaction to your Moment', jsonb_build_object('targetUrl', '/halo/moments/' || m.id) FROM moments m JOIN inserted ON inserted.moment_id = m.id WHERE m.author_id <> ${userId}`, sql`UPDATE moments SET like_count = (SELECT count(*) FROM moment_likes WHERE moment_id = ${momentId}) WHERE id = ${momentId}`]
		: [sql`DELETE FROM moment_likes WHERE moment_id = ${momentId} AND user_id = ${userId}`, sql`UPDATE moments SET like_count = (SELECT count(*) FROM moment_likes WHERE moment_id = ${momentId}) WHERE id = ${momentId}`];
	await sql.transaction(statements);
}

export async function setMomentBookmark(momentId: string, userId: string, bookmarked: boolean): Promise<void> {
	const db = await getDb(); const sql = db.$client;
	await sql.transaction([bookmarked ? sql`INSERT INTO moment_bookmarks (moment_id, user_id) VALUES (${momentId}, ${userId}) ON CONFLICT DO NOTHING` : sql`DELETE FROM moment_bookmarks WHERE moment_id = ${momentId} AND user_id = ${userId}`]);
}

export async function createMomentComment(momentId: string, authorId: string, body: string, parentId?: string): Promise<{ id: string }> {
	const db = await getDb(); const sql = db.$client; const id = randomUUID();
	await sql.transaction([sql`INSERT INTO moment_comments (id, moment_id, author_id, parent_id, body) SELECT ${id}, ${momentId}, ${authorId}, ${parentId ?? null}, ${body} WHERE ${parentId ?? null} IS NULL OR EXISTS (SELECT 1 FROM moment_comments WHERE id = ${parentId ?? null} AND moment_id = ${momentId} AND parent_id IS NULL)`, sql`INSERT INTO notifications (user_id, actor_user_id, moment_id, comment_id, type, message, metadata) SELECT m.author_id, ${authorId}, m.id, ${id}, 'moment_comment', 'New comment on your Moment', jsonb_build_object('targetUrl', '/halo/moments/' || m.id) FROM moments m WHERE m.id = ${momentId} AND m.author_id <> ${authorId} AND EXISTS (SELECT 1 FROM moment_comments WHERE id = ${id})`, sql`UPDATE moments SET comment_count = (SELECT count(*) FROM moment_comments WHERE moment_id = ${momentId} AND status = 'PUBLISHED') WHERE id = ${momentId}`]);
	return { id };
}

export async function deleteMomentComment(id: string, actorId: string, isAdmin = false): Promise<void> {
	const db = await getDb(); const sql = db.$client;
	await sql.transaction([sql`UPDATE moment_comments SET status = 'DELETED', deleted_at = now(), updated_at = now() WHERE id = ${id} AND (${isAdmin} OR author_id = ${actorId}) AND status <> 'DELETED'`, sql`UPDATE moments SET comment_count = (SELECT count(*) FROM moment_comments WHERE moment_id = (SELECT moment_id FROM moment_comments WHERE id = ${id}) AND status = 'PUBLISHED') WHERE id = (SELECT moment_id FROM moment_comments WHERE id = ${id})`]);
}

export async function reportMoment(momentId: string, reporterId: string, reason: string, details?: string): Promise<void> {
	const db = await getDb(); const sql = db.$client;
	await sql.transaction([sql`INSERT INTO moment_reports (id, reporter_id, moment_id, reason, details) VALUES (${randomUUID()}, ${reporterId}, ${momentId}, ${reason}, ${details ?? null}) ON CONFLICT DO NOTHING`]);
}
