import type { RequestHandler } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth/session.js';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	const sessionCookie = cookies.get('session');
	if (sessionCookie) {
		await destroySession(sessionCookie);
	}

	cookies.delete('session', { path: '/' });
	locals.user = null;
	locals.session = null;

	throw redirect(303, '/');
};
