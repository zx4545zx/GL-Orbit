import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series, episodes, episodeSchedules, platforms } from '$lib/server/db/schema.js';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { getCached, setCached } from '$lib/server/cache.js';
import type { RequestHandler } from './$types.js';

const CACHE_KEY = 'api:calendar';
const CACHE_TTL = 30_000;

// Helper function to convert UTC date to Thailand time (UTC+7)
function toThailandTime(date: Date): Date {
	const utcMs = date.getTime();
	const thailandOffsetMs = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
	return new Date(utcMs + thailandOffsetMs);
}

// Format date as YYYY-MM-DD using Thailand time
function formatThailandDate(date: Date): string {
	const thailandDate = toThailandTime(date);
	const year = thailandDate.getUTCFullYear();
	const month = String(thailandDate.getUTCMonth() + 1).padStart(2, '0');
	const day = String(thailandDate.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// Format time as HH:MM using Thailand time
function formatThailandTime(date: Date): string {
	const thailandDate = toThailandTime(date);
	const hours = String(thailandDate.getUTCHours()).padStart(2, '0');
	const minutes = String(thailandDate.getUTCMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}

// Get day of week using Thailand time
function getThailandDayOfWeek(date: Date): number {
	const thailandDate = toThailandTime(date);
	return thailandDate.getUTCDay();
}

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
		const dateStr = formatThailandDate(s.airDate);
		const timeStr = formatThailandTime(s.airDate);

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
		const dayName = dayOfWeekNames[getThailandDayOfWeek(s.airDate)];
		if (!scheduleByDayMap.has(dayName)) {
			scheduleByDayMap.set(dayName, []);
		}
		scheduleByDayMap.get(dayName)!.push(s);
	}

	const scheduleByDay = Array.from(scheduleByDayMap.entries()).map(([day, items]) => ({
		day,
		items: items.map((item) => ({
			time: formatThailandTime(item.airDate),
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
