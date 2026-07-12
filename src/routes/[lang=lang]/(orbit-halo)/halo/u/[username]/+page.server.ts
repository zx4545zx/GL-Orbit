import { error } from '@sveltejs/kit';
import { getHaloProfile, getMoments } from '$lib/server/moments/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const profile = await getHaloProfile(params.username);
	if (!profile) throw error(404, 'ไม่พบผู้ใช้ Halo นี้');
	const feed = await getMoments({ authorId: profile.id, viewerId: locals.user?.id });
	return { profile, ...feed };
};
