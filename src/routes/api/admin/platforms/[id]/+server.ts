import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { platforms } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;
	if (!id) {
		error(400, 'ไม่พบ ID');
	}

	const body = await request.json();
	const { name, logoUrl, baseUrl } = body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		error(400, 'กรุณาระบุชื่อแพลตฟอร์ม');
	}

	const db = await getDb();

	const [platform] = await db
		.update(platforms)
		.set({
			name: name.trim(),
			...(logoUrl !== undefined ? { logoUrl } : {}),
			...(baseUrl !== undefined ? { baseUrl } : {}),
		})
		.where(eq(platforms.id, id))
		.returning();

	if (!platform) {
		error(404, 'ไม่พบแพลตฟอร์ม');
	}

	return json({ data: platform });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;
	if (!id) {
		error(400, 'ไม่พบ ID');
	}

	const db = await getDb();

	const [platform] = await db
		.update(platforms)
		.set({ deletedAt: new Date() })
		.where(eq(platforms.id, id))
		.returning();

	if (!platform) {
		error(404, 'ไม่พบแพลตฟอร์ม');
	}

	return json({ data: platform });
};
