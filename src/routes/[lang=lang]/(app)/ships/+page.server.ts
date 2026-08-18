import { getCached, setCached, setPublicPageCache } from '$lib/server/cache.js';
import {
	buildShipCacheKey,
	buildShipSeoMeta,
	getShipList,
	parseShipFilters,
	parseShipPage
} from '$lib/server/ships/listing.js';
import type { PageServerLoad } from './$types.js';

const CACHE_TTL = 30_000;

export const load: PageServerLoad = async ({ url, setHeaders, locals }) => {
	const filters = parseShipFilters(url.searchParams);
	const page = parseShipPage(url.searchParams);
	const cacheKey = buildShipCacheKey(filters, page, 'ships');
	const cached = getCached<Awaited<ReturnType<typeof getShipList>>>(cacheKey, CACHE_TTL);
	const ships = cached ?? await getShipList(filters, page);

	if (!cached) setCached(cacheKey, ships, CACHE_TTL);

	setPublicPageCache(setHeaders, Boolean(locals.user));

	return {
		ships,
		filters,
		seo: buildShipSeoMeta(filters, ships.items, url, page)
	};
};
