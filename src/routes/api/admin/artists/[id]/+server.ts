import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { artists } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;
	const body = await request.json();
	const nickname = body.nickname?.trim();
	if (!nickname) {
		error(400, 'กรุณาระบุชื่อเล่น');
	}

	const fullNameEn = body.fullNameEn?.trim();
	if (!fullNameEn) {
		error(400, 'กรุณาระบุชื่อเต็ม (EN)');
	}

	const fullNameTh = body.fullNameTh?.trim() || null;
	const profileImageUrl = body.profileImageUrl?.trim() || null;

	const db = await getDb();

	const [updated] = await db
		.update(artists)
		.set({
			nickname,
			fullNameTh,
			fullNameEn,
			profileImageUrl
		})
		.where(eq(artists.id, id))
		.returning({
			id: artists.id,
			nickname: artists.nickname,
			fullNameTh: artists.fullNameTh,
			fullNameEn: artists.fullNameEn,
			profileImageUrl: artists.profileImageUrl
		});

	if (!updated) {
		error(404, 'ไม่พบข้อมูลศิลปิน');
	}

	return json(updated);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;

	const db = await getDb();

	const [deleted] = await db
		.update(artists)
		.set({ deletedAt: new Date() })
		.where(eq(artists.id, id))
		.returning({
			id: artists.id
		});

	if (!deleted) {
		error(404, 'ไม่พบข้อมูลศิลปิน');
	}

	return json({ success: true });
};
