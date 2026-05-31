import { json } from '@sveltejs/kit';
import { getCached, setCached } from '$lib/server/cache.js';
import {
	buildSeriesCacheKey,
	getSeriesList,
	parseSeriesFilters,
	parseSeriesPage
} from '$lib/server/series/listing.js';
import type { RequestHandler } from './$types.js';

const CACHE_TTL = 30_000;

export const GET: RequestHandler = async ({ url }) => {
	const filters = parseSeriesFilters(url.searchParams);
	const page = parseSeriesPage(url.searchParams);
	const cacheKey = buildSeriesCacheKey(filters, page);

	const cached = getCached(cacheKey, CACHE_TTL);
	if (cached) {
		return json(cached);
	}

	const result = await getSeriesList(filters, page);
	setCached(cacheKey, result, CACHE_TTL);
	return json(result);
};
