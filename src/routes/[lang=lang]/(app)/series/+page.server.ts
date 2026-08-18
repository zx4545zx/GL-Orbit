import { getCached, setCached, setPublicPageCache } from '$lib/server/cache.js';
import {
	buildSeriesCacheKey,
	buildSeriesSeoMeta,
	getSeriesList,
	parseSeriesFilters,
	parseSeriesPage
} from '$lib/server/series/listing.js';
import type { PageServerLoad } from './$types.js';

const CACHE_TTL = 30_000;

export const load: PageServerLoad = async ({ url, setHeaders, locals }) => {
	const filters = parseSeriesFilters(url.searchParams);
	const page = parseSeriesPage(url.searchParams);
	const cacheKey = buildSeriesCacheKey(filters, page);
	const cached = getCached<Awaited<ReturnType<typeof getSeriesList>>>(cacheKey, CACHE_TTL);
	const series = cached ?? await getSeriesList(filters, page);

	if (!cached) setCached(cacheKey, series, CACHE_TTL);

	setPublicPageCache(setHeaders, Boolean(locals.user));

	return {
		series,
		filters,
		seo: buildSeriesSeoMeta(filters, series.items, url, page)
	};
};
