import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { shipSeries, ships } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'ADMIN') error(403, 'ไม่มีสิทธิ์เข้าถึง');
}

function normalizeSlug(value: string): string {
	return value.trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 255);
}

function normalizeHashtags(value: string[] | string | undefined): string[] {
	if (Array.isArray(value)) return value.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 20);
	return (value ?? '').split(',').map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 20);
}

function buildPairKey(artist1Id: string, artist2Id: string): string {
	return [artist1Id, artist2Id].sort().join(':');
}

export const GET: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);
	const db = await getDb();
	const [ship] = await db.select().from(ships).where(eq(ships.id, params.id)).limit(1);
	if (!ship) error(404, 'ไม่พบ Ship');

	const relations = await db.select({ seriesId: shipSeries.seriesId }).from(shipSeries).where(eq(shipSeries.shipId, params.id));
	return json({ success: true, data: { ...ship, seriesIds: relations.map((item) => item.seriesId) } });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);
	const body = await request.json();
	const name = body.name?.trim() ?? '';
	const slug = normalizeSlug(body.slug?.trim() || name);
	const artist1Id = body.artist1Id?.trim() ?? '';
	const artist2Id = body.artist2Id?.trim() ?? '';

	if (!name) return json({ success: false, error: 'กรุณากรอกชื่อ Ship' }, { status: 400 });
	if (!slug) return json({ success: false, error: 'กรุณากรอก slug หรือชื่อ Ship ที่สร้าง slug ได้' }, { status: 400 });
	if (!artist1Id || !artist2Id) return json({ success: false, error: 'กรุณาเลือกศิลปินให้ครบ 2 คน' }, { status: 400 });
	if (artist1Id === artist2Id) return json({ success: false, error: 'ศิลปินทั้งสองคนต้องไม่ซ้ำกัน' }, { status: 400 });

	const db = await getDb();
	const [existing] = await db.select({ id: ships.id }).from(ships).where(eq(ships.id, params.id)).limit(1);
	if (!existing) error(404, 'ไม่พบ Ship');

	const pairKey = buildPairKey(artist1Id, artist2Id);
	const [slugConflict] = await db.select({ id: ships.id }).from(ships).where(eq(ships.slug, slug)).limit(1);
	if (slugConflict && slugConflict.id !== params.id) return json({ success: false, error: 'slug นี้ถูกใช้แล้ว' }, { status: 400 });
	const [pairConflict] = await db.select({ id: ships.id }).from(ships).where(eq(ships.pairKey, pairKey)).limit(1);
	if (pairConflict && pairConflict.id !== params.id) return json({ success: false, error: 'คู่ศิลปินนี้มีอยู่แล้ว' }, { status: 400 });

	const [updated] = await db.update(ships)
		.set({
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
			updatedAt: new Date()
		})
		.where(eq(ships.id, params.id))
		.returning();

	await db.delete(shipSeries).where(eq(shipSeries.shipId, params.id));
	const seriesIds = Array.isArray(body.seriesIds) ? body.seriesIds.filter(Boolean) : [];
	if (seriesIds.length > 0) {
		await db.insert(shipSeries).values(seriesIds.map((seriesId: string, index: number) => ({ shipId: params.id, seriesId, sortOrder: index })));
	}

	return json({ success: true, data: updated });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);
	const db = await getDb();
	await db.delete(ships).where(eq(ships.id, params.id));
	return json({ success: true });
};
