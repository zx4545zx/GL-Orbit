import type { PageServerLoad } from './$types.js';
import { buildSeriesSeoMeta, getSeriesList, parseSeriesFilters } from '$lib/server/series/listing.js';

export const load: PageServerLoad = async ({ url }) => {
	const filters = parseSeriesFilters(url.searchParams);
	const series = await getSeriesList(filters, 1);
	const meta = buildSeriesSeoMeta(filters, series.items, url);

	return {
		series,
		filters,
		meta
	};
};
