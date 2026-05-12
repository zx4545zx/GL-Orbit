import type { Actions, PageServerLoad } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series, studios } from '$lib/server/db/schema.js';
import { eq, isNull, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return { studios: [] };
	}

	const db = await getDb();
	const allStudios = await db
		.select({ id: studios.id, name: studios.name })
		.from(studios)
		.where(isNull(studios.deletedAt))
		.orderBy(asc(studios.name));

	return { studios: allStudios };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const titleEn = formData.get('titleEn')?.toString().trim() ?? '';
		const titleTh = formData.get('titleTh')?.toString().trim() || null;
		const studioId = formData.get('studioId')?.toString() || null;
		const posterUrl = formData.get('posterUrl')?.toString().trim() || null;
		const status = formData.get('status')?.toString() ?? 'UPCOMING';

		if (!titleEn) {
			return fail(400, { error: 'กรุณากรอกชื่อซีรีส์ (EN)' });
		}

		const db = await getDb();
		await db.insert(series).values({
			titleEn,
			titleTh,
			studioId,
			posterUrl,
			status: status as 'UPCOMING' | 'ONGOING' | 'ENDED'
		});

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const titleEn = formData.get('titleEn')?.toString().trim() ?? '';
		const titleTh = formData.get('titleTh')?.toString().trim() || null;
		const studioId = formData.get('studioId')?.toString() || null;
		const posterUrl = formData.get('posterUrl')?.toString().trim() || null;
		const status = formData.get('status')?.toString() ?? 'UPCOMING';

		if (!id || !titleEn) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.update(series)
			.set({ titleEn, titleTh, studioId, posterUrl, status: status as 'UPCOMING' | 'ONGOING' | 'ENDED' })
			.where(eq(series.id, id));

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
		await db.update(series)
			.set({ deletedAt: new Date() })
			.where(eq(series.id, id));

		return { success: true };
	}
};
