import { redirect } from '@sveltejs/kit';
import { getHaloDiscovery } from '$lib/server/moments/queries.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, params, url }) => {
	const composePath = `/${params.lang}/halo/compose`;
	if ((!locals.user || locals.user.role !== 'ADMIN') && url.pathname !== composePath) {
		throw redirect(303, `/${params.lang}/`);
	}

	try {
		return { haloDiscovery: await getHaloDiscovery(4) };
	} catch {
		return { haloDiscovery: [] };
	}
};
