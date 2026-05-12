import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series, episodes, episodeSchedules, platforms } from '$lib/server/db/schema.js';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { getCached, setCached } from '$lib/server/cache.js';
import type { RequestHandler } from './$types.js';

const CACHE_KEY = 'api:calendar';
const CACHE_TTL = 30_000;

export const GET: RequestHandler = async () => {
	const cached = getCached(CACHE_KEY, CACHE_TTL);
	if (cached) {
		return json(cached);
	}

	const db = await getDb();

	const schedules = await db
		.select({
			id: episodeSchedules.id,
			airDate: episodeSchedules.airDate,
			isUncut: episodeSchedules.isUncut,
			streamLink: episodeSchedules.streamLink,
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
			isNull(episodeSchedules.deletedAt),
			isNull(episodes.deletedAt),
			isNull(series.deletedAt)
		))
		.orderBy(asc(episodeSchedules.airDate));

	const eventsByDate: Record<string, Array<{
		time: string;
		series: string;
		seriesId: string;
		episode: string;
		platform: string;
		isUncut: boolean;
	}>> = {};

	const allSeriesSet = new Set<string>();
	const platformSet = new Set<string>();

	for (const s of schedules) {
		const dateStr = s.airDate.toISOString().split('T')[0];
		const timeStr = s.airDate.toISOString().split('T')[1].slice(0, 5);

		if (!eventsByDate[dateStr]) {
			eventsByDate[dateStr] = [];
		}

		eventsByDate[dateStr].push({
			time: timeStr,
			series: s.seriesTitleEn,
			seriesId: s.seriesId,
			episode: s.episodeTitle ?? `EP.${s.episodeNumber}`,
			platform: s.platformName,
			isUncut: s.isUncut
		});

		allSeriesSet.add(s.seriesTitleEn);
		platformSet.add(s.platformName);
	}

	const dayOfWeekNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
	const scheduleByDayMap = new Map<string, typeof schedules>();

	for (const s of schedules) {
		const dayName = dayOfWeekNames[s.airDate.getDay()];
		if (!scheduleByDayMap.has(dayName)) {
			scheduleByDayMap.set(dayName, []);
		}
		scheduleByDayMap.get(dayName)!.push(s);
	}

	const scheduleByDay = Array.from(scheduleByDayMap.entries()).map(([day, items]) => ({
		day,
		items: items.map((item) => ({
			time: item.airDate.toISOString().split('T')[1].slice(0, 5),
			series: item.seriesTitleEn,
			seriesId: item.seriesId,
			episode: item.episodeTitle ?? `EP.${item.episodeNumber}`,
			platform: item.platformName,
			isUncut: item.isUncut
		}))
	}));

	const dayOrder = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
	scheduleByDay.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

	const result = {
		events: eventsByDate,
		allSeries: Array.from(allSeriesSet),
		platforms: Array.from(platformSet),
		scheduleByDay
	};

	setCached(CACHE_KEY, result, CACHE_TTL);
	return json(result);
};
