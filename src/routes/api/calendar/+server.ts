import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series, episodes, episodeSchedules, platforms } from '$lib/server/db/schema.js';
import { eq, and, isNull, asc, gte, lt } from 'drizzle-orm';
import { getCached, setCached } from '$lib/server/cache.js';
import type { RequestHandler } from './$types.js';

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

export const GET: RequestHandler = async ({ url }) => {
	// Parse query parameters for filtering
	const yearParam = url.searchParams.get('year');
	const monthParam = url.searchParams.get('month');
	const startDateParam = url.searchParams.get('startDate');
	const endDateParam = url.searchParams.get('endDate');
	
	// Build cache key based on filters
	let cacheKey: string;
	if (startDateParam && endDateParam) {
		cacheKey = `api:calendar:week:${startDateParam}:${endDateParam}`;
	} else if (yearParam && monthParam) {
		cacheKey = `api:calendar:${yearParam}:${monthParam}`;
	} else {
		cacheKey = 'api:calendar:all';
	}
	
	const cached = getCached(cacheKey, CACHE_TTL);
	if (cached) {
		return json(cached);
	}

	const db = await getDb();

	// Build where conditions
	const whereConditions = [
		isNull(episodeSchedules.deletedAt),
		isNull(episodes.deletedAt),
		isNull(series.deletedAt)
	];

	// Add date range filter
	if (startDateParam && endDateParam) {
		// Week-based filtering (for list view)
		const startDate = new Date(startDateParam);
		const endDate = new Date(endDateParam);
		
		// Convert Thailand time to UTC for database query
		const thailandOffsetMs = 7 * 60 * 60 * 1000;
		const startUtc = new Date(startDate.getTime() - thailandOffsetMs);
		const endUtc = new Date(endDate.getTime() - thailandOffsetMs);
		
		whereConditions.push(
			gte(episodeSchedules.airDate, startUtc),
			lt(episodeSchedules.airDate, endUtc)
		);
	} else if (yearParam && monthParam) {
		// Month-based filtering (for grid/calendar views)
		const year = parseInt(yearParam);
		const month = parseInt(monthParam);
		
		// Create date range for the month (Thailand time)
		const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
		const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
		
		// Convert Thailand time to UTC for database query
		const thailandOffsetMs = 7 * 60 * 60 * 1000;
		const startUtc = new Date(startDate.getTime() - thailandOffsetMs);
		const endUtc = new Date(endDate.getTime() - thailandOffsetMs);
		
		whereConditions.push(
			gte(episodeSchedules.airDate, startUtc),
			lt(episodeSchedules.airDate, endUtc)
		);
	}

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
		.where(and(...whereConditions))
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

	// Group events by date + series + time to merge multiple episodes
	const eventsMap = new Map<string, {
		time: string;
		series: string;
		seriesId: string;
		episodes: string[];
		platform: string;
		isUncut: boolean;
	}>();

	for (const s of schedules) {
		const dateStr = formatThailandDate(s.airDate);
		const timeStr = formatThailandTime(s.airDate);
		const key = `${dateStr}:${s.seriesTitleEn}:${timeStr}:${s.platformName}`;

		if (!eventsMap.has(key)) {
			eventsMap.set(key, {
				time: timeStr,
				series: s.seriesTitleEn,
				seriesId: s.seriesId,
				episodes: [],
				platform: s.platformName,
				isUncut: s.isUncut
			});
		}

		const episodeLabel = s.episodeTitle ?? `EP.${s.episodeNumber}`;
		if (!eventsMap.get(key)!.episodes.includes(episodeLabel)) {
			eventsMap.get(key)!.episodes.push(episodeLabel);
		}

		allSeriesSet.add(s.seriesTitleEn);
		platformSet.add(s.platformName);
	}

	// Convert map back to eventsByDate structure
	for (const [key, event] of eventsMap.entries()) {
		const dateStr = key.split(':')[0];
		
		if (!eventsByDate[dateStr]) {
			eventsByDate[dateStr] = [];
		}

		// Join episodes with comma or show single episode
		const episodeText = event.episodes.length > 1 
			? event.episodes.join(', ')
			: event.episodes[0];

		eventsByDate[dateStr].push({
			time: event.time,
			series: event.series,
			seriesId: event.seriesId,
			episode: episodeText,
			platform: event.platform,
			isUncut: event.isUncut
		});
	}

	const dayOfWeekNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
	const scheduleByDayMap = new Map<string, Map<string, {
		time: string;
		series: string;
		seriesId: string;
		episodes: string[];
		platform: string;
		isUncut: boolean;
	}>>();

	for (const s of schedules) {
		const dayName = dayOfWeekNames[getThailandDayOfWeek(s.airDate)];
		const timeStr = formatThailandTime(s.airDate);
		const key = `${s.seriesTitleEn}:${timeStr}:${s.platformName}`;

		if (!scheduleByDayMap.has(dayName)) {
			scheduleByDayMap.set(dayName, new Map());
		}

		const dayMap = scheduleByDayMap.get(dayName)!;
		if (!dayMap.has(key)) {
			dayMap.set(key, {
				time: timeStr,
				series: s.seriesTitleEn,
				seriesId: s.seriesId,
				episodes: [],
				platform: s.platformName,
				isUncut: s.isUncut
			});
		}

		const episodeLabel = s.episodeTitle ?? `EP.${s.episodeNumber}`;
		if (!dayMap.get(key)!.episodes.includes(episodeLabel)) {
			dayMap.get(key)!.episodes.push(episodeLabel);
		}
	}

	const scheduleByDay = Array.from(scheduleByDayMap.entries()).map(([day, itemsMap]) => ({
		day,
		items: Array.from(itemsMap.values()).map((item) => ({
			time: item.time,
			series: item.series,
			seriesId: item.seriesId,
			episode: item.episodes.length > 1 ? item.episodes.join(', ') : item.episodes[0],
			platform: item.platform,
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

	setCached(cacheKey, result, CACHE_TTL);
	return json(result);
};
