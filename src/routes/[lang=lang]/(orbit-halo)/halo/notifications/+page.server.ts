import { redirect } from '@sveltejs/kit';
import { getUserNotifications } from '$lib/server/notifications.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const returnPath = `/${params.lang}/halo/notifications`;
	if (!locals.user) {
		throw redirect(303, `/${params.lang}/login?redirectTo=${encodeURIComponent(returnPath)}`);
	}

	return getUserNotifications(locals.user.id, 20, 0);
};
