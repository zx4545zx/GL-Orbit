import { fetchHome } from './home.js';
import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch }) => {
	return await fetchHome(fetch);
};
