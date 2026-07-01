import { error, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { getSeriesFull, getReferenceData } from '$lib/server/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		redirect(303, `/${params.lang}/admin/login`);
	}

	const db = await getDb();
	const full = await getSeriesFull(db, params.id);
	if (!full) {
		error(404, 'ไม่พบซีรีส์');
	}
	const reference = await getReferenceData(db);

	return { full, reference };
};
