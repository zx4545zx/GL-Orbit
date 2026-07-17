import { eq, and, isNull, or, count, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb } from '$lib/server/db/index.js';
import {
	artists,
	artistSocials,
	seriesArtists,
	series,
	studios,
	ships,
	shipSeries
} from '$lib/server/db/schema.js';
import { getCached, setCached } from '$lib/server/cache.js';

const CACHE_TTL = 30_000;

export type ArtistDetail = {
	id: string;
	nickname: string;
	fullNameTh: string | null;
	fullNameEn: string;
	profileImageUrl: string;
	socials: { id: string; platform: string; url: string; iconUrl: string | null }[];
	series: {
		id: string;
		titleEn: string;
		titleTh: string;
		posterUrl: string;
		roleName: string;
		status: 'UPCOMING' | 'ONGOING' | 'ENDED';
		studio: string | null;
	}[];
	ships: {
		id: string;
		slug: string;
		name: string;
		imageUrl: string | null;
		description: string | null;
		partner: { id: string; nickname: string; imageUrl: string };
		seriesCount: number;
		hashtags: string[];
	}[];
};

const FALLBACK_AVATAR = '/placeholders/avatar.svg';
const FALLBACK_POSTER = '/placeholders/poster.svg';

export async function getArtistDetail(id: string): Promise<ArtistDetail | null> {
	const cacheKey = `query:artist:${id}`;
	const cached = getCached<ArtistDetail>(cacheKey, CACHE_TTL);
	if (cached) {
		return cached;
	}

	const db = await getDb();

	// Artist profile + socials + works + ships are independent queries — run them in parallel.
	const artistPromise = (async () => {
		const [r] = await db
			.select({
				id: artists.id,
				nickname: artists.nickname,
				fullNameTh: artists.fullNameTh,
				fullNameEn: artists.fullNameEn,
				profileImageUrl: artists.profileImageUrl
			})
			.from(artists)
			.where(and(eq(artists.id, id), isNull(artists.deletedAt)));
		return r;
	})();

	const socialsPromise = db
		.select({
			id: artistSocials.id,
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

	const shipsPromise = (async () => {
		const artist1 = alias(artists, 'artist_detail_ship_artist_1');
		const artist2 = alias(artists, 'artist_detail_ship_artist_2');
		const rows = await db
			.select({
				id: ships.id,
				slug: ships.slug,
				name: ships.name,
				imageUrl: ships.imageUrl,
				description: ships.description,
				artist1Id: ships.artist1Id,
				artist2Id: ships.artist2Id,
				artist1Nickname: artist1.nickname,
				artist1ProfileImageUrl: artist1.profileImageUrl,
				artist2Nickname: artist2.nickname,
				artist2ProfileImageUrl: artist2.profileImageUrl,
				hashtags: ships.hashtags
			})
			.from(ships)
			.innerJoin(artist1, eq(ships.artist1Id, artist1.id))
			.innerJoin(artist2, eq(ships.artist2Id, artist2.id))
			.where(and(or(eq(ships.artist1Id, id), eq(ships.artist2Id, id)), eq(ships.isPublished, true)));

		if (rows.length === 0) return [];

		const shipIds = rows.map((r) => r.id);
		const counts = await db
			.select({ shipId: shipSeries.shipId, count: count() })
			.from(shipSeries)
			.where(inArray(shipSeries.shipId, shipIds))
			.groupBy(shipSeries.shipId);
		const countMap = new Map(counts.map((c) => [c.shipId, Number(c.count)]));

		return rows.map((r) => {
			const isArtist1 = r.artist1Id === id;
			return {
				id: r.id,
				slug: r.slug,
				name: r.name,
				imageUrl: r.imageUrl,
				description: r.description,
				partner: {
					id: isArtist1 ? r.artist2Id : r.artist1Id,
					nickname: (isArtist1 ? r.artist2Nickname : r.artist1Nickname) ?? '',
					imageUrl: (isArtist1 ? r.artist2ProfileImageUrl : r.artist1ProfileImageUrl) ?? FALLBACK_AVATAR
				},
				seriesCount: countMap.get(r.id) ?? 0,
				hashtags: r.hashtags ?? []
			};
		});
	})();

	const [artistResult, socialsResult, seriesResult, shipsResult] = await Promise.all([
		artistPromise,
		socialsPromise,
		seriesPromise,
		shipsPromise
	]);

	if (!artistResult) {
		return null;
	}

	const result: ArtistDetail = {
		id: artistResult.id,
		nickname: artistResult.nickname,
		fullNameTh: artistResult.fullNameTh ?? null,
		fullNameEn: artistResult.fullNameEn,
		profileImageUrl: artistResult.profileImageUrl ?? FALLBACK_AVATAR,
		socials: socialsResult.map((s) => ({
			id: s.id,
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
		})),
		ships: shipsResult
	};

	setCached(cacheKey, result, CACHE_TTL);
	return result;
}