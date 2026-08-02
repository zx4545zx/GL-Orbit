import { getWhatsOnData } from '$lib/server/queries/whats-on.js';
import { getWhatsOnEventWindow, parseWhatsOnParams } from './whats-on.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
	const params = parseWhatsOnParams(url.searchParams);
	setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=300' });
	return {
		whatsOn: await getWhatsOnData({ eventWindow: getWhatsOnEventWindow(params), fetcher: fetch }),
		params
	};
};
