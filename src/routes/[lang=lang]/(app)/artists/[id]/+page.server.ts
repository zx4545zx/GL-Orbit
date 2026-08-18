import { m } from '$lib/i18n/paraglide.js';
import { error } from '@sveltejs/kit';
import { getArtistDetail } from '$lib/server/queries/artist-detail.js';
import { setPublicPageCache } from '$lib/server/cache.js';
import type { PageServerLoad } from './$types.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, setHeaders, locals }) => {
	if (!UUID_RE.test(params.id)) {
		throw error(404, m.artist_detail_not_found());
	}

	const artist = await getArtistDetail(params.id);
	if (!artist) {
		throw error(404, m.artist_detail_not_found());
	}

	setPublicPageCache(setHeaders, Boolean(locals.user));

	return { artist };
};
