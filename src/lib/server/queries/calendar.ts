import { eq, and, isNull, asc, gte, lt } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { series, episodes, episodeSchedules, platforms } from '$lib/server/db/schema.js';
import { getCached, setCached } from '$lib/server/cache.js';
import type { CalendarApiResponse } from '$lib/types/calendar.js';

const CACHE_TTL = 30_000;

export type CalendarQuery =
	| { type: 'month'; year: number; month: number }
	| { type: 'week'; startDate: string; endDate: string }
	| { type: 'all' };

export type CalendarValidation =
	| { ok: true; query: CalendarQuery }
	| { ok: false; error: string };

// Convert UTC date to Thailand time (UTC+7)
function toThailandTime(date: Date): Date {
	return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}

function formatThailandDate(date: Date): string {
	const thailandDate = toThailandTime(date);
	const year = thailandDate.getUTCFullYear();
	const month = String(thailandDate.getUTCMonth() + 1).padStart(2, '0');
	const day = String(thailandDate.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function formatThailandTime(date: Date): string {
	const thailandDate = toThailandTime(date);
	const hours = String(thailandDate.getUTCHours()).padStart(2, '0');
	const minutes = String(thailandDate.getUTCMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}

function getThailandDayOfWeek(date: Date): number {
	return toThailandTime(date).getUTCDay();
}

/**
 * Validate raw search params into a structured calendar query.
 * Pure function — shared by the public API endpoint and the page server load.
 */
export function validateCalendarQuery(url: URL): CalendarValidation {
	const yearParam = url.searchParams.get('year');
	const monthParam = url.searchParams.get('month');
	const startDateParam = url.searchParams.get('startDate');
	const endDateParam = url.searchParams.get('endDate');

	const hasMonth = yearParam !== null || monthParam !== null;
	const hasWeek = startDateParam !== null || endDateParam !== null;

	if (hasMonth && hasWeek) {
		return { ok: false, error: 'ไม่สามารถระบุทั้งเดือนและช่วงวันได้พร้อมกัน' };
	}

	if (yearParam !== null && monthParam === null) {
		return { ok: false, error: 'กรุณาระบุเดือน' };
	}

	if (monthParam !== null && yearParam === null) {
		return { ok: false, error: 'กรุณาระบุปี' };
	}

	if (startDateParam !== null && endDateParam === null) {
		return { ok: false, error: 'กรุณาระบุวันสิ้นสุด' };
	}

	if (endDateParam !== null && startDateParam === null) {
		return { ok: false, error: 'กรุณาระบุวันเริ่มต้น' };
	}

	if (yearParam !== null && monthParam !== null) {
		const year = parseInt(yearParam, 10);
		const month = parseInt(monthParam, 10);

		if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
			return { ok: false, error: 'พารามิเตอร์เดือนไม่ถูกต้อง' };
		}

		return { ok: true, query: { type: 'month', year, month } };
	}

	if (startDateParam !== null && endDateParam !== null) {
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(startDateParam) || !dateRegex.test(endDateParam)) {
			return { ok: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' };
		}

		const startDate = new Date(startDateParam);
		const endDate = new Date(endDateParam);

		if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
			return { ok: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' };
		}

		return { ok: true, query: { type: 'week', startDate: startDateParam, endDate: endDateParam } };
	}

	return { ok: true, query: { type: 'all' } };
}

function cacheKeyFor(query: CalendarQuery): string {
	switch (query.type) {
		case 'week':
			return `query:calendar:week:${query.startDate}:${query.endDate}`;
		case 'month':
			return `query:calendar:${query.year}:${query.month}`;
		default:
			return 'query:calendar:all';
	}
}

/**
 * Query schedules and build the calendar response for the given query.
 * Throws on unexpected DB failure (caller decides how to surface it).
 */
export async function getCalendarData(query: CalendarQuery): Promise<CalendarApiResponse> {
	const cacheKey = cacheKeyFor(query);
	const cached = getCached<CalendarApiResponse>(cacheKey, CACHE_TTL);
	if (cached) {
		return cached;
	}

	const db = await getDb();

	const whereConditions = [
		isNull(episodeSchedules.deletedAt),
		isNull(episodes.deletedAt),
		isNull(series.deletedAt)
	];

	if (query.type === 'week') {
		const startDate = new Date(query.startDate);
		const endDate = new Date(query.endDate);
		const thailandOffsetMs = 7 * 60 * 60 * 1000;
		const startUtc = new Date(startDate.getTime() - thailandOffsetMs);
		const endUtc = new Date(endDate.getTime() - thailandOffsetMs);

		whereConditions.push(
			gte(episodeSchedules.airDate, startUtc),
			lt(episodeSchedules.airDate, endUtc)
		);
	} else if (query.type === 'month') {
		const startDate = new Date(Date.UTC(query.year, query.month - 1, 1, 0, 0, 0));
		const endDate = new Date(Date.UTC(query.year, query.month, 1, 0, 0, 0));
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
		platforms: string[];
		isUncut: boolean;
	}>> = {};

	const allSeriesSet = new Set<string>();
	const platformSet = new Set<string>();

	const eventsMap = new Map<string, {
		time: string;
		series: string;
		seriesId: string;
		episodes: string[];
		platforms: string[];
		isUncut: boolean;
	}>();

	for (const s of schedules) {
		const dateStr = formatThailandDate(s.airDate);
		const timeStr = formatThailandTime(s.airDate);
		const key = `${dateStr}:${s.seriesTitleEn}:${timeStr}`;

		if (!eventsMap.has(key)) {
			eventsMap.set(key, {
				time: timeStr,
				series: s.seriesTitleEn,
				seriesId: s.seriesId,
				episodes: [],
				platforms: [],
				isUncut: s.isUncut
			});
		}

		const event = eventsMap.get(key)!;
		const episodeLabel = s.episodeTitle ?? `EP.${s.episodeNumber}`;

		if (!event.episodes.includes(episodeLabel)) {
			event.episodes.push(episodeLabel);
		}
		if (!event.platforms.includes(s.platformName)) {
			event.platforms.push(s.platformName);
		}

		allSeriesSet.add(s.seriesTitleEn);
		platformSet.add(s.platformName);
	}

	for (const [key, event] of eventsMap.entries()) {
		const dateStr = key.split(':')[0];

		if (!eventsByDate[dateStr]) {
			eventsByDate[dateStr] = [];
		}

		const episodeText = event.episodes.length > 1
			? event.episodes.join(', ')
			: event.episodes[0];

		eventsByDate[dateStr].push({
			time: event.time,
			series: event.series,
			seriesId: event.seriesId,
			episode: episodeText,
			platforms: event.platforms,
			isUncut: event.isUncut
		});
	}

	const dayOfWeekNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
	const scheduleByDayMap = new Map<string, Map<string, {
		time: string;
		series: string;
		seriesId: string;
		episodes: string[];
		platforms: string[];
		isUncut: boolean;
	}>>();

	for (const s of schedules) {
		const dayName = dayOfWeekNames[getThailandDayOfWeek(s.airDate)];
		const timeStr = formatThailandTime(s.airDate);
		const key = `${s.seriesTitleEn}:${timeStr}`;

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
				platforms: [],
				isUncut: s.isUncut
			});
		}

		const item = dayMap.get(key)!;
		const episodeLabel = s.episodeTitle ?? `EP.${s.episodeNumber}`;

		if (!item.episodes.includes(episodeLabel)) {
			item.episodes.push(episodeLabel);
		}
		if (!item.platforms.includes(s.platformName)) {
			item.platforms.push(s.platformName);
		}
	}

	const scheduleByDay = Array.from(scheduleByDayMap.entries()).map(([day, itemsMap]) => ({
		day,
		items: Array.from(itemsMap.values()).map((item) => ({
			time: item.time,
			series: item.series,
			seriesId: item.seriesId,
			episode: item.episodes.length > 1 ? item.episodes.join(', ') : item.episodes[0],
			platforms: item.platforms,
			isUncut: item.isUncut
		}))
	}));

	const dayOrder = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
	scheduleByDay.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

	const result: CalendarApiResponse = {
		events: eventsByDate,
		allSeries: Array.from(allSeriesSet),
		platforms: Array.from(platformSet),
		scheduleByDay
	};

	setCached(cacheKey, result, CACHE_TTL);
	return result;
}
