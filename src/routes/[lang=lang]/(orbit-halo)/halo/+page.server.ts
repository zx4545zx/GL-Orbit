import { redirect } from '@sveltejs/kit';
import { getMomentSeriesOptions, getMoments } from '$lib/server/moments/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const following = url.searchParams.get('following') === 'true';
	if (following && !locals.user) {
		const returnPath = `${url.pathname}${url.search}`;
		throw redirect(303, `/${params.lang}/login?redirectTo=${encodeURIComponent(returnPath)}`);
	}
	const filters = {
		seriesId: url.searchParams.get('seriesId'),
		artistId: url.searchParams.get('artistId'),
		shipId: url.searchParams.get('shipId')
	};
	const [feed, seriesOptions] = await Promise.all([
		getMoments({ ...filters, following, viewerId: locals.user?.id }),
		getMomentSeriesOptions(params.lang)
	]);
	return { ...feed, filters, following, seriesOptions };
};
