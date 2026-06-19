import { error } from '@sveltejs/kit';
import { fetchSeriesDetail } from './detail.js';
import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch, params }) => {
	const series = await fetchSeriesDetail(params.id, fetch);
	if (!series) {
		throw error(404, 'ไม่พบซีรีส์นี้');
	}

	return { series };
};
