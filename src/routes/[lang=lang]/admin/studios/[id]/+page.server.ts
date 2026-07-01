import { error, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { studios, studioSocials } from '$lib/server/db/schema.js';
import { and, asc, eq, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		redirect(303, `/${params.lang}/admin/login`);
	}

	const db = await getDb();
	const [studio] = await db
		.select({
			id: studios.id,
			name: studios.name,
			logoUrl: studios.logoUrl,
			officialSite: studios.officialSite
		})
		.from(studios)
		.where(and(eq(studios.id, params.id), isNull(studios.deletedAt)))
		.limit(1);

	if (!studio) error(404, 'ไม่พบสตูดิโอ');

	const socials = await db
		.select({
			id: studioSocials.id,
			studioId: studioSocials.studioId,
			platform: studioSocials.platform,
			url: studioSocials.url,
			iconUrl: studioSocials.iconUrl
		})
		.from(studioSocials)
		.where(eq(studioSocials.studioId, params.id))
		.orderBy(asc(studioSocials.platform));

	return { studio, socials };
};
