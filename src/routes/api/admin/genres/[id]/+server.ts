import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { genres } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const id = params.id;
	const body = await request.json();
	const { name } = body;

	if (!name) {
		return json({ success: false, error: 'กรุณากรอกชื่อประเภท' }, { status: 400 });
	}

	const db = await getDb();

	try {
		const [updated] = await db.update(genres).set({ name }).where(eq(genres.id, id)).returning({ id: genres.id, name: genres.name });
		return json({ success: true, data: updated });
	} catch (err: unknown) {
		if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
			return json({ success: false, error: 'ประเภทนี้มีอยู่แล้ว' }, { status: 400 });
		}
		throw err;
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const id = params.id;
	const db = await getDb();
	await db.delete(genres).where(eq(genres.id, id));

	return json({ success: true });
};
