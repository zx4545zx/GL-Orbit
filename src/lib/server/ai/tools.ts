import { and, asc, desc, eq, gte, ilike, inArray, isNull } from 'drizzle-orm';
import { tool } from 'ai';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index.js';
import { artists, episodeSchedules, episodes, news, series, seriesArtists, studios } from '$lib/server/db/schema.js';
import { getSeriesList } from '$lib/server/series/listing.js';
import { getArtistList } from '$lib/server/queries/artist-list.js';
import { getLatestNews } from '$lib/server/queries/whats-on.js';

const search = z.string().trim().min(1).max(100);
const id = z.string().uuid();
const limit = z.number().int().min(1).max(10).default(5);
const publicSeries = (row: { id: string; titleEn: string; titleTh: string | null; posterUrl: string | null; status: 'UPCOMING' | 'ONGOING' | 'ENDED' }) => ({ id: row.id, titleEn: row.titleEn, titleTh: row.titleTh, posterUrl: row.posterUrl, status: row.status });

export const catalogTools = {
	search_series: tool({ description: 'Search the GL-Orbit series catalog. Use before answering factual series questions.', inputSchema: z.object({ query: search, limit }), execute: async ({ query, limit }) => {
		const result = await getSeriesList({ search: query, status: 'ALL' }, 1);
		return result.items.slice(0, limit).map((item) => ({ id: item.id, titleEn: item.title, titleTh: item.subtitle || null, posterUrl: item.poster, status: item.status, studio: item.studio, genres: item.genres.map((genre) => genre.name) }));
	} }),
	get_series: tool({ description: 'Get public details for one series by its ID.', inputSchema: z.object({ id }), execute: async ({ id }) => {
		const db = await getDb();
		const [row] = await db.select({ id: series.id, titleEn: series.titleEn, titleTh: series.titleTh, descriptionEn: series.descriptionEn, descriptionTh: series.descriptionTh, posterUrl: series.posterUrl, status: series.status, studio: studios.name }).from(series).leftJoin(studios, eq(series.studioId, studios.id)).where(and(eq(series.id, id), isNull(series.deletedAt))).limit(1);
		return row ? { ...publicSeries(row), descriptionEn: row.descriptionEn, descriptionTh: row.descriptionTh, studio: row.studio } : null;
	} }),
	search_actors: tool({ description: 'Search public artist profiles in GL-Orbit.', inputSchema: z.object({ query: search, limit }), execute: async ({ query, limit }) => {
		const result = await getArtistList({ search: query }, 1);
		return result.items.slice(0, limit).map(({ id, nickname, fullNameTh, fullNameEn, profileImageUrl }) => ({ id, nickname, fullNameTh, fullNameEn, profileImageUrl }));
	} }),
	get_actor: tool({ description: 'Get a public artist profile and related series.', inputSchema: z.object({ id }), execute: async ({ id }) => {
		const db = await getDb();
		const [actor] = await db.select({ id: artists.id, nickname: artists.nickname, fullNameTh: artists.fullNameTh, fullNameEn: artists.fullNameEn, profileImageUrl: artists.profileImageUrl }).from(artists).where(and(eq(artists.id, id), isNull(artists.deletedAt))).limit(1);
		if (!actor) return null;
		const credits = await db.select({ id: series.id, titleEn: series.titleEn, titleTh: series.titleTh, posterUrl: series.posterUrl, status: series.status }).from(seriesArtists).innerJoin(series, eq(seriesArtists.seriesId, series.id)).where(and(eq(seriesArtists.artistId, id), isNull(series.deletedAt))).orderBy(asc(series.titleEn)).limit(10);
		return { ...actor, series: credits.map(publicSeries) };
	} }),
	get_episode_schedule: tool({ description: 'Get public upcoming episode schedule. Supply series ID when known.', inputSchema: z.object({ seriesId: id.optional(), from: z.string().datetime().optional(), limit }), execute: async ({ seriesId, from, limit }) => {
		const db = await getDb(); const start = from ? new Date(from) : new Date();
		const conditions = [isNull(episodeSchedules.deletedAt), isNull(episodes.deletedAt), isNull(series.deletedAt), gte(episodeSchedules.airDate, start)];
		if (seriesId) conditions.push(eq(series.id, seriesId));
		return db.select({ seriesId: series.id, seriesTitleEn: series.titleEn, seriesTitleTh: series.titleTh, episodeNumber: episodes.episodeNumber, episodeTitle: episodes.title, airDate: episodeSchedules.airDate, streamLink: episodeSchedules.streamLink, isUncut: episodeSchedules.isUncut }).from(episodeSchedules).innerJoin(episodes, eq(episodeSchedules.episodeId, episodes.id)).innerJoin(series, eq(episodes.seriesId, series.id)).where(and(...conditions)).orderBy(asc(episodeSchedules.airDate)).limit(limit).then((rows) => rows.map((row) => ({ ...row, airDate: row.airDate.toISOString() })));
	} }),
	search_news: tool({ description: 'Search published GL-Orbit news only. Never use web search.', inputSchema: z.object({ query: search.optional(), limit }), execute: async ({ query, limit }) => {
		if (!query) return getLatestNews('en', limit);
		const db = await getDb(); const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
		const rows = await db.select({ id: news.id, slug: news.slug, titleEn: news.titleEn, titleTh: news.titleTh, sourceUrl: news.sourceUrl, publishedAt: news.publishedAt }).from(news).where(and(eq(news.status, 'PUBLISHED'), isNull(news.deletedAt), ilike(news.titleEn, pattern))).orderBy(desc(news.publishedAt)).limit(limit);
		return rows.map((row) => ({ ...row, publishedAt: row.publishedAt?.toISOString() ?? null }));
	} })
};
