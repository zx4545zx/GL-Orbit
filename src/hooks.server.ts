import { redirect, type Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth/session.js';
import { detectLocale } from '$lib/i18n/detect.js';
import { availableLanguageTags, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';
import { getDb } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { contentSecurityPolicy } from '$lib/server/security/csp.js';
import { dev } from '$app/environment';

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

	let userLocale: string | undefined;
	if (event.locals.user) {
		const db = await getDb();
		const [user] = await db
			.select({ preferredLanguage: users.preferredLanguage })
			.from(users)
			.where(eq(users.id, event.locals.user.id));
		userLocale = user?.preferredLanguage ?? undefined;
	}

	const locale = detectLocale({
		urlLocale: pathLang,
		cookieLocale,
		userLocale,
		acceptLanguage: event.request.headers.get('accept-language')
	});

	event.locals.lang = locale;
	event.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });

	// Redirect non-localized public routes to the detected locale.
	// Static assets, API routes, and special top-level routes are skipped.
	const firstSegment = pathLang;
	const isLocalized = availableLanguageTags.includes(firstSegment as AvailableLanguageTag);
	const lastSegment = event.url.pathname.split('/').pop() ?? '';
	const hasFileExtension = lastSegment.includes('.');
	const nonLocalizedRoutes = new Set(['api', 'og-image']);

	if (
		!isLocalized &&
		event.url.pathname !== '/' &&
		!hasFileExtension &&
		!nonLocalizedRoutes.has(firstSegment)
	) {
		throw redirect(302, `/${locale}${event.url.pathname}${event.url.search}`);
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	});
	response.headers.set('content-security-policy', contentSecurityPolicy(dev));
	return response;
};
