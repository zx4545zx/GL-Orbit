import { json } from '@sveltejs/kit';
import { getShipList, parseShipFilters, parseShipPage } from '$lib/server/ships/listing.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const filters = parseShipFilters(url.searchParams);
	const page = parseShipPage(url.searchParams);
	const result = await getShipList(filters, page);

	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});

	return json(result);
};
