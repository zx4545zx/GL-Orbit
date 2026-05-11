import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/admin/login');
	}

	if (locals.user.role !== 'ADMIN') {
		redirect(302, '/profile');
	}
};
