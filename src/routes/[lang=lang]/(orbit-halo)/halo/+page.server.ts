import { getMomentSeriesOptions, getMoments } from '$lib/server/moments/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const filters = {
		seriesId: url.searchParams.get('seriesId'),
		artistId: url.searchParams.get('artistId'),
		shipId: url.searchParams.get('shipId')
	};
	const [feed, seriesOptions] = await Promise.all([
		getMoments({ ...filters, viewerId: locals.user?.id }),
		getMomentSeriesOptions(params.lang)
	]);
	return { ...feed, filters, seriesOptions };
};
