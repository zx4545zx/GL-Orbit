import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series, studios, artists, seriesArtists, episodes, episodeSchedules, platforms } from '$lib/server/db/schema.js';
import { eq, and, isNull, asc, inArray } from 'drizzle-orm';
import { getCached, setCached } from '$lib/server/cache.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params }) => {
	const cacheKey = `api:series:${params.id}`;
	const cached = getCached(cacheKey, 30_000);
	if (cached) {
		return json(cached);
	}

	const db = await getDb();

	// q1 (series), q2 (artists), q3 (episodes) are independent.
	// q4 (schedule) depends on q3 only — nest it so it starts the moment q3
	// finishes, without waiting for q1/q2. Cuts 4 sequential round-trips to 2.
	const seriesPromise = (async () => {
		const [r] = await db
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
		return r;
	})();

	const artistsPromise = db
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

	const episodesWithSchedulePromise = (async () => {
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

		type ScheduleRow = {
			episodeId: string;
			airDate: Date | null;
			platformId: string | null;
			platformName: string | null;
			platformLogo: string | null;
			streamLink: string | null;
		};

		const scheduleResult: ScheduleRow[] = episodeIds.length > 0
			? await db
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
				))
			: [];

		return { episodes: episodesResult, schedule: scheduleResult };
	})();

	const [seriesResult, artistsResult, episodesWithSchedule] = await Promise.all([
		seriesPromise,
		artistsPromise,
		episodesWithSchedulePromise
	]);

	if (!seriesResult) {
		error(404, 'ไม่พบซีรีส์นี้');
	}

	const episodesResult = episodesWithSchedule.episodes;

	type ScheduleRow = {
		episodeId: string;
		airDate: Date | null;
		platformId: string | null;
		platformName: string | null;
		platformLogo: string | null;
		streamLink: string | null;
	};
	const scheduleResult: ScheduleRow[] = episodesWithSchedule.schedule;

	// --- FIXED: group-by instead of first-wins ---
	const scheduleMap = new Map<string, ScheduleRow[]>();
	for (const s of scheduleResult) {
		const arr = scheduleMap.get(s.episodeId) ?? [];
		arr.push(s);
		scheduleMap.set(s.episodeId, arr);
	}

	const schedule = episodesResult.map((ep) => {
		const rows = scheduleMap.get(ep.id) ?? [];
		return {
			episode: ep.episodeNumber,
			title: ep.title ?? `ตอนที่ ${ep.episodeNumber}`,
			schedules: rows.map((sch) => ({
				airDate: sch.airDate ? sch.airDate.toISOString().split('T')[0] : 'TBA',
				platform: sch.platformName ?? 'TBA',
				platformLogo: sch.platformLogo ?? null,
				streamLink: sch.streamLink ?? null
			}))
		};
	});

	const firstAirDate = scheduleResult.length > 0 && scheduleResult[0]?.airDate
		? new Date(scheduleResult[0].airDate).getFullYear()
		: undefined;

	const result = {
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
				id: a.id,
				name: a.nickname,
				role: a.roleName ?? 'นักแสดง',
				image: a.profileImageUrl ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
			})),
			schedule
		}
	};

	setCached(cacheKey, result, 30_000);
	return json(result);
};
