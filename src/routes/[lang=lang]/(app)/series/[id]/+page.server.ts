import { error } from '@sveltejs/kit';
import { getSeriesDetail } from '$lib/server/queries/series-detail.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const series = await getSeriesDetail(params.id);
	if (!series) {
		throw error(404, 'ไม่พบซีรีส์นี้');
	}

	return { series };
};
