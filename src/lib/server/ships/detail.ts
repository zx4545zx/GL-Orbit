import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb } from '$lib/server/db/index.js';
import { artists, series, shipSeries, ships } from '$lib/server/db/schema.js';
import { DEFAULT_ARTIST_IMAGE, DEFAULT_SHIP_IMAGE } from './listing.js';

export type ShipDetail = {
	id: string;
	slug: string;
	name: string;
	imageUrl: string;
	hasImage: boolean;
	description: string;
	startedAt: Date | null;
	hashtags: string[];
	isFeatured: boolean;
	artist1: { id: string; name: string; fullNameEn: string; fullNameTh: string; imageUrl: string };
	artist2: { id: string; name: string; fullNameEn: string; fullNameTh: string; imageUrl: string };
	series: { id: string; title: string; titleTh: string; posterUrl: string; status: 'UPCOMING' | 'ONGOING' | 'ENDED' }[];
};

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function safeJsonLd(data: unknown): string {
	return JSON.stringify(data)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}

export async function getShipDetail(identifier: string): Promise<ShipDetail | null> {
	const db = await getDb();
	const artist1 = alias(artists, 'ship_detail_artist_1');
	const artist2 = alias(artists, 'ship_detail_artist_2');
	const lookup = isUuid(identifier) ? or(eq(ships.id, identifier), eq(ships.slug, identifier)) : eq(ships.slug, identifier);

	const [row] = await db
		.select({
			id: ships.id,
			slug: ships.slug,
			name: ships.name,
			imageUrl: ships.imageUrl,
			description: ships.description,
			startedAt: ships.startedAt,
			hashtags: ships.hashtags,
			isFeatured: ships.isFeatured,
			artist1Id: artist1.id,
			artist1Nickname: artist1.nickname,
			artist1FullNameEn: artist1.fullNameEn,
			artist1FullNameTh: artist1.fullNameTh,
			artist1ImageUrl: artist1.profileImageUrl,
			artist2Id: artist2.id,
			artist2Nickname: artist2.nickname,
			artist2FullNameEn: artist2.fullNameEn,
			artist2FullNameTh: artist2.fullNameTh,
			artist2ImageUrl: artist2.profileImageUrl
		})
		.from(ships)
		.innerJoin(artist1, and(eq(ships.artist1Id, artist1.id), isNull(artist1.deletedAt)))
		.innerJoin(artist2, and(eq(ships.artist2Id, artist2.id), isNull(artist2.deletedAt)))
		.where(and(eq(ships.isPublished, true), lookup))
		.limit(1);

	if (!row) return null;

	const seriesRows = await db
		.select({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			posterUrl: series.posterUrl,
			status: series.status,
			sortOrder: shipSeries.sortOrder
		})
		.from(shipSeries)
		.innerJoin(series, and(eq(shipSeries.seriesId, series.id), isNull(series.deletedAt)))
		.where(eq(shipSeries.shipId, row.id))
		.orderBy(asc(shipSeries.sortOrder), asc(series.titleEn));

	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		imageUrl: row.imageUrl ?? DEFAULT_SHIP_IMAGE,
		hasImage: Boolean(row.imageUrl),
		description: row.description ?? '',
		startedAt: row.startedAt,
		hashtags: row.hashtags ?? [],
		isFeatured: row.isFeatured,
		artist1: {
			id: row.artist1Id,
			name: row.artist1Nickname || row.artist1FullNameEn,
			fullNameEn: row.artist1FullNameEn,
			fullNameTh: row.artist1FullNameTh ?? '',
			imageUrl: row.artist1ImageUrl ?? DEFAULT_ARTIST_IMAGE
		},
		artist2: {
			id: row.artist2Id,
			name: row.artist2Nickname || row.artist2FullNameEn,
			fullNameEn: row.artist2FullNameEn,
			fullNameTh: row.artist2FullNameTh ?? '',
			imageUrl: row.artist2ImageUrl ?? DEFAULT_ARTIST_IMAGE
		},
		series: seriesRows.map((item) => ({
			id: item.id,
			title: item.titleEn,
			titleTh: item.titleTh ?? '',
			posterUrl: item.posterUrl ?? '/placeholders/poster.svg',
			status: item.status
		}))
	};
}

export function buildShipDetailSeo(ship: ShipDetail, origin: string) {
	const description = ship.description || `${ship.name} บน GL-Orbit พร้อมข้อมูลศิลปินและผลงานร่วมกัน`;
	return {
		title: `${ship.name} | Ships GL-Orbit`,
		description,
		canonicalPath: `/ships/${ship.slug}`,
		jsonLd: safeJsonLd({
			'@context': 'https://schema.org',
			'@type': 'ProfilePage',
			name: ship.name,
			description,
			image: ship.imageUrl,
			url: `${origin}/ships/${ship.slug}`
		})
	};
}
