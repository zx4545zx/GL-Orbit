import { redirect } from '@sveltejs/kit';
import { getHaloDiscovery } from '$lib/server/moments/queries.js';
import type { LayoutServerLoad } from './$types.js';

// Orbit Halo is closed for everyone, including ADMIN — flip to false to reopen the feature.
const HALO_CLOSED: boolean = true;

export const load: LayoutServerLoad = async ({ locals, params, url }) => {
	if (HALO_CLOSED) {
		throw redirect(303, `/${params.lang}/`);
	}

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
