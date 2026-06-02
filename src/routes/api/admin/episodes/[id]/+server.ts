import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { episodes } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;
	if (!id) {
		error(400, 'ไม่พบรายการที่ต้องการแก้ไข');
	}

	const body = await request.json();
	const seriesId = body.seriesId?.toString() ?? '';
	const episodeNumber = parseInt(body.episodeNumber?.toString() ?? '0', 10);
	const title = body.title?.toString().trim() || null;
	const coverUrl = body.coverUrl?.toString().trim() || null;
	const trailerUrl = body.trailerUrl?.toString().trim() || null;

	if (!seriesId || episodeNumber < 1) {
		error(400, 'กรุณากรอกข้อมูลให้ครบถ้วน');
	}

	const db = await getDb();
	await db.update(episodes)
		.set({ seriesId, episodeNumber, title, coverUrl, trailerUrl })
		.where(eq(episodes.id, id));

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;
	if (!id) {
		error(400, 'ไม่พบรายการที่ต้องการลบ');
	}

	const db = await getDb();
	await db.update(episodes)
		.set({ deletedAt: new Date() })
		.where(eq(episodes.id, id));

	return json({ success: true });
};
