import { getDb } from '$lib/server/db/index.js';
import { series, studios, episodes, episodeSchedules, platforms } from '$lib/server/db/schema.js';
import { eq, and, isNull, gte, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const db = await getDb();

	// Featured series — ONGOING or UPCOMING, limit 6
	const featuredSeries = await db
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
		.where(and(
			isNull(series.deletedAt),
			// Only ONGOING or UPCOMING for featured
		))
		.orderBy(asc(series.titleEn))
		.limit(6);

	// Upcoming schedule — from today onwards, limit 5
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const upcomingSchedules = await db
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
		.limit(5);

	const dayShortNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

	const upcomingSchedule = upcomingSchedules.map((s) => {
		const d = s.airDate;
		const dayName = dayShortNames[d.getDay()];
		const timeStr = d.toISOString().split('T')[1].slice(0, 5);

		return {
			day: dayName + '.',
			time: timeStr,
			series: s.seriesTitleEn,
			seriesId: s.seriesId,
			episode: s.episodeTitle ?? `EP.${s.episodeNumber}`,
			platform: s.platformName,
			isUncut: s.isUncut
		};
	});

	return {
		featuredSeries: featuredSeries.map((s) => ({
			id: s.id,
			title: s.titleEn,
			subtitle: s.titleTh ?? '',
			poster: s.posterUrl ?? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
			status: s.status,
			studio: s.studioName ?? 'ไม่ระบุสตูดิโอ'
		})),
		upcomingSchedule
	};
};
