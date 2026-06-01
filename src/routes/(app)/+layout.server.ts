import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { user: null };
	}

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			username: locals.user.username,
			displayName: locals.user.displayName,
			avatarUrl: locals.user.avatarUrl,
			role: locals.user.role
		}
	};
};
