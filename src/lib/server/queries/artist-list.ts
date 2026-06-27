import { and, asc, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { artists, seriesArtists, series } from '$lib/server/db/schema.js';

export const ARTIST_PAGE_LIMIT = 24;

export type ArtistListItem = {
	id: string;
	nickname: string;
	fullNameTh: string | null;
	fullNameEn: string;
	profileImageUrl: string;
	seriesCount: number;
};

export type ArtistListResult = {
	items: ArtistListItem[];
	total: number;
	page: number;
	limit: number;
};

export type ArtistFilters = {
	search: string;
};

export type ArtistSeoMeta = {
	title: string;
	description: string;
	robots: string;
	canonicalPath: string;
	ogTitle: string;
	ogDescription: string;
	jsonLd: string;
};

const FALLBACK_AVATAR = '/placeholders/avatar.svg';

function normalizeSearch(value: string | null): string {
	return (value ?? '').trim().slice(0, 100);
}

export function parseArtistFilters(searchParams: URLSearchParams): ArtistFilters {
	return {
		search: normalizeSearch(searchParams.get('search'))
	};
}

export function parseArtistPage(searchParams: URLSearchParams): number {
	const value = Number.parseInt(searchParams.get('page') ?? '1', 10);
	return Number.isFinite(value) ? Math.max(1, value) : 1;
}

export function buildArtistSearchParams(filters: ArtistFilters): URLSearchParams {
	const params = new URLSearchParams();
	if (filters.search) params.set('search', filters.search);
	return params;
}

function safeJsonLd(data: unknown): string {
	return JSON.stringify(data)
		.replace(/</g, '\u003c')
		.replace(/>/g, '\u003e')
		.replace(/&/g, '\u0026')
		.replace(/\u2028/g, '\u2028')
		.replace(/\u2029/g, '\u2029');
}

function escapeLikePattern(input: string): string {
	return input.replace(/[\\%_]/g, '\\$&');
}

function buildArtistConditions(filters: ArtistFilters) {
	const conditions = [isNull(artists.deletedAt)];

	if (filters.search) {
		const pattern = `%${escapeLikePattern(filters.search)}%`;
		conditions.push(
			or(
				sql`${artists.nickname} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${artists.fullNameEn} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${artists.fullNameTh} ILIKE ${pattern} ESCAPE '\\'`
			)!
		);
	}

	return and(...conditions);
}

export async function getArtistList(filters: ArtistFilters, page: number = 1): Promise<ArtistListResult> {
	const db = await getDb();
	const offset = (page - 1) * ARTIST_PAGE_LIMIT;
	const where = buildArtistConditions(filters);

	// Profile rows for the current page.
	const rows = await db
		.select({
			id: artists.id,
			nickname: artists.nickname,
			fullNameTh: artists.fullNameTh,
			fullNameEn: artists.fullNameEn,
			profileImageUrl: artists.profileImageUrl
		})
		.from(artists)
		.where(where)
		.orderBy(asc(artists.nickname), asc(artists.fullNameEn))
		.limit(ARTIST_PAGE_LIMIT)
		.offset(offset);

	// Total count for pagination UI.
	const [countResult] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(artists)
		.where(where);

	// Series count per artist — only for the artists on this page (avoids a full join/group).
	const artistIds = rows.map((r) => r.id);
	const countRows = artistIds.length > 0
		? await db
			.select({
				artistId: seriesArtists.artistId,
				count: sql<number>`count(*)::int`
			})
			.from(seriesArtists)
			.innerJoin(series, eq(seriesArtists.seriesId, series.id))
			.where(and(inArray(seriesArtists.artistId, artistIds), isNull(series.deletedAt), ne(series.status, sql`'UPCOMING'`)))
			.groupBy(seriesArtists.artistId)
		: [];

	const countMap = new Map<string, number>();
	for (const cr of countRows) {
		countMap.set(cr.artistId, cr.count);
	}

	return {
		items: rows.map((item) => ({
			id: item.id,
			nickname: item.nickname,
			fullNameTh: item.fullNameTh ?? null,
			fullNameEn: item.fullNameEn,
			profileImageUrl: item.profileImageUrl ?? FALLBACK_AVATAR,
			seriesCount: countMap.get(item.id) ?? 0
		})),
		total: countResult?.count ?? 0,
		page,
		limit: ARTIST_PAGE_LIMIT
	};
}

export function buildArtistSeoMeta(filters: ArtistFilters, items: ArtistListItem[], url: URL, page: number = 1): ArtistSeoMeta {
	const params = buildArtistSearchParams(filters);
	if (page > 1) params.set('page', String(page));
	const query = params.toString();
	const canonicalPath = query ? `/artists?${query}` : '/artists';

	let title = 'นักแสดงซีรีส์ GL ทั้งหมด | GL-Orbit';
	let description = 'รวมนักแสดงซีรีส์ Girls\' Love พร้อมผลงานและโซเชียลมีเดีย';

	if (filters.search) {
		title = `ผลการค้นหานักแสดง "${filters.search}" | GL-Orbit`;
		description = `ผลการค้นหานักแสดงซีรีส์ Girls' Love สำหรับ "${filters.search}" บน GL-Orbit`;
	}

	const breadcrumb = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: `${url.origin}/` },
			{ '@type': 'ListItem', position: 2, name: 'นักแสดง', item: `${url.origin}/artists` }
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
				url: `${url.origin}/artists/${item.id}`,
				name: item.nickname
			}))
		});
	}

	return {
		title,
		description,
		robots: 'index, follow',
		canonicalPath,
		ogTitle: title,
		ogDescription: description,
		jsonLd: safeJsonLd(schemas.length === 1 ? schemas[0] : schemas)
	};
}
