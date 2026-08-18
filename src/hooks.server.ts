import { redirect, type Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth/session.js';
import { detectLocale } from '$lib/i18n/detect.js';
import { availableLanguageTags, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');

	event.locals.user = null;
	event.locals.session = null;

	if (sessionCookie) {
		const result = await validateSession(sessionCookie);
		if (result) {
			event.locals.user = result.user;
			event.locals.session = result.session;
		}
	}

	// Locale detection
	const pathLang = event.url.pathname.split('/')[1] ?? '';
	const cookieLocale = event.cookies.get('locale');

	const userLocale = event.locals.user?.preferredLanguage ?? undefined;

	const locale = detectLocale({
		urlLocale: pathLang,
		cookieLocale,
		userLocale,
		acceptLanguage: event.request.headers.get('accept-language')
	});

	event.locals.lang = locale;

	// Redirect non-localized public routes to the detected locale.
	// Static assets, API routes, and special top-level routes are skipped.
	const firstSegment = pathLang;
	const isLocalized = availableLanguageTags.includes(firstSegment as AvailableLanguageTag);
	const lastSegment = event.url.pathname.split('/').pop() ?? '';
	const hasFileExtension = lastSegment.includes('.');
	const nonLocalizedRoutes = new Set(['api', 'og-image']);
	const localeCookieOptions = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const };

	if (event.url.pathname === '/') {
		event.cookies.set('locale', locale, localeCookieOptions);
	}

	if (
		!isLocalized &&
		event.url.pathname !== '/' &&
		!hasFileExtension &&
		!nonLocalizedRoutes.has(firstSegment)
	) {
		event.cookies.set('locale', locale, localeCookieOptions);
		throw redirect(302, `/${locale}${event.url.pathname}${event.url.search}`);
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	});
};
