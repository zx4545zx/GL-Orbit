import { getCached, setCached } from '$lib/server/cache.js';
import {
	getArtistList,
	parseArtistFilters,
	parseArtistPage
} from '$lib/server/queries/artist-list.js';
import type { PageServerLoad } from './$types.js';

const CACHE_TTL = 30_000;

function buildArtistCacheKey(search: string, page: number): string {
	return `page:explore:artists:search:${search}:page:${page}`;
}

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const filters = parseArtistFilters(url.searchParams);
	const page = parseArtistPage(url.searchParams);
	const cacheKey = buildArtistCacheKey(filters.search, page);
	const cached = getCached<Awaited<ReturnType<typeof getArtistList>>>(cacheKey, CACHE_TTL);
	const artists = cached ?? await getArtistList(filters, page);

	if (!cached) setCached(cacheKey, artists, CACHE_TTL);

	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});

	return { artists, filters };
};
