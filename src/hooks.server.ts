import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth/session.js';

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

	return resolve(event);
};
