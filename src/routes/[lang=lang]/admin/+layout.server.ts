import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url, params }) => {
	const langPrefix = `/${params.lang}`;

	if (url.pathname === `${langPrefix}/admin/login`) {
		if (locals.user?.role === 'ADMIN') {
			throw redirect(303, `${langPrefix}/admin/series`);
		}
		return {};
	}

	if (!locals.user) {
		throw redirect(303, `${langPrefix}/admin/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
	}

	if (locals.user.role !== 'ADMIN') {
		throw redirect(303, `${langPrefix}/profile`);
	}

	return {};
};
