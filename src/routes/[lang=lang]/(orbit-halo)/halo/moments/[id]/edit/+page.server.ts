import { error, redirect } from '@sveltejs/kit';
import { getMoment } from '$lib/server/moments/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user) throw redirect(303, `/${params.lang}/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	const moment = await getMoment(params.id, locals.user.id);
	if (!moment || moment.authorId !== locals.user.id) throw error(404, 'ไม่พบ Moment นี้');
	return { moment };
};
