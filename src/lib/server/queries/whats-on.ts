import { listPublishedNews } from '$lib/server/news.js';
import type { EventType, NewsItem, OrbitEvent, WhatsOnData } from '$lib/types/whats-on.js';

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ROWS = '3000';
const DEFAULT_TIMEZONE = 'Asia/Bangkok';
const EVENT_SELECT = 'event_id,title,performer,full_title,starts_at,ends_at,all_day,location,event_type,pairing_id,actress_id,company_id,source_timezone,lat,lng';

type Environment = Record<string, string | undefined>;
type Fetcher = typeof globalThis.fetch;

export interface WhatsOnQueryOptions {
	eventWindow: {
		start: string;
		end: string;
	};
	fetcher?: Fetcher;
	env?: Environment;
	language?: 'th' | 'en';
}

const eventTypes: EventType[] = [
	{ id: '220fa93c-b15d-4d97-895a-bf73e40cf1af', name: 'Shows / trailers', colorName: 'Blue' },
	{ id: '860930d2-bade-42ca-b020-15e5862217f7', name: 'Ticket sale dates / official fan meets', colorName: 'Purple' },
	{ id: 'caab5484-da48-43c5-92f5-7e7febeaa4a1', name: 'Events to see the girls (free or paid)', colorName: 'Lavender' },
	{ id: 'bcf838d5-deb5-407b-b46d-56dd043a09b8', name: 'Birthdays', colorName: 'Grey' },
	{ id: 'a8de97d8-8766-4da0-8e88-54b9b485987b', name: 'Award-related', colorName: 'Green' },
	{ id: '73c07d67-7703-4ca1-bb20-009d4206bddb', name: 'Private events / photoshoots', colorName: 'Orange' },
	{ id: '5be2c351-352f-49e9-b425-8b4179221832', name: 'Susu stuff', colorName: 'Red' },
	{ id: '90d5508a-f1c6-4960-b563-eefabdcf43f9', name: 'Postponed / canceled', colorName: 'Yellow' }
];

class WhatsOnConfigError extends Error {}

export async function getWhatsOnData(options: WhatsOnQueryOptions): Promise<WhatsOnData> {
	const fetcher = options.fetcher ?? globalThis.fetch;
	const newsResult = await Promise.resolve().then(listPublishedNews).then(
		(value) => ({ status: 'fulfilled' as const, value }),
		(reason) => ({ status: 'rejected' as const, reason })
	);
	if (newsResult.status === 'rejected') reportFailure('news', newsResult.reason);
	let config: ReturnType<typeof getConfig>;

	try {
		config = getConfig(options.env ?? process.env);
	} catch (error) {
		reportFailure('configuration', error);
		return { news: newsResult.status === 'fulfilled' ? mapNews(newsResult.value, options.language) : [], eventTypes, events: [], sourceStatus: { news: newsResult.status === 'fulfilled' ? 'live' : 'unavailable', events: 'unavailable' } };
	}

	const eventsResult = await Promise.resolve().then(() => fetchEvents(config, options.eventWindow, fetcher)).then(
		(value) => ({ status: 'fulfilled' as const, value }),
		(reason) => ({ status: 'rejected' as const, reason })
	);
	if (eventsResult.status === 'rejected') reportFailure('events', eventsResult.reason);

	return {
		news: newsResult.status === 'fulfilled' ? mapNews(newsResult.value, options.language) : [],
		eventTypes,
		events: eventsResult.status === 'fulfilled' ? eventsResult.value : [],
		sourceStatus: {
			news: newsResult.status === 'fulfilled' ? 'live' : 'unavailable',
			events: eventsResult.status === 'fulfilled' ? 'live' : 'unavailable'
		}
	};
}

export async function getLatestNews(language: 'th' | 'en', limit = 5): Promise<NewsItem[]> {
	const rows = await listPublishedNews();
	return mapNews(rows, language).slice(0, limit);
}

function getConfig(env: Environment) {
	const rawBaseUrl = env.WHATS_ON_API_URL?.trim();
	const apiKey = env.WHATS_ON_API_KEY?.trim();
	if (!rawBaseUrl || !apiKey) {
		throw new WhatsOnConfigError('WHATS_ON_API_URL and WHATS_ON_API_KEY are required');
	}

	let baseUrl: URL;
	try {
		baseUrl = new URL(rawBaseUrl);
	} catch {
		throw new WhatsOnConfigError('WHATS_ON_API_URL is invalid');
	}
	if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) {
		throw new WhatsOnConfigError('WHATS_ON_API_URL must be an HTTPS URL without credentials');
	}

	return {
		baseUrl: baseUrl.toString().replace(/\/$/, ''),
		headers: {
			Accept: 'application/json',
			apikey: apiKey,
			Authorization: `Bearer ${apiKey}`
		}
	};
}

async function fetchEvents(
	config: ReturnType<typeof getConfig>,
	eventWindow: WhatsOnQueryOptions['eventWindow'],
	fetcher: Fetcher
): Promise<OrbitEvent[]> {
	validateWindow(eventWindow);
	const url = new URL(`${config.baseUrl}/rest/v1/events`);
	url.searchParams.set('select', EVENT_SELECT);
	url.searchParams.append('starts_at', `gte.${eventWindow.start}`);
	url.searchParams.append('starts_at', `lt.${eventWindow.end}`);
	url.searchParams.set('order', 'starts_at.asc');
	url.searchParams.set('limit', MAX_ROWS);

	const rows = await fetchRows(url, config.headers, fetcher, 'events');
	return rows
		.flatMap((row) => {
			const parsed = parseEvent(row);
			return parsed ? [parsed] : [];
		})
		.sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt));
}

async function fetchRows(
	url: URL,
	headers: Record<string, string>,
	fetcher: Fetcher,
	source: 'events'
): Promise<unknown[]> {
	const response = await fetcher(url, {
		headers,
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
	if (!response.ok) throw new Error(`${source} request failed with status ${response.status}`);

	const payload: unknown = await response.json();
	if (!Array.isArray(payload)) throw new Error(`${source} response was not an array`);
	return payload;
}

function mapNews(rows: Awaited<ReturnType<typeof listPublishedNews>>, language: 'th' | 'en' = 'en'): NewsItem[] {
	return rows.flatMap((item) => item.publishedAt ? [{
		id: item.id, slug: item.slug, headline: language === 'th' ? item.titleTh : item.titleEn,
		blurb: (language === 'th' ? item.contentTh : item.contentEn).slice(0, 220), coverImageUrl: item.coverImageUrl,
		sourceUrl: item.sourceUrl, sourceName: item.sourceName ?? (item.sourceUrl ? new URL(item.sourceUrl).hostname : 'GL-Orbit'),
		publishedDate: item.publishedAt.toISOString().slice(0, 10), status: 'approved' as const
	}] : []);
}

function parseEvent(value: unknown): OrbitEvent | null {
	if (!isRecord(value)) return null;
	const id = requiredText(value.event_id);
	const rawTitle = requiredText(value.title);
	const startsAt = isoTimestamp(value.starts_at);
	if (!id || !rawTitle || !startsAt || typeof value.all_day !== 'boolean') return null;

	const performer = optionalText(value.performer);
	const sourceTimezone = safeTimezone(value.source_timezone);
	const endsAt = isoTimestamp(value.ends_at);
	const startDateKey = dateKeyInTimezone(startsAt, sourceTimezone);
	const rawEndDateKey = endsAt ? dateKeyInTimezone(endsAt, sourceTimezone) : null;
	const endDateKey = inclusiveEndDateKey(startDateKey, rawEndDateKey, value.all_day);

	return {
		id,
		title: stripPerformerPrefix(rawTitle, performer),
		performer,
		fullTitle: optionalText(value.full_title) ?? rawTitle,
		dateKey: startDateKey,
		endDateKey,
		startsAt,
		endsAt,
		allDay: value.all_day,
		location: optionalText(value.location),
		eventTypeId: optionalText(value.event_type),
		sourceTimezone
	};
}

function validateWindow(window: WhatsOnQueryOptions['eventWindow']) {
	const start = Date.parse(window.start);
	const end = Date.parse(window.end);
	if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
		throw new Error('event query window is invalid');
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const text = value.trim();
	return text ? text : null;
}

function optionalText(value: unknown): string | null {
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isoTimestamp(value: unknown): string | null {
	const timestamp = optionalText(value);
	return timestamp && Number.isFinite(Date.parse(timestamp)) ? timestamp : null;
}

function dateKey(value: unknown): string | null {
	const key = optionalText(value);
	if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
	const date = new Date(`${key}T12:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key ? key : null;
}


function safeTimezone(value: unknown): string {
	const timezone = optionalText(value) ?? DEFAULT_TIMEZONE;
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
		return timezone;
	} catch {
		return DEFAULT_TIMEZONE;
	}
}

function dateKeyInTimezone(timestamp: string, timezone: string): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(new Date(timestamp));
	const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
	return `${value('year')}-${value('month')}-${value('day')}`;
}

function inclusiveEndDateKey(startDateKey: string, rawEndDateKey: string | null, allDay: boolean): string | null {
	if (!rawEndDateKey) return null;
	const inclusive = allDay ? shiftDateKey(rawEndDateKey, -1) : rawEndDateKey;
	return inclusive > startDateKey ? inclusive : null;
}

function shiftDateKey(dateKeyValue: string, amount: number): string {
	const date = new Date(`${dateKeyValue}T12:00:00Z`);
	date.setUTCDate(date.getUTCDate() + amount);
	return date.toISOString().slice(0, 10);
}

function stripPerformerPrefix(title: string, performer: string | null): string {
	if (!performer) return title;
	for (const prefix of [`${performer} |`, `${performer}|`]) {
		if (title.startsWith(prefix)) return title.slice(prefix.length).trim() || title;
	}
	return title;
}

function unavailableData(): WhatsOnData {
	return {
		news: [],
		eventTypes,
		events: [],
		sourceStatus: { news: 'unavailable', events: 'unavailable' }
	};
}

function reportFailure(source: 'configuration' | 'news' | 'events', error: unknown) {
	const detail = error instanceof Error ? error.message : 'UnknownError';
	console.error(`What's On ${source} source unavailable: ${detail}`);
}
