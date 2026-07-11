import { error, json } from '@sveltejs/kit';
import { asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { artists, shipSeries, ships } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

type ShipInput = {
	name?: string;
	slug?: string;
	artist1Id?: string;
	artist2Id?: string;
	imageUrl?: string;
	description?: string;
	startedAt?: string | null;
	hashtags?: string[] | string;
	isFeatured?: boolean;
	isPublished?: boolean;
	seriesIds?: string[];
};

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'ADMIN') error(403, 'ไม่มีสิทธิ์เข้าถึง');
}

function normalizeSlug(value: string): string {
	return value.trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 255);
}

function normalizeHashtags(value: ShipInput['hashtags']): string[] {
	if (Array.isArray(value)) return value.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 20);
	return (value ?? '').split(',').map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 20);
}

function buildPairKey(artist1Id: string, artist2Id: string): string {
	return [artist1Id, artist2Id].sort().join(':');
}

async function validateShipInput(body: ShipInput, existingId?: string) {
	const name = body.name?.trim() ?? '';
	const slug = normalizeSlug(body.slug?.trim() || name);
	const artist1Id = body.artist1Id?.trim() ?? '';
	const artist2Id = body.artist2Id?.trim() ?? '';

	if (!name) return { ok: false as const, error: 'กรุณากรอกชื่อ Ship' };
	if (!slug) return { ok: false as const, error: 'กรุณากรอก slug หรือชื่อ Ship ที่สร้าง slug ได้' };
	if (!artist1Id || !artist2Id) return { ok: false as const, error: 'กรุณาเลือกศิลปินให้ครบ 2 คน' };
	if (artist1Id === artist2Id) return { ok: false as const, error: 'ศิลปินทั้งสองคนต้องไม่ซ้ำกัน' };

	const db = await getDb();
	const pairKey = buildPairKey(artist1Id, artist2Id);

	const [slugConflict] = await db.select({ id: ships.id }).from(ships).where(eq(ships.slug, slug)).limit(1);
	if (slugConflict && slugConflict.id !== existingId) return { ok: false as const, error: 'slug นี้ถูกใช้แล้ว' };

	const [pairConflict] = await db.select({ id: ships.id }).from(ships).where(eq(ships.pairKey, pairKey)).limit(1);
	if (pairConflict && pairConflict.id !== existingId) return { ok: false as const, error: 'คู่ศิลปินนี้มีอยู่แล้ว' };

	return {
		ok: true as const,
		data: {
			name,
			slug,
			artist1Id,
			artist2Id,
			pairKey,
			imageUrl: body.imageUrl?.trim() || null,
			description: body.description?.trim() || null,
			startedAt: body.startedAt ? new Date(body.startedAt) : null,
			hashtags: normalizeHashtags(body.hashtags),
			isFeatured: Boolean(body.isFeatured),
			isPublished: Boolean(body.isPublished),
			seriesIds: Array.isArray(body.seriesIds) ? body.seriesIds.filter(Boolean) : []
		}
	};
}

export const GET: RequestHandler = async ({ locals, url }) => {
	requireAdmin(locals);
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(1000, Number.parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const search = (url.searchParams.get('search') ?? '').trim();
	const offset = (page - 1) * limit;
	const db = await getDb();
	const where = search ? or(ilike(ships.name, `%${search}%`), ilike(ships.slug, `%${search}%`)) : undefined;

	const rows = await db
		.select({
			id: ships.id,
			name: ships.name,
			slug: ships.slug,
			imageUrl: ships.imageUrl,
			isFeatured: ships.isFeatured,
			isPublished: ships.isPublished,
			artist1Id: ships.artist1Id,
			artist2Id: ships.artist2Id,
			createdAt: ships.createdAt
		})
		.from(ships)
		.where(where)
		.orderBy(asc(ships.name))
		.limit(limit)
		.offset(offset);

	const artistIds = [...new Set(rows.flatMap((row) => [row.artist1Id, row.artist2Id]))];
	const artistRows = artistIds.length
		? await db.select({ id: artists.id, nickname: artists.nickname, fullNameEn: artists.fullNameEn }).from(artists).where(inArray(artists.id, artistIds))
		: [];
	const artistMap = new Map(artistRows.map((artist) => [artist.id, artist.nickname || artist.fullNameEn]));
	const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(ships).where(where);

	return json({
		data: rows.map((row) => ({
			...row,
			artist1Name: artistMap.get(row.artist1Id) ?? 'ไม่พบศิลปิน',
			artist2Name: artistMap.get(row.artist2Id) ?? 'ไม่พบศิลปิน'
		})),
		page,
		limit,
		total: count,
		totalPages: Math.ceil(count / limit)
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals);
	const body = await request.json() as ShipInput;
	const validated = await validateShipInput(body);
	if (!validated.ok) return json({ success: false, error: validated.error }, { status: 400 });

	const db = await getDb();
	const { seriesIds, ...shipData } = validated.data;
	const [inserted] = await db.insert(ships).values(shipData).returning();

	if (seriesIds.length > 0) {
		await db.insert(shipSeries).values(seriesIds.map((seriesId, index) => ({ shipId: inserted.id, seriesId, sortOrder: index })));
	}

	return json({ success: true, data: inserted }, { status: 201 });
};
