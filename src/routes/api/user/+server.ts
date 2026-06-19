import { json } from '@sveltejs/kit';
import { toPublicUser } from '$lib/server/auth/public-user.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	return json({ user: locals.user ? toPublicUser(locals.user) : null });
};
