import { json, error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { seriesGalleryImages } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const db = await getDb();
	await db
		.delete(seriesGalleryImages)
		.where(and(eq(seriesGalleryImages.id, params.imageId), eq(seriesGalleryImages.seriesId, params.id)));

	return json({ success: true });
};
