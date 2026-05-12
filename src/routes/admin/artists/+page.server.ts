import type { Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { artists } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const nickname = formData.get('nickname')?.toString().trim() ?? '';
		const fullName = formData.get('fullName')?.toString().trim() || null;
		const profileImageUrl = formData.get('profileImageUrl')?.toString().trim() || null;

		if (!nickname) {
			return fail(400, { error: 'กรุณากรอกชื่อเล่น' });
		}

		const db = await getDb();
		await db.insert(artists).values({ nickname, fullName, profileImageUrl });

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const nickname = formData.get('nickname')?.toString().trim() ?? '';
		const fullName = formData.get('fullName')?.toString().trim() || null;
		const profileImageUrl = formData.get('profileImageUrl')?.toString().trim() || null;

		if (!id || !nickname) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.update(artists)
			.set({ nickname, fullName, profileImageUrl })
			.where(eq(artists.id, id));

		return { success: true };
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
		await db.update(artists)
			.set({ deletedAt: new Date() })
			.where(eq(artists.id, id));

		return { success: true };
	}
};
