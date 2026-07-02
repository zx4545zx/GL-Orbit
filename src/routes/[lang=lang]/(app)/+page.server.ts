import { getHomeData } from '$lib/server/queries/home.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const lang = params.lang === 'th' ? 'th' : 'en';
	return await getHomeData(lang);
};
