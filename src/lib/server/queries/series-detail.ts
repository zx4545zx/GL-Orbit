import { eq, and, isNull, asc, inArray } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { series, studios, artists, seriesArtists, episodes, episodeSchedules, platforms, genres, seriesGenres } from '$lib/server/db/schema.js';
import { getCached, setCached } from '$lib/server/cache.js';
import { formatThailandDate } from '$lib/server/timezone.js';

const CACHE_TTL = 30_000;

export type SeriesDetail = {
	id: string;
	titleEn: string;
	titleTh: string;
	status: 'UPCOMING' | 'ONGOING' | 'ENDED';
	studio: string;
	poster: string;
	description: string;
	genres: string[];
	episodes: number;
	year?: number;
	platforms: { name: string; logo: string | null }[];
	artists: { id: string; name: string; role: string; image: string }[];
	schedule: {
		episode: number;
		title: string;
		coverUrl: string | null;
		trailerUrl: string | null;
		schedules: { airDate: string; platform: string; platformLogo: string | null; streamLink: string | null; isUncut: boolean }[];
	}[];
};

type ScheduleRow = {
	episodeId: string;
	airDate: Date | null;
	platformId: string | null;
	platformName: string | null;
	platformLogo: string | null;
	streamLink: string | null;
	isUncut: boolean;
};

export async function getSeriesDetail(id: string): Promise<SeriesDetail | null> {
	const cacheKey = `query:series:${id}`;
	const cached = getCached<SeriesDetail>(cacheKey, CACHE_TTL);
	if (cached) {
		return cached;
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
				descriptionTh: series.descriptionTh,
				descriptionEn: series.descriptionEn,
				status: series.status,
				studioId: series.studioId,
				studioName: studios.name
			})
			.from(series)
			.leftJoin(studios, eq(series.studioId, studios.id))
			.where(and(eq(series.id, id), isNull(series.deletedAt)));
		return r;
	})();

	const artistsPromise = db
		.select({
			id: artists.id,
			nickname: artists.nickname,
			fullNameTh: artists.fullNameTh,
			fullNameEn: artists.fullNameEn,
			profileImageUrl: artists.profileImageUrl,
			roleName: seriesArtists.roleName
		})
		.from(seriesArtists)
		.innerJoin(artists, eq(seriesArtists.artistId, artists.id))
		.where(eq(seriesArtists.seriesId, id));

	const genresPromise = db
		.select({ name: genres.name })
		.from(seriesGenres)
		.innerJoin(genres, eq(seriesGenres.genreId, genres.id))
		.where(eq(seriesGenres.seriesId, id))
		.orderBy(asc(genres.name));

	const episodesWithSchedulePromise = (async () => {
		const episodesResult = await db
			.select({
				id: episodes.id,
				episodeNumber: episodes.episodeNumber,
				title: episodes.title,
				coverUrl: episodes.coverUrl,
				trailerUrl: episodes.trailerUrl
			})
			.from(episodes)
			.where(and(eq(episodes.seriesId, id), isNull(episodes.deletedAt)))
			.orderBy(asc(episodes.episodeNumber));

		const episodeIds = episodesResult.map((ep) => ep.id);

		const scheduleResult: ScheduleRow[] = episodeIds.length > 0
			? await db
				.select({
					episodeId: episodeSchedules.episodeId,
					airDate: episodeSchedules.airDate,
					platformId: platforms.id,
					platformName: platforms.name,
					platformLogo: platforms.logoUrl,
					streamLink: episodeSchedules.streamLink,
					isUncut: episodeSchedules.isUncut
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

	const [seriesResult, artistsResult, genresResult, episodesWithSchedule] = await Promise.all([
		seriesPromise,
		artistsPromise,
		genresPromise,
		episodesWithSchedulePromise
	]);

	if (!seriesResult) {
		return null;
	}

	const episodesResult = episodesWithSchedule.episodes;
	const scheduleResult = episodesWithSchedule.schedule;

	// --- group-by instead of first-wins ---
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
			coverUrl: ep.coverUrl ?? null,
			trailerUrl: ep.trailerUrl ?? null,
			schedules: rows.map((sch) => ({
				airDate: sch.airDate ? formatThailandDate(sch.airDate) : 'TBA',
				platform: sch.platformName ?? 'TBA',
				platformLogo: sch.platformLogo ?? null,
				streamLink: sch.streamLink ?? null,
				isUncut: sch.isUncut
			}))
		};
	});

	const firstAirDate = scheduleResult.length > 0 && scheduleResult[0]?.airDate
		? new Date(scheduleResult[0].airDate).getFullYear()
		: undefined;

	const result: SeriesDetail = {
		id: seriesResult.id,
		titleEn: seriesResult.titleEn,
		titleTh: seriesResult.titleTh ?? '',
		status: seriesResult.status as SeriesDetail['status'],
		studio: seriesResult.studioName ?? 'ไม่ระบุสตูดิโอ',
		poster: seriesResult.posterUrl ?? '/placeholders/poster.svg',
		description: seriesResult.descriptionTh ?? seriesResult.descriptionEn ?? '',
		genres: genresResult.map((g) => g.name),
		episodes: episodesResult.length,
		year: firstAirDate,
		platforms: [...new Map(scheduleResult.filter((s) => s.platformId).map((s) => [s.platformId, { name: s.platformName!, logo: s.platformLogo }])).values()],
		artists: artistsResult.map((a) => ({
			id: a.id,
			name: a.nickname,
			role: a.roleName ?? 'นักแสดง',
			image: a.profileImageUrl ?? '/placeholders/avatar.svg'
		})),
		schedule
	};

	setCached(cacheKey, result, CACHE_TTL);
	return result;
}
