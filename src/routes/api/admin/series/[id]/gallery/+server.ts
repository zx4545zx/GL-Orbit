import { json, error } from '@sveltejs/kit';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { series, seriesGalleryImages } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

async function requireSeries(id: string) {
	const db = await getDb();
	const [row] = await db
		.select({ id: series.id })
		.from(series)
		.where(and(eq(series.id, id), isNull(series.deletedAt)))
		.limit(1);

	if (!row) {
		error(404, 'ไม่พบซีรีส์');
	}

	return db;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const db = await requireSeries(params.id);
	const data = await db
		.select({
			id: seriesGalleryImages.id,
			seriesId: seriesGalleryImages.seriesId,
			imageUrl: seriesGalleryImages.imageUrl,
			caption: seriesGalleryImages.caption,
			sortOrder: seriesGalleryImages.sortOrder,
			createdAt: seriesGalleryImages.createdAt
		})
		.from(seriesGalleryImages)
		.where(eq(seriesGalleryImages.seriesId, params.id))
		.orderBy(asc(seriesGalleryImages.sortOrder), asc(seriesGalleryImages.createdAt));

	return json({ success: true, data });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
	const caption = typeof body.caption === 'string' && body.caption.trim() ? body.caption.trim() : null;

	if (!imageUrl) {
		return json({ success: false, error: 'กรุณาเลือกรูปภาพ' }, { status: 400 });
	}

	const db = await requireSeries(params.id);
	const [{ maxOrder }] = await db
		.select({ maxOrder: sql<number>`coalesce(max(${seriesGalleryImages.sortOrder}), -1)::int` })
		.from(seriesGalleryImages)
		.where(eq(seriesGalleryImages.seriesId, params.id));

	const [inserted] = await db
		.insert(seriesGalleryImages)
		.values({
			seriesId: params.id,
			imageUrl,
			caption,
			sortOrder: maxOrder + 1
		})
		.returning({
			id: seriesGalleryImages.id,
			seriesId: seriesGalleryImages.seriesId,
			imageUrl: seriesGalleryImages.imageUrl,
			caption: seriesGalleryImages.caption,
			sortOrder: seriesGalleryImages.sortOrder,
			createdAt: seriesGalleryImages.createdAt
		});

	return json({ success: true, data: inserted }, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json();
	const imageIds = Array.isArray(body.imageIds) ? body.imageIds.filter((id: unknown): id is string => typeof id === 'string') : [];

	if (imageIds.length === 0) {
		return json({ success: false, error: 'ไม่มีรายการรูปภาพสำหรับจัดเรียง' }, { status: 400 });
	}

	const db = await requireSeries(params.id);
	await Promise.all(
		imageIds.map((imageId: string, sortOrder: number) =>
			db
				.update(seriesGalleryImages)
				.set({ sortOrder })
				.where(and(eq(seriesGalleryImages.id, imageId), eq(seriesGalleryImages.seriesId, params.id)))
		)
	);

	return json({ success: true });
};
