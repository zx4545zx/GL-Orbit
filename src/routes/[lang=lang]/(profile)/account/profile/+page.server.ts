import { redirect } from '@sveltejs/kit';
import { toProfileUser } from '$lib/server/auth/public-user.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	return { profileUser: toProfileUser(locals.user) };
};
