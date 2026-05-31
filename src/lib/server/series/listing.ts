import { and, asc, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { episodes, episodeSchedules, series, studios } from '$lib/server/db/schema.js';

export const SERIES_PAGE_LIMIT = 20;

export const SERIES_STATUSES = ['ALL', 'ONGOING', 'UPCOMING', 'ENDED'] as const;
export type SeriesStatusFilter = (typeof SERIES_STATUSES)[number];

export type SeriesListItem = {
	id: string;
	title: string;
	subtitle: string;
	poster: string;
	status: 'UPCOMING' | 'ONGOING' | 'ENDED';
	studio: string;
};

export type SeriesListResult = {
	items: SeriesListItem[];
	total: number;
	page: number;
	limit: number;
};

export type SeriesFilters = {
	search: string;
	status: SeriesStatusFilter;
};

export type SeriesSeoMeta = {
	title: string;
	description: string;
	robots: string;
	canonicalPath: string;
	ogTitle: string;
	ogDescription: string;
	jsonLd: string;
};

const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop';

const STATUS_FROM_URL: Record<string, SeriesStatusFilter> = {
	all: 'ALL',
	ongoing: 'ONGOING',
	upcoming: 'UPCOMING',
	ended: 'ENDED'
};

const STATUS_TO_URL: Record<SeriesStatusFilter, string> = {
	ALL: 'all',
	ONGOING: 'ongoing',
	UPCOMING: 'upcoming',
	ENDED: 'ended'
};

const STATUS_LABEL: Record<SeriesStatusFilter, string> = {
	ALL: 'ทั้งหมด',
	ONGOING: 'กำลังฉาย',
	UPCOMING: 'เร็วๆ นี้',
	ENDED: 'จบแล้ว'
};

function safeJsonLd(data: unknown): string {
	return JSON.stringify(data)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}

function normalizeSearch(value: string | null): string {
	return (value ?? '').trim().slice(0, 100);
}

export function parseSeriesFilters(searchParams: URLSearchParams): SeriesFilters {
	const rawStatus = (searchParams.get('status') ?? 'all').trim().toLowerCase();

	return {
		search: normalizeSearch(searchParams.get('search')),
		status: STATUS_FROM_URL[rawStatus] ?? 'ALL'
	};
}

export function parseSeriesPage(searchParams: URLSearchParams): number {
	const value = Number.parseInt(searchParams.get('page') ?? '1', 10);
	return Number.isFinite(value) ? Math.max(1, value) : 1;
}

export function buildSeriesSearchParams(filters: SeriesFilters): URLSearchParams {
	const params = new URLSearchParams();
	if (filters.search) params.set('search', filters.search);
	if (filters.status !== 'ALL') params.set('status', STATUS_TO_URL[filters.status]);
	return params;
}

function escapeLikePattern(input: string): string {
	return input.replace(/[\\%_]/g, '\\$&');
}

function buildSeriesConditions(filters: SeriesFilters) {
	const conditions = [isNull(series.deletedAt)];

	if (filters.status !== 'ALL') {
		conditions.push(eq(series.status, filters.status));
	}

	if (filters.search) {
		const pattern = `%${escapeLikePattern(filters.search)}%`;
		conditions.push(
			or(
				sql`${series.titleEn} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${series.titleTh} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${studios.name} ILIKE ${pattern} ESCAPE '\\'`
			)!
		);
	}

	return and(...conditions);
}

export async function getSeriesList(filters: SeriesFilters, page: number = 1): Promise<SeriesListResult> {
	const db = await getDb();
	const offset = (page - 1) * SERIES_PAGE_LIMIT;
	const where = buildSeriesConditions(filters);

	const [countResult] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(series)
		.leftJoin(studios, and(eq(series.studioId, studios.id), isNull(studios.deletedAt)))
		.where(where);

	const rows = await db
		.select({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			posterUrl: series.posterUrl,
			status: series.status,
			studioName: studios.name,
			firstAirDate: sql<Date | null>`MIN(${episodeSchedules.airDate})`
		})
		.from(series)
		.leftJoin(studios, and(eq(series.studioId, studios.id), isNull(studios.deletedAt)))
		.leftJoin(episodes, and(eq(series.id, episodes.seriesId), isNull(episodes.deletedAt)))
		.leftJoin(episodeSchedules, and(eq(episodes.id, episodeSchedules.episodeId), isNull(episodeSchedules.deletedAt)))
		.where(where)
		.groupBy(series.id, studios.name)
		.orderBy(
			sql`CASE 
				WHEN ${series.status} = 'ONGOING' THEN 1
				WHEN ${series.status} = 'ENDED' THEN 2
				WHEN ${series.status} = 'UPCOMING' THEN 3
				ELSE 4
			END`,
			desc(sql`MIN(${episodeSchedules.airDate})`),
			asc(series.titleEn)
		)
		.limit(SERIES_PAGE_LIMIT)
		.offset(offset);

	return {
		items: rows.map((item) => ({
			id: item.id,
			title: item.titleEn,
			subtitle: item.titleTh ?? '',
			poster: item.posterUrl ?? DEFAULT_POSTER,
			status: item.status,
			studio: item.studioName ?? 'ไม่ระบุสตูดิโอ'
		})),
		total: countResult?.count ?? 0,
		page,
		limit: SERIES_PAGE_LIMIT
	};
}

export function buildSeriesCacheKey(filters: SeriesFilters, page: number): string {
	return `api:series:search:${filters.search}:status:${filters.status}:page:${page}`;
}

export function buildSeriesSeoMeta(filters: SeriesFilters, items: SeriesListItem[], url: URL, page: number = 1): SeriesSeoMeta {
	const params = buildSeriesSearchParams(filters);
	if (page > 1) params.set('page', String(page));
	const query = params.toString();
	const canonicalPath = query ? `/series?${query}` : '/series';

	let title = 'ซีรีส์ GL ทั้งหมด | GL-Orbit';
	let description = 'รวมซีรีส์ Girls\' Love ทั้งหมดจากทั่วโลก พร้อมตารางฉายและข้อมูลครบถ้วน';

	if (filters.status !== 'ALL') {
		const label = STATUS_LABEL[filters.status];
		title = `ซีรีส์ GL ${label} | GL-Orbit`;
		description = `รวมซีรีส์ Girls' Love ${label} พร้อมตารางฉายและข้อมูลครบถ้วน`;
	}

	if (filters.search) {
		title = `ผลการค้นหา "${filters.search}" | GL-Orbit`;
		description = `ผลการค้นหาซีรีส์ Girls' Love สำหรับ "${filters.search}" บน GL-Orbit`;
	}

	const breadcrumb = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: `${url.origin}/` },
			{ '@type': 'ListItem', position: 2, name: 'ซีรีส์ทั้งหมด', item: `${url.origin}/series` }
		]
	};

	const schemas: unknown[] = [breadcrumb];

	if (!filters.search) {
		schemas.push({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			itemListElement: items.map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				item: {
					'@type': 'TVSeries',
					name: item.title,
					image: item.poster,
					url: `${url.origin}/series/${item.id}`,
					productionCompany: { '@type': 'Organization', name: item.studio }
				}
			}))
		});
	}

	return {
		title,
		description,
		robots: filters.search ? 'noindex, follow' : 'index, follow',
		canonicalPath,
		ogTitle: title,
		ogDescription: description,
		jsonLd: safeJsonLd(schemas)
	};
}
