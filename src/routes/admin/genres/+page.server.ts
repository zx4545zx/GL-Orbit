import type { Actions, PageServerLoad } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { genres } from '$lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return { genres: [] };
	}

	const db = await getDb();
	const allGenres = await db
		.select({ id: genres.id, name: genres.name })
		.from(genres)
		.orderBy(asc(genres.name));

	return { genres: allGenres };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';

		if (!name) {
			return fail(400, { error: 'กรุณากรอกชื่อประเภท' });
		}

		const db = await getDb();
		try {
			await db.insert(genres).values({ name });
			return { success: true };
		} catch {
			return fail(400, { error: 'ประเภทนี้มีอยู่แล้ว' });
		}
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const name = formData.get('name')?.toString().trim() ?? '';

		if (!id || !name) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		try {
			await db.update(genres).set({ name }).where(eq(genres.id, id));
			return { success: true };
		} catch {
			return fail(400, { error: 'ประเภทนี้มีอยู่แล้ว' });
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';

		if (!id) {
			return fail(400, { error: 'ไม่พบรายการที่ต้องการลบ' });
		}

		const db = await getDb();
		await db.delete(genres).where(eq(genres.id, id));
		return { success: true };
	}
};