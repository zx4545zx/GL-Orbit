import { getMoments } from '$lib/server/moments/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const filters = {
		seriesId: url.searchParams.get('seriesId'),
		artistId: url.searchParams.get('artistId'),
		shipId: url.searchParams.get('shipId')
	};
	return { ...(await getMoments({ ...filters, viewerId: locals.user?.id })), filters };
};
