import { redirect } from '@sveltejs/kit';
import { getMoments } from '$lib/server/moments/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const returnPath = `/${params.lang}/halo/saved`;
	if (!locals.user) throw redirect(303, `/${params.lang}/login?redirectTo=${encodeURIComponent(returnPath)}`);
	return getMoments({ bookmarked: true, viewerId: locals.user.id });
};
