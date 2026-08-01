import { redirect } from '@sveltejs/kit';
import { toProfileUser } from '$lib/server/auth/public-user.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	return {
		profileUser: toProfileUser(locals.user)
	};
};
