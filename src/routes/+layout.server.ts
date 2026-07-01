import { toPublicUser } from '$lib/server/auth/public-user.js';
import { availableLanguageTags, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const pathLang = url.pathname.split('/')[1];
	const lang = availableLanguageTags.includes(pathLang as AvailableLanguageTag)
		? (pathLang as AvailableLanguageTag)
		: locals.lang;

	return {
		user: locals.user ? toPublicUser(locals.user) : null,
		lang
	};
};
