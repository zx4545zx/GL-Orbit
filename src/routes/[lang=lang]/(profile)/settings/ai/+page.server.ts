import { redirect } from '@sveltejs/kit';
import { listAiSettings } from '$lib/server/ai/profiles.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	return listAiSettings(locals.user.id);
};
