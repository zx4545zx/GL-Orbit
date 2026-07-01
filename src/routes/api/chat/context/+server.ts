import { json } from '@sveltejs/kit';
import { getSeriesDetail } from '$lib/server/queries/series-detail.js';
import { getArtistDetail } from '$lib/server/queries/artist-detail.js';
import { getCalendarData } from '$lib/server/queries/calendar.js';
import type { CalendarApiResponse, CalendarEvent } from '$lib/types/calendar.js';
import type { RequestHandler } from './$types.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 20;

function filterEvents(events: Record<string, CalendarEvent[]>, ids: Set<string>): Record<string, CalendarEvent[]> {
	return Object.fromEntries(
		Object.entries(events)
			.map(([date, items]) => [date, items.filter((item) => ids.has(item.seriesId))] as const)
			.filter(([, items]) => items.length > 0)
	);
}

function filterSchedule(calendar: CalendarApiResponse, ids: string[]): CalendarApiResponse {
	const idSet = new Set(ids);
	const events = filterEvents(calendar.events, idSet);
	const scheduleByDay = calendar.scheduleByDay
		.map((day) => ({ ...day, items: day.items.filter((item) => idSet.has(item.seriesId)) }))
		.filter((day) => day.items.length > 0);
	const platforms = Array.from(new Set([...Object.values(events).flat(), ...scheduleByDay.flatMap((day) => day.items)].flatMap((item) => item.platforms)));
	const allSeries = Array.from(new Set([...Object.values(events).flat(), ...scheduleByDay.flatMap((day) => day.items)].map((item) => item.series)));
	const seriesPosters = Object.fromEntries(
		[...Object.values(events).flat(), ...scheduleByDay.flatMap((day) => day.items)].map((item) => [item.series, item.posterUrl])
	);
	return { events, allSeries, seriesPosters, platforms, scheduleByDay };
}

function parseBody(body: unknown): { type: string; ids: string[] } | null {
	if (!body || typeof body !== 'object') return null;
	const b = body as { type?: unknown; ids?: unknown };
	if (typeof b.type !== 'string' || !Array.isArray(b.ids)) return null;
	const ids = b.ids.filter((x): x is string => typeof x === 'string' && UUID_RE.test(x));
	return { type: b.type, ids };
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
	}

	const parsed = parseBody(body);
	if (!parsed || parsed.ids.length === 0 || parsed.ids.length > MAX_IDS) {
		return json({ error: 'คำขอไม่ถูกต้อง' }, { status: 400 });
	}

	if (parsed.type === 'series') {
		const items = (await Promise.all(parsed.ids.map((id) => getSeriesDetail(id)))).filter((x): x is NonNullable<typeof x> => x !== null);
		return json({ type: 'series', items });
	}

	if (parsed.type === 'artist') {
		const items = (await Promise.all(parsed.ids.map((id) => getArtistDetail(id)))).filter((x): x is NonNullable<typeof x> => x !== null);
		return json({ type: 'artist', items });
	}

	if (parsed.type === 'schedule') {
		const calendar = await getCalendarData({ type: 'all' });
		return json({ type: 'schedule', calendar: filterSchedule(calendar, parsed.ids) });
	}

	return json({ error: 'ยังไม่รองรับประเภทนี้' }, { status: 400 });
};
