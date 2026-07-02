import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series } from '$lib/server/db/schema.js';
import { isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		throw redirect(303, '/admin/login');
	}

	const db = await getDb();
	const seriesList = await db
		.select({ id: series.id, titleEn: series.titleEn })
		.from(series)
		.where(isNull(series.deletedAt))
		.orderBy(series.titleEn);

	return { series: seriesList };
};
