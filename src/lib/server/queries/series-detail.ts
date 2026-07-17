import { eq, and, isNull, asc, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb } from '$lib/server/db/index.js';
import { series, studios, artists, seriesArtists, episodes, episodeSchedules, platforms, genres, seriesGenres, seriesGalleryImages, ships, shipSeries, studioSocials } from '$lib/server/db/schema.js';
import { getCached, setCached } from '$lib/server/cache.js';
import { formatThailandDate } from '$lib/server/timezone.js';

const CACHE_TTL = 30_000;

export type SeriesDetail = {
	id: string;
	titleEn: string;
	titleTh: string;
	descriptionTh: string;
	descriptionEn: string;
	status: 'UPCOMING' | 'ONGOING' | 'ENDED';
	studio: string;
	studioId: string | null;
	studioOfficialSite: string | null;
	studioSocials: { platform: string; url: string; iconUrl: string | null }[];
	poster: string;
	coverUrl: string | null;
	genres: string[];
	episodes: number;
	year?: number;
	platforms: { name: string; logo: string | null }[];
	artists: { id: string; name: string; role: string; image: string }[];
	gallery: { id: string; imageUrl: string; caption: string | null }[];
	ships: { id: string; slug: string; name: string; imageUrl: string; artist1Name: string; artist1Image: string; artist2Name: string; artist2Image: string }[];
	schedule: {
		episode: number;
		title: string;
		coverUrl: string | null;
		trailerUrl: string | null;
		schedules: { title: string | null; airDate: string; platform: string; platformLogo: string | null; streamLink: string | null; isUncut: boolean }[];
	}[];
};

type ScheduleRow = {
	episodeId: string;
	airDate: Date | null;
	platformId: string | null;
	platformName: string | null;
	platformLogo: string | null;
	title: string | null;
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

	// q1 (series+studio info), q2 (artists), q3 (genres), q4 (gallery) are independent.
	// q5 (episodes→nested schedule) depends only on q5a (episode ids).
	// q6 (ships+artist names) is independent.
	// All 6 run in parallel via Promise.all; the schedule sub-query nests inside q5.
	const seriesPromise = (async () => {
		const [r] = await db
			.select({
				id: series.id,
				titleEn: series.titleEn,
				titleTh: series.titleTh,
				posterUrl: series.posterUrl,
				coverUrl: series.coverUrl,
				descriptionTh: series.descriptionTh,
				descriptionEn: series.descriptionEn,
				status: series.status,
				studioId: series.studioId,
				studioName: studios.name,
				studioOfficialSite: studios.officialSite
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

	const galleryPromise = db
		.select({
			id: seriesGalleryImages.id,
			imageUrl: seriesGalleryImages.imageUrl,
			caption: seriesGalleryImages.caption
		})
		.from(seriesGalleryImages)
		.where(eq(seriesGalleryImages.seriesId, id))
		.orderBy(asc(seriesGalleryImages.sortOrder), asc(seriesGalleryImages.createdAt));

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
					title: episodeSchedules.title,
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

	// Ships: ship_series → ships, then join artist aliases for names
	const artist1 = alias(artists, 'series_detail_ship_artist_1');
	const artist2 = alias(artists, 'series_detail_ship_artist_2');
	const shipsPromise = (async () => {
		const shipRows = await db
			.select({
				id: ships.id,
				slug: ships.slug,
				name: ships.name,
				imageUrl: ships.imageUrl,
				isPublished: ships.isPublished,
				artist1Id: artist1.id,
				artist1Nickname: artist1.nickname,
				artist1ProfileImageUrl: artist1.profileImageUrl,
				artist2Id: artist2.id,
				artist2Nickname: artist2.nickname,
				artist2ProfileImageUrl: artist2.profileImageUrl
			})
			.from(shipSeries)
			.innerJoin(ships, eq(shipSeries.shipId, ships.id))
			.innerJoin(artist1, eq(ships.artist1Id, artist1.id))
			.innerJoin(artist2, eq(ships.artist2Id, artist2.id))
			.where(and(eq(shipSeries.seriesId, id), eq(ships.isPublished, true)))
			.orderBy(asc(shipSeries.sortOrder));

		return shipRows;
	})();

	// Studio socials — only if studioId exists
	const studioSocialsPromise = (async () => {
		const seriesRow = await seriesPromise;
		if (!seriesRow?.studioId) return [];
		return db
			.select({
				platform: studioSocials.platform,
				url: studioSocials.url,
				iconUrl: studioSocials.iconUrl
			})
			.from(studioSocials)
			.where(eq(studioSocials.studioId, seriesRow.studioId));
	})();

	const [seriesResult, artistsResult, genresResult, galleryResult, episodesWithSchedule, shipsResult, studioSocialsResult] = await Promise.all([
		seriesPromise,
		artistsPromise,
		genresPromise,
		galleryPromise,
		episodesWithSchedulePromise,
		shipsPromise,
		studioSocialsPromise
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
				title: sch.title,
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
		studioId: seriesResult.studioId ?? null,
		studioOfficialSite: seriesResult.studioOfficialSite ?? null,
		studioSocials: studioSocialsResult.map((s) => ({
			platform: s.platform,
			url: s.url,
			iconUrl: s.iconUrl ?? null
		})),
		poster: seriesResult.posterUrl ?? '/placeholders/poster.svg',
		coverUrl: seriesResult.coverUrl ?? null,
		descriptionTh: seriesResult.descriptionTh ?? '',
		descriptionEn: seriesResult.descriptionEn ?? '',
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
		gallery: galleryResult,
		ships: shipsResult.map((ship) => ({
			id: ship.id,
			slug: ship.slug,
			name: ship.name,
			imageUrl: ship.imageUrl ?? '/placeholders/poster.svg',
			artist1Name: ship.artist1Nickname ?? '',
			artist1Image: ship.artist1ProfileImageUrl ?? '/placeholders/avatar.svg',
			artist2Name: ship.artist2Nickname ?? '',
			artist2Image: ship.artist2ProfileImageUrl ?? '/placeholders/avatar.svg'
		})),
		schedule
	};

	setCached(cacheKey, result, CACHE_TTL);
	return result;
}
