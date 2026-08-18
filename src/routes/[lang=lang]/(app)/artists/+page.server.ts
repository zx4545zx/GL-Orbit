import { getCached, setCached, setPublicPageCache } from '$lib/server/cache.js';
import {
	buildArtistSeoMeta,
	getArtistList,
	parseArtistFilters,
	parseArtistPage
} from '$lib/server/queries/artist-list.js';
import type { PageServerLoad } from './$types.js';

const CACHE_TTL = 30_000;

function buildArtistCacheKey(search: string, page: number): string {
	return `page:artists:search:${search}:page:${page}`;
}

export const load: PageServerLoad = async ({ url, setHeaders, locals }) => {
	const filters = parseArtistFilters(url.searchParams);
	const page = parseArtistPage(url.searchParams);
	const cacheKey = buildArtistCacheKey(filters.search, page);
	const cached = getCached<Awaited<ReturnType<typeof getArtistList>>>(cacheKey, CACHE_TTL);
	const artists = cached ?? await getArtistList(filters, page);

	if (!cached) setCached(cacheKey, artists, CACHE_TTL);

	setPublicPageCache(setHeaders, Boolean(locals.user));

	return {
		artists,
		filters,
		seo: buildArtistSeoMeta(filters, artists.items, url, page)
	};
};
