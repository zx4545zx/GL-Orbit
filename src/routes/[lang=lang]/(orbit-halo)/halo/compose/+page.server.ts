import { redirect } from '@sveltejs/kit';
import { getMomentSeriesOptions } from '$lib/server/moments/queries.js';
import {
	SHARE_TARGET_COOKIE,
	SHARE_TARGET_MAX_AGE,
	normalizeSharedMoment,
	readSharedMoment
} from '$lib/server/moments/share-target.js';
import type { PageServerLoad } from './$types.js';

const cookieOptions = {
	path: '/',
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge: SHARE_TARGET_MAX_AGE
};

export const load: PageServerLoad = async ({ cookies, locals, params, url }) => {
	const composePath = `/${params.lang}/halo/compose`;
	const incoming = normalizeSharedMoment(url.searchParams);

	if (incoming) {
		cookies.set(SHARE_TARGET_COOKIE, JSON.stringify(incoming), cookieOptions);
		throw redirect(303, composePath);
	}

	const shared = readSharedMoment(cookies.get(SHARE_TARGET_COOKIE));
	if (shared && !locals.user) {
		throw redirect(303, `/${params.lang}/login?redirectTo=${encodeURIComponent(composePath)}`);
	}
	if (shared) cookies.delete(SHARE_TARGET_COOKIE, { path: '/' });

	return {
		initialBody: shared?.body ?? '',
		initialUrl: shared?.sourceUrl ?? '',
		seriesOptions: await getMomentSeriesOptions(params.lang)
	};
};
