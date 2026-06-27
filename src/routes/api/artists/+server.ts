import { json } from '@sveltejs/kit';
import { getCached, setCached } from '$lib/server/cache.js';
import {
	getArtistList,
	parseArtistFilters,
	parseArtistPage
} from '$lib/server/queries/artist-list.js';
import type { RequestHandler } from './$types.js';

const CACHE_TTL = 30_000;

function buildArtistCacheKey(search: string, page: number): string {
	return `api:artists:search:${search}:page:${page}`;
}

export const GET: RequestHandler = async ({ url }) => {
	const filters = parseArtistFilters(url.searchParams);
	const page = parseArtistPage(url.searchParams);
	const cacheKey = buildArtistCacheKey(filters.search, page);

	const cached = getCached(cacheKey, CACHE_TTL);
	if (cached) {
		return json(cached);
	}

	const result = await getArtistList(filters, page);
	setCached(cacheKey, result, CACHE_TTL);
	return json(result);
};
