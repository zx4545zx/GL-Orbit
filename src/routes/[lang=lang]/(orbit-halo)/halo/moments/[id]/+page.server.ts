import { error } from '@sveltejs/kit';
import { getMoment } from '$lib/server/moments/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const moment = await getMoment(params.id, locals.user?.id);
	if (!moment) throw error(404, 'ไม่พบ Moment นี้');
	return { moment };
};
