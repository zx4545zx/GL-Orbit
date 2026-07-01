import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth/session.js';
import { detectLocale } from '$lib/i18n/detect.js';
import { getDb } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

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

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	});
};
