import { json, error } from '@sveltejs/kit';
import { getSeriesDetail } from '$lib/server/queries/series-detail.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params }) => {
	const series = await getSeriesDetail(params.id);
	if (!series) {
		error(404, 'ไม่พบซีรีส์นี้');
	}
	return json({ series });
};
