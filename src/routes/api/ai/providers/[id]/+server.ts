import { json } from '@sveltejs/kit';
import { deleteAiProvider } from '$lib/server/ai/profiles.js';
import type { RequestHandler } from './$types.js';
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	return (await deleteAiProvider(locals.user.id, params.id)) ? json({ ok: true }) : json({ error: 'Provider not found' }, { status: 404 });
};
