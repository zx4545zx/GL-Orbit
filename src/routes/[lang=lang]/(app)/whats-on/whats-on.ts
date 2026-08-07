import type { EventView, OrbitEvent } from '$lib/types/whats-on.js';

export interface WhatsOnParams {
	view: EventView;
	year: number;
	month: number;
	anchorDate: string;
}

export interface WhatsOnEventWindow {
	start: string;
	end: string;
}

const ALL_VIEW_PAST_BUFFER_DAYS = 31;
const ALL_VIEW_FUTURE_DAYS = 183;
const OVERLAP_BUFFER_DAYS = 31;

export function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function getStartOfWeek(date: Date): Date {
	const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = copy.getDay();
	copy.setDate(copy.getDate() - day + (day === 0 ? -6 : 1));
	return copy;
}

export function parseWhatsOnParams(searchParams: URLSearchParams, fallback = currentDateInBangkok()): WhatsOnParams {
	const viewParam = searchParams.get('view');
	const view: EventView = viewParam === 'week' || viewParam === 'calendar' || viewParam === 'all' ? viewParam : 'all';
	const anchorParam = searchParams.get('date');
	const parsedAnchor = anchorParam ? new Date(`${anchorParam}T12:00:00`) : fallback;
	const anchor = Number.isNaN(parsedAnchor.getTime()) ? fallback : parsedAnchor;
	const yearParam = Number(searchParams.get('year'));
	const monthParam = Number(searchParams.get('month'));
	const year = Number.isInteger(yearParam) && yearParam >= 2020 && yearParam <= 2100 ? yearParam : anchor.getFullYear();
	const month = Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12 ? monthParam : anchor.getMonth() + 1;

	return { view, year, month, anchorDate: formatDateLocal(anchor) };
}

export function getWhatsOnEventWindow(params: WhatsOnParams): WhatsOnEventWindow {
	const anchor = parseDateKey(params.anchorDate);
	let start: Date;
	let end: Date;

	if (params.view === 'calendar') {
		const firstOfMonth = new Date(params.year, params.month - 1, 1, 12);
		const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
		const gridStart = addDays(firstOfMonth, -mondayOffset);
		start = addDays(gridStart, -OVERLAP_BUFFER_DAYS);
		end = addDays(gridStart, 42);
	} else if (params.view === 'week') {
		const weekStart = getStartOfWeek(anchor);
		start = addDays(weekStart, -OVERLAP_BUFFER_DAYS);
		end = addDays(weekStart, 7);
	} else {
		start = addDays(anchor, -ALL_VIEW_PAST_BUFFER_DAYS);
		end = addDays(anchor, ALL_VIEW_FUTURE_DAYS);
	}

	return {
		start: bangkokMidnightIso(formatDateLocal(start)),
		end: bangkokMidnightIso(formatDateLocal(end))
	};
}

export function eventsForDate(events: OrbitEvent[], dateKey: string): OrbitEvent[] {
	return events.filter((event) => event.dateKey <= dateKey && (event.endDateKey ?? event.dateKey) >= dateKey);
}

export function buildWhatsOnUrl(lang: string, params: WhatsOnParams): string {
	const search = new URLSearchParams({ view: params.view });
	if (params.view === 'calendar') {
		search.set('year', String(params.year));
		search.set('month', String(params.month));
	} else if (params.view === 'week') {
		search.set('date', params.anchorDate);
	}
	return `/${lang}/whats-on?${search.toString()}`;
}

export function venueName(location: string | null): string | null {
	return location && !/^https?:\/\//i.test(location) ? location : null;
}

export function googleMapsSearchUrl(venue: string): string {
	return `https://www.google.com/maps?q=${encodeURIComponent(venue)}`;
}

function parseDateKey(dateKey: string): Date {
	const [year, month, day] = dateKey.split('-').map(Number);
	return new Date(year, month - 1, day, 12);
}

function addDays(date: Date, amount: number): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12);
}

function bangkokMidnightIso(dateKey: string): string {
	return new Date(`${dateKey}T00:00:00+07:00`).toISOString();
}

function currentDateInBangkok(now = new Date()): Date {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Asia/Bangkok',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric'
	}).formatToParts(now);
	const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
	return new Date(value('year'), value('month') - 1, value('day'), 12);
}
