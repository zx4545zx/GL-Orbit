import { getCountdownData } from '$lib/server/queries/countdown.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const countdown = await getCountdownData();
	return { countdown };
};
