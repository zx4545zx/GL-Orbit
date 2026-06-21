import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { artists, artistSocials, seriesArtists, series } from '$lib/server/db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import { getCached, setCached } from '$lib/server/cache.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params }) => {
	const cacheKey = `api:artist:${params.id}`;
	const cached = getCached(cacheKey, 30_000);
	if (cached) {
		return json(cached);
	}

	const db = await getDb();

	const [artistResult] = await db
		.select({
			id: artists.id,
			nickname: artists.nickname,
			fullName: artists.fullName,
			profileImageUrl: artists.profileImageUrl
		})
		.from(artists)
		.where(and(eq(artists.id, params.id), isNull(artists.deletedAt)));

	if (!artistResult) {
		error(404, 'ไม่พบข้อมูลศิลปิน');
	}

	const socialsResult = await db
		.select({
			platform: artistSocials.platform,
			url: artistSocials.url,
			iconUrl: artistSocials.iconUrl
		})
		.from(artistSocials)
		.where(eq(artistSocials.artistId, params.id));

	const seriesResult = await db
		.select({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			posterUrl: series.posterUrl,
			roleName: seriesArtists.roleName
		})
		.from(seriesArtists)
		.innerJoin(series, eq(seriesArtists.seriesId, series.id))
		.where(and(
			eq(seriesArtists.artistId, params.id),
			isNull(series.deletedAt)
		));

	const result = {
		artist: {
			id: artistResult.id,
			nickname: artistResult.nickname,
			fullName: artistResult.fullName ?? '',
			profileImageUrl: artistResult.profileImageUrl ?? '/placeholders/avatar.svg'
		},
		socials: socialsResult.map((s) => ({
			platform: s.platform,
			url: s.url,
			iconUrl: s.iconUrl ?? null
		})),
		series: seriesResult.map((s) => ({
			id: s.id,
			titleEn: s.titleEn,
			titleTh: s.titleTh ?? '',
			posterUrl: s.posterUrl ?? '/placeholders/poster.svg',
			roleName: s.roleName ?? 'นักแสดง'
		}))
	};

	setCached(cacheKey, result, 30_000);
	return json(result);
};
