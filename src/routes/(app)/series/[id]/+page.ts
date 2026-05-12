import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
	return {
		series: fetch(`/api/series/${params.id}`)
			.then((r) => r.json())
			.then((data) => data.series)
	};
};
