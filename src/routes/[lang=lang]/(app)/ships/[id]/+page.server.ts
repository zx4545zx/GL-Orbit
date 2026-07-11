import { error } from '@sveltejs/kit';
import { buildShipDetailSeo, getShipDetail } from '$lib/server/ships/detail.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const ship = await getShipDetail(params.id);
	if (!ship) error(404, 'ไม่พบ Ship นี้');

	setHeaders({
		'cache-control': 'private, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});

	return {
		ship,
		seo: buildShipDetailSeo(ship, url.origin)
	};
};
