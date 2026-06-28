import { eq, and, isNull, gte, lte, asc, inArray } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { series, studios, episodes, episodeSchedules, platforms } from '$lib/server/db/schema.js';
import { getCached, setCached } from '$lib/server/cache.js';
import { dedupeCountdownRows } from './countdown.js';
import { toThailandTime } from '$lib/server/timezone.js';
import type { HomeApiResponse } from '$lib/types/home.js';

const CACHE_KEY = 'query:home';
const CACHE_TTL = 30_000;

export async function getHomeData(): Promise<HomeApiResponse> {
	const cached = getCached<HomeApiResponse>(CACHE_KEY, CACHE_TTL);
	if (cached) {
		return cached;
	}

	const db = await getDb();
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const [featuredSeries, upcomingSchedules, countdownSchedules] = await Promise.all([
		db
			.select({
				id: series.id,
				titleEn: series.titleEn,
				titleTh: series.titleTh,
				posterUrl: series.posterUrl,
				status: series.status,
				studioName: studios.name
			})
			.from(series)
			.leftJoin(studios, eq(series.studioId, studios.id))
			.where(and(eq(series.status, 'ONGOING'), isNull(series.deletedAt)))
			.orderBy(asc(series.titleEn))
			.limit(8),
		db
			.select({
				airDate: episodeSchedules.airDate,
				isUncut: episodeSchedules.isUncut,
				episodeNumber: episodes.episodeNumber,
				episodeTitle: episodes.title,
				seriesId: series.id,
				seriesTitleEn: series.titleEn,
				seriesTitleTh: series.titleTh,
				platformName: platforms.name
			})
			.from(episodeSchedules)
			.innerJoin(episodes, eq(episodeSchedules.episodeId, episodes.id))
			.innerJoin(series, eq(episodes.seriesId, series.id))
			.innerJoin(platforms, eq(episodeSchedules.platformId, platforms.id))
			.where(and(
				gte(episodeSchedules.airDate, today),
				isNull(episodeSchedules.deletedAt),
				isNull(episodes.deletedAt),
				isNull(series.deletedAt)
			))
			.orderBy(asc(episodeSchedules.airDate))
			.limit(5),
		db
			.select({
				id: episodeSchedules.id,
				airDate: episodeSchedules.airDate,
				isUncut: episodeSchedules.isUncut,
				episodeNumber: episodes.episodeNumber,
				episodeTitle: episodes.title,
				seriesId: series.id,
				seriesTitleEn: series.titleEn,
				seriesTitleTh: series.titleTh,
				posterUrl: series.posterUrl,
				platformName: platforms.name
			})
			.from(episodeSchedules)
			.innerJoin(episodes, eq(episodeSchedules.episodeId, episodes.id))
			.innerJoin(series, eq(episodes.seriesId, series.id))
			.innerJoin(platforms, eq(episodeSchedules.platformId, platforms.id))
			.where(and(
				gte(episodeSchedules.airDate, new Date()),
				lte(episodeSchedules.airDate, new Date(Date.now() + 24 * 60 * 60 * 1000)),
				inArray(series.status, ['ONGOING', 'UPCOMING']),
				isNull(episodeSchedules.deletedAt),
				isNull(episodes.deletedAt),
				isNull(series.deletedAt)
			))
			.orderBy(asc(episodeSchedules.airDate))
			.limit(20)
	]);

	const dayShortNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

	const result: HomeApiResponse = {
		featuredSeries: featuredSeries.map((s) => ({
			id: s.id,
			title: s.titleEn,
			subtitle: s.titleTh ?? '',
			poster: s.posterUrl ?? '/placeholders/poster.svg',
			status: s.status,
			studio: s.studioName ?? 'ไม่ระบุสตูดิโอ'
		})),
		upcomingSchedule: upcomingSchedules.map((s) => {
			const d = toThailandTime(s.airDate);
			const dayName = dayShortNames[d.getUTCDay()];
			const hours = String(d.getUTCHours()).padStart(2, '0');
			const minutes = String(d.getUTCMinutes()).padStart(2, '0');
			const timeStr = `${hours}:${minutes}`;
			return {
				day: dayName + '.',
				time: timeStr,
				series: s.seriesTitleEn,
				seriesId: s.seriesId,
				episode: s.episodeTitle ?? `EP.${s.episodeNumber}`,
				platform: s.platformName,
				isUncut: s.isUncut
			};
		}),
		countdown: dedupeCountdownRows(countdownSchedules)
			.slice(0, 3)
			.map((s) => ({
				id: s.id,
				seriesId: s.seriesId,
				title: s.seriesTitleEn,
				subtitle: s.seriesTitleTh ?? '',
				poster: s.posterUrl ?? '/placeholders/poster.svg',
				episode: s.episodeTitle ?? `EP.${s.episodeNumber}`,
				platform: s.platformName,
				airDate: s.airDate.toISOString(),
				isUncut: s.isUncut
			}))
	};

	setCached(CACHE_KEY, result, CACHE_TTL);
	return result;
}
