import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch, data, url }) => {
	const page = url.searchParams.get('page') ?? '1';
	return {
		...data,
		socials: fetch(`/api/admin/artist-socials?page=${page}`).then((r) => r.json())
	};
};
