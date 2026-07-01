import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const langPrefix = `/${params.lang}`;
	if (!locals.user || locals.user.role !== 'ADMIN') {
		redirect(303, `${langPrefix}/admin/login`);
	}
	redirect(303, `${langPrefix}/admin/series`);
};
