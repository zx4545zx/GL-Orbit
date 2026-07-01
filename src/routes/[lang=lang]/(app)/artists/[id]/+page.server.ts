import { error } from '@sveltejs/kit';
import { getArtistDetail } from '$lib/server/queries/artist-detail.js';
import type { PageServerLoad } from './$types.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	if (!UUID_RE.test(params.id)) {
		throw error(404, 'ไม่พบข้อมูลนักแสดง');
	}

	const artist = await getArtistDetail(params.id);
	if (!artist) {
		throw error(404, 'ไม่พบข้อมูลนักแสดง');
	}

	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});

	return { artist };
};
