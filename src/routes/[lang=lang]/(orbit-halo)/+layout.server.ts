import { getHaloDiscovery } from '$lib/server/moments/queries.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async () => {
	try {
		return { haloDiscovery: await getHaloDiscovery(4) };
	} catch {
		return { haloDiscovery: [] };
	}
};
