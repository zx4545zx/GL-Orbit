import { toPublicUser } from '$lib/server/auth/public-user.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ? toPublicUser(locals.user) : null
	};
};
