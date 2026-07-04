import { getHomeData } from '$lib/server/queries/home.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const lang = params.lang === 'th' ? 'th' : 'en';
	setHeaders({
		'cache-control': 'private, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});
	return await getHomeData(lang);
};
