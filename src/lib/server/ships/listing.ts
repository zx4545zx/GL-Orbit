import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb } from '$lib/server/db/index.js';
import { artists, shipSeries, ships } from '$lib/server/db/schema.js';

export const SHIPS_PAGE_LIMIT = 20;

export type ShipListItem = {
	id: string;
	slug: string;
	name: string;
	imageUrl: string;
	description: string;
	hashtags: string[];
	isFeatured: boolean;
	artist1: { id: string; name: string; imageUrl: string };
	artist2: { id: string; name: string; imageUrl: string };
	seriesCount: number;
};

export type ShipListResult = {
	items: ShipListItem[];
	total: number;
	page: number;
	limit: number;
};

export type ShipFilters = {
	search: string;
};

export type ShipSeoMeta = {
	title: string;
	description: string;
	robots: string;
	canonicalPath: string;
	jsonLd: string;
};

export const DEFAULT_SHIP_IMAGE = '/placeholders/poster.svg';
export const DEFAULT_ARTIST_IMAGE = '/placeholders/avatar.svg';

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

function escapeLikePattern(input: string): string {
	return input.replace(/[\\%_]/g, '\\$&');
}

export function parseShipFilters(searchParams: URLSearchParams): ShipFilters {
	return { search: normalizeSearch(searchParams.get('search')) };
}

export function parseShipPage(searchParams: URLSearchParams): number {
	const value = Number.parseInt(searchParams.get('page') ?? '1', 10);
	return Number.isFinite(value) ? Math.max(1, value) : 1;
}

export function buildShipSearchParams(filters: ShipFilters): URLSearchParams {
	const params = new URLSearchParams();
	if (filters.search) params.set('search', filters.search);
	return params;
}

function buildShipConditions(filters: ShipFilters, artist1 = alias(artists, 'ship_artist_1'), artist2 = alias(artists, 'ship_artist_2')) {
	const conditions = [eq(ships.isPublished, true)];

	if (filters.search) {
		const pattern = `%${escapeLikePattern(filters.search)}%`;
		conditions.push(
			or(
				ilike(ships.name, pattern),
				sql`${artist1.nickname} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${artist1.fullNameEn} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${artist1.fullNameTh} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${artist2.nickname} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${artist2.fullNameEn} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${artist2.fullNameTh} ILIKE ${pattern} ESCAPE '\\'`
			)!
		);
	}

	return and(...conditions);
}

export async function getShipList(filters: ShipFilters, page: number = 1): Promise<ShipListResult> {
	const db = await getDb();
	const offset = (page - 1) * SHIPS_PAGE_LIMIT;
	const artist1 = alias(artists, 'ship_artist_1');
	const artist2 = alias(artists, 'ship_artist_2');
	const where = buildShipConditions(filters, artist1, artist2);

	const [countResult] = await db
		.select({ count: sql<number>`count(distinct ${ships.id})::int` })
		.from(ships)
		.innerJoin(artist1, and(eq(ships.artist1Id, artist1.id), isNull(artist1.deletedAt)))
		.innerJoin(artist2, and(eq(ships.artist2Id, artist2.id), isNull(artist2.deletedAt)))
		.where(where);

	const rows = await db
		.select({
			id: ships.id,
			slug: ships.slug,
			name: ships.name,
			imageUrl: ships.imageUrl,
			description: ships.description,
			hashtags: ships.hashtags,
			isFeatured: ships.isFeatured,
			createdAt: ships.createdAt,
			artist1Id: artist1.id,
			artist1Nickname: artist1.nickname,
			artist1FullNameEn: artist1.fullNameEn,
			artist1ImageUrl: artist1.profileImageUrl,
			artist2Id: artist2.id,
			artist2Nickname: artist2.nickname,
			artist2FullNameEn: artist2.fullNameEn,
			artist2ImageUrl: artist2.profileImageUrl,
			seriesCount: sql<number>`count(distinct ${shipSeries.seriesId})::int`
		})
		.from(ships)
		.innerJoin(artist1, and(eq(ships.artist1Id, artist1.id), isNull(artist1.deletedAt)))
		.innerJoin(artist2, and(eq(ships.artist2Id, artist2.id), isNull(artist2.deletedAt)))
		.leftJoin(shipSeries, eq(ships.id, shipSeries.shipId))
		.where(where)
		.groupBy(ships.id, artist1.id, artist2.id)
		.orderBy(desc(ships.isFeatured), desc(ships.createdAt), asc(ships.name))
		.limit(SHIPS_PAGE_LIMIT)
		.offset(offset);

	return {
		items: rows.map((row) => ({
			id: row.id,
			slug: row.slug,
			name: row.name,
			imageUrl: row.imageUrl ?? DEFAULT_SHIP_IMAGE,
			description: row.description ?? '',
			hashtags: row.hashtags ?? [],
			isFeatured: row.isFeatured,
			artist1: {
				id: row.artist1Id,
				name: row.artist1Nickname || row.artist1FullNameEn,
				imageUrl: row.artist1ImageUrl ?? DEFAULT_ARTIST_IMAGE
			},
			artist2: {
				id: row.artist2Id,
				name: row.artist2Nickname || row.artist2FullNameEn,
				imageUrl: row.artist2ImageUrl ?? DEFAULT_ARTIST_IMAGE
			},
			seriesCount: row.seriesCount
		})),
		total: countResult?.count ?? 0,
		page,
		limit: SHIPS_PAGE_LIMIT
	};
}

export function buildShipCacheKey(filters: ShipFilters, page: number, scope: 'ships' | 'explore' = 'ships'): string {
	return `api:${scope}:ships:search:${filters.search}:page:${page}`;
}

export function buildShipSeoMeta(filters: ShipFilters, items: ShipListItem[], url: URL, page: number = 1): ShipSeoMeta {
	const params = buildShipSearchParams(filters);
	if (page > 1) params.set('page', String(page));
	const query = params.toString();
	const canonicalPath = query ? `/ships?${query}` : '/ships';

	const title = filters.search ? `ผลการค้นหา "${filters.search}" | GL-Orbit` : 'Ships คู่จิ้น GL | GL-Orbit';
	const description = filters.search
		? `ผลการค้นหา Ships คู่จิ้น GL สำหรับ "${filters.search}" บน GL-Orbit`
		: 'รวม Ships คู่จิ้น GL พร้อมข้อมูลศิลปินและผลงานร่วมกัน';

	const jsonLd = safeJsonLd({
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'Thing',
				name: item.name,
				image: item.imageUrl,
				url: `${url.origin}/ships/${item.slug}`
			}
		}))
	});

	return {
		title,
		description,
		robots: filters.search ? 'noindex, follow' : 'index, follow',
		canonicalPath,
		jsonLd
	};
}
