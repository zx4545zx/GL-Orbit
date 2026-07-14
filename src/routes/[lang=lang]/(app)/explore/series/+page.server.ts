import { getCached, setCached } from '$lib/server/cache.js';
import {
	buildSeriesCacheKey,
	getSeriesList,
	parseSeriesFilters,
	parseSeriesPage
} from '$lib/server/series/listing.js';
import type { PageServerLoad } from './$types.js';

const CACHE_TTL = 30_000;

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const filters = parseSeriesFilters(url.searchParams);
	const page = parseSeriesPage(url.searchParams);
	const cacheKey = buildSeriesCacheKey(filters, page);
	const cached = getCached<Awaited<ReturnType<typeof getSeriesList>>>(cacheKey, CACHE_TTL);
	const series = cached ?? await getSeriesList(filters, page);

	if (!cached) setCached(cacheKey, series, CACHE_TTL);

	setHeaders({
		'cache-control': 'private, no-store'
	});

	return { series, filters };
};
