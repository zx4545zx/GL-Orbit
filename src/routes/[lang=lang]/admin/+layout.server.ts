import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (url.pathname === '/admin/login') {
		if (locals.user?.role === 'ADMIN') {
			throw redirect(303, '/admin/series');
		}
		return {};
	}

	if (!locals.user) {
		throw redirect(303, `/admin/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
	}

	if (locals.user.role !== 'ADMIN') {
		throw redirect(303, '/profile');
	}

	return {};
};
