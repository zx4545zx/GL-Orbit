import { getHomeData } from '$lib/server/queries/home.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return await getHomeData();
};
