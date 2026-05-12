import type { Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { studios } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const logoUrl = formData.get('logoUrl')?.toString().trim() || null;
		const officialSite = formData.get('officialSite')?.toString().trim() || null;

		if (!name) {
			return fail(400, { error: 'กรุณากรอกชื่อสตูดิโอ' });
		}

		const db = await getDb();
		await db.insert(studios).values({
			name,
			logoUrl,
			officialSite,
			createdBy: locals.user.id
		});

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const name = formData.get('name')?.toString().trim() ?? '';
		const logoUrl = formData.get('logoUrl')?.toString().trim() || null;
		const officialSite = formData.get('officialSite')?.toString().trim() || null;

		if (!id || !name) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.update(studios)
			.set({ name, logoUrl, officialSite, updatedAt: new Date() })
			.where(eq(studios.id, id));

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
		await db.update(studios)
			.set({ deletedAt: new Date() })
			.where(eq(studios.id, id));

		return { success: true };
	}
};
