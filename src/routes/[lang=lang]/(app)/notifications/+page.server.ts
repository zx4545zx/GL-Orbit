import { redirect } from '@sveltejs/kit';
import { getUserNotifications } from '$lib/server/notifications.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	return await getUserNotifications(locals.user.id, 20, 0);
};
