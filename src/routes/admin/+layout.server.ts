import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Skip auth guard for the login page itself
	if (url.pathname === '/admin/login') {
		return {};
	}

	if (!locals.user) {
		redirect(302, '/admin/login');
	}

	if (locals.user.role !== 'ADMIN') {
		redirect(302, '/profile');
	}
};
