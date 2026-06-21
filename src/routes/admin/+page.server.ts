import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		redirect(303, '/admin/login');
	}
	redirect(303, '/admin/series');
};
