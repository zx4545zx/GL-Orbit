import { eq, and, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import {
	artists,
	artistSocials,
	seriesArtists,
	series,
	studios
} from '$lib/server/db/schema.js';
import { getCached, setCached } from '$lib/server/cache.js';

const CACHE_TTL = 30_000;

export type ArtistDetail = {
	id: string;
	nickname: string;
	fullName: string;
	profileImageUrl: string;
	socials: { platform: string; url: string; iconUrl: string | null }[];
	series: {
		id: string;
		titleEn: string;
		titleTh: string;
		posterUrl: string;
		roleName: string;
		status: 'UPCOMING' | 'ONGOING' | 'ENDED';
		studio: string | null;
	}[];
};

const FALLBACK_AVATAR =
	'/placeholders/avatar.svg';
const FALLBACK_POSTER =
	'/placeholders/poster.svg';

export async function getArtistDetail(id: string): Promise<ArtistDetail | null> {
	const cacheKey = `query:artist:${id}`;
	const cached = getCached<ArtistDetail>(cacheKey, CACHE_TTL);
	if (cached) {
		return cached;
	}

	const db = await getDb();

	// Artist profile + socials + works are independent queries — run them in parallel.
	const artistPromise = (async () => {
		const [r] = await db
			.select({
				id: artists.id,
				nickname: artists.nickname,
				fullName: artists.fullName,
				profileImageUrl: artists.profileImageUrl
			})
			.from(artists)
			.where(and(eq(artists.id, id), isNull(artists.deletedAt)));
		return r;
	})();

	const socialsPromise = db
		.select({
			platform: artistSocials.platform,
			url: artistSocials.url,
			iconUrl: artistSocials.iconUrl
		})
		.from(artistSocials)
		.where(eq(artistSocials.artistId, id));

	const seriesPromise = db
		.select({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			posterUrl: series.posterUrl,
			roleName: seriesArtists.roleName,
			status: series.status,
			studioName: studios.name
		})
		.from(seriesArtists)
		.innerJoin(series, eq(seriesArtists.seriesId, series.id))
		.leftJoin(studios, eq(series.studioId, studios.id))
		.where(and(eq(seriesArtists.artistId, id), isNull(series.deletedAt)));

	const [artistResult, socialsResult, seriesResult] = await Promise.all([
		artistPromise,
		socialsPromise,
		seriesPromise
	]);

	if (!artistResult) {
		return null;
	}

	const result: ArtistDetail = {
		id: artistResult.id,
		nickname: artistResult.nickname,
		fullName: artistResult.fullName ?? '',
		profileImageUrl: artistResult.profileImageUrl ?? FALLBACK_AVATAR,
		socials: socialsResult.map((s) => ({
			platform: s.platform,
			url: s.url,
			iconUrl: s.iconUrl ?? null
		})),
		series: seriesResult.map((s) => ({
			id: s.id,
			titleEn: s.titleEn,
			titleTh: s.titleTh ?? '',
			posterUrl: s.posterUrl ?? FALLBACK_POSTER,
			roleName: s.roleName ?? 'นักแสดง',
			status: s.status,
			studio: s.studioName ?? null
		}))
	};

	setCached(cacheKey, result, CACHE_TTL);
	return result;
}
