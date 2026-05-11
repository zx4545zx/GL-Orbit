import { getDb } from '$lib/server/db/index.js';
import { series, studios, artists, seriesArtists, episodes, episodeSchedules, platforms } from '$lib/server/db/schema.js';
import { eq, and, isNull, asc, inArray } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const db = await getDb();
	const [seriesResult] = await db
		.select({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			posterUrl: series.posterUrl,
			status: series.status,
			studioId: series.studioId,
			studioName: studios.name
		})
		.from(series)
		.leftJoin(studios, eq(series.studioId, studios.id))
		.where(and(eq(series.id, params.id), isNull(series.deletedAt)));

	if (!seriesResult) {
		error(404, 'ไม่พบซีรีส์นี้');
	}

	const artistsResult = await db
		.select({
			id: artists.id,
			nickname: artists.nickname,
			fullName: artists.fullName,
			profileImageUrl: artists.profileImageUrl,
			roleName: seriesArtists.roleName
		})
		.from(seriesArtists)
		.innerJoin(artists, eq(seriesArtists.artistId, artists.id))
		.where(eq(seriesArtists.seriesId, params.id));

	const episodesResult = await db
		.select({
			id: episodes.id,
			episodeNumber: episodes.episodeNumber,
			title: episodes.title,
			coverUrl: episodes.coverUrl
		})
		.from(episodes)
		.where(and(eq(episodes.seriesId, params.id), isNull(episodes.deletedAt)))
		.orderBy(asc(episodes.episodeNumber));

	const episodeIds = episodesResult.map((ep) => ep.id);

	let scheduleResult: {
		episodeId: string;
		airDate: Date | null;
		platformId: string | null;
		platformName: string | null;
		platformLogo: string | null;
		streamLink: string | null;
	}[] = [];

	if (episodeIds.length > 0) {
		scheduleResult = await db
			.select({
				episodeId: episodeSchedules.episodeId,
				airDate: episodeSchedules.airDate,
				platformId: platforms.id,
				platformName: platforms.name,
				platformLogo: platforms.logoUrl,
				streamLink: episodeSchedules.streamLink
			})
			.from(episodeSchedules)
			.leftJoin(platforms, eq(episodeSchedules.platformId, platforms.id))
			.where(and(
				inArray(episodeSchedules.episodeId, episodeIds),
				isNull(episodeSchedules.deletedAt)
			));
	}

	const scheduleMap = new Map<string, typeof scheduleResult[0]>();
	for (const s of scheduleResult) {
		if (!scheduleMap.has(s.episodeId)) {
			scheduleMap.set(s.episodeId, s);
		}
	}

	const schedule = episodesResult.map((ep) => {
		const sch = scheduleMap.get(ep.id);
		return {
			episode: ep.episodeNumber,
			title: ep.title ?? `ตอนที่ ${ep.episodeNumber}`,
			airDate: sch?.airDate ? sch.airDate.toISOString().split('T')[0] : 'TBA',
			platform: sch?.platformName ?? 'TBA'
		};
	});

	const firstAirDate = scheduleResult.length > 0 && scheduleResult[0]?.airDate
		? new Date(scheduleResult[0].airDate).getFullYear()
		: undefined;

	return {
		series: {
			id: seriesResult.id,
			titleEn: seriesResult.titleEn,
			titleTh: seriesResult.titleTh ?? '',
			status: seriesResult.status,
			studio: seriesResult.studioName ?? 'ไม่ระบุสตูดิโอ',
			poster: seriesResult.posterUrl ?? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=900&fit=crop',
			description: '',
			genres: [] as string[],
			episodes: episodesResult.length,
			year: firstAirDate,
			platforms: [...new Map(scheduleResult.filter((s) => s.platformId).map((s) => [s.platformId, { name: s.platformName!, logo: s.platformLogo }])).values()],
			artists: artistsResult.map((a) => ({
				name: a.nickname,
				role: a.roleName ?? 'นักแสดง',
				image: a.profileImageUrl ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
			})),
			schedule
		}
	};
};
