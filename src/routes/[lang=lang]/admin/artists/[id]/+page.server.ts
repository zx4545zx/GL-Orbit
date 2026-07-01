import { error, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { artists, artistSocials } from '$lib/server/db/schema.js';
import { and, asc, eq, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		redirect(303, `/${params.lang}/admin/login`);
	}

	const db = await getDb();
	const [artist] = await db
		.select({
			id: artists.id,
			nickname: artists.nickname,
			fullNameTh: artists.fullNameTh,
			fullNameEn: artists.fullNameEn,
			profileImageUrl: artists.profileImageUrl
		})
		.from(artists)
		.where(and(eq(artists.id, params.id), isNull(artists.deletedAt)))
		.limit(1);

	if (!artist) error(404, 'ไม่พบนักแสดง');

	const socials = await db
		.select({
			id: artistSocials.id,
			artistId: artistSocials.artistId,
			platform: artistSocials.platform,
			url: artistSocials.url,
			iconUrl: artistSocials.iconUrl
		})
		.from(artistSocials)
		.where(eq(artistSocials.artistId, params.id))
		.orderBy(asc(artistSocials.platform));

	return { artist, socials };
};
