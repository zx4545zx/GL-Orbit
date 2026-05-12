import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch }) => {
	return {
		series: fetch('/api/series?page=1').then((r) => r.json())
	};
};
