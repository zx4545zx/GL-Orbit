import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch, data, url }) => {
	const page = url.searchParams.get('page') ?? '1';
	return {
		...(data as unknown as Record<string, unknown>),
		studios: fetch(`/api/admin/studios?page=${page}`).then((r) => r.json())
	};
};
