import type { Actions, PageServerLoad } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { seriesSchedules, series, platforms } from '$lib/server/db/schema.js';
import { eq, isNull, asc } from 'drizzle-orm';

const dayOptions = [
	{ value: 1, label: 'จันทร์' },
	{ value: 2, label: 'อังคาร' },
	{ value: 3, label: 'พุธ' },
	{ value: 4, label: 'พฤหัสบดี' },
	{ value: 5, label: 'ศุกร์' },
	{ value: 6, label: 'เสาร์' },
	{ value: 0, label: 'อาทิตย์' }
];

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return { seriesList: [], platforms: [], dayOptions };
	}

	const db = await getDb();

	const allSeries = await db
		.select({ id: series.id, titleEn: series.titleEn })
		.from(series)
		.where(isNull(series.deletedAt))
		.orderBy(asc(series.titleEn));

	const allPlatforms = await db
		.select({ id: platforms.id, name: platforms.name })
		.from(platforms)
		.where(isNull(platforms.deletedAt))
		.orderBy(asc(platforms.name));

	return { seriesList: allSeries, platforms: allPlatforms, dayOptions };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const seriesId = formData.get('seriesId')?.toString() ?? '';
		const platformId = formData.get('platformId')?.toString() ?? '';
		const dayOfWeek = parseInt(formData.get('dayOfWeek')?.toString() ?? '1', 10);
		const airTime = formData.get('airTime')?.toString() ?? '';
		const isUncut = formData.get('isUncut') === 'on';

		if (!seriesId || !platformId || !airTime) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.insert(seriesSchedules).values({
			seriesId,
			platformId,
			dayOfWeek,
			airTime,
			isUncut
		});

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const seriesId = formData.get('seriesId')?.toString() ?? '';
		const platformId = formData.get('platformId')?.toString() ?? '';
		const dayOfWeek = parseInt(formData.get('dayOfWeek')?.toString() ?? '1', 10);
		const airTime = formData.get('airTime')?.toString() ?? '';
		const isUncut = formData.get('isUncut') === 'on';

		if (!id || !seriesId || !platformId || !airTime) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.update(seriesSchedules)
			.set({ seriesId, platformId, dayOfWeek, airTime, isUncut })
			.where(eq(seriesSchedules.id, id));

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
		await db.delete(seriesSchedules).where(eq(seriesSchedules.id, id));

		return { success: true };
	}
};
