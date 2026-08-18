import { error } from '@sveltejs/kit';
import { buildShipDetailSeo, getShipDetail } from '$lib/server/ships/detail.js';
import { setPublicPageCache } from '$lib/server/cache.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, url, setHeaders, locals }) => {
	const ship = await getShipDetail(params.id);
	if (!ship) error(404, 'ไม่พบ Ship นี้');

	setPublicPageCache(setHeaders, Boolean(locals.user));

	return {
		ship,
		seo: buildShipDetailSeo(ship, url.origin)
	};
};
