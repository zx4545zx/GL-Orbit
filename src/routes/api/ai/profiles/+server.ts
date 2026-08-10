import { json } from '@sveltejs/kit';
import { createAiProfile } from '$lib/server/ai/profiles.js';
import type { RequestHandler } from './$types.js';
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	try { return json({ profile: await createAiProfile(locals.user.id, await request.json()) }, { status: 201 }); }
	catch { return json({ error: 'Model profile could not be saved. Choose one of your providers and a model ID.' }, { status: 400 }); }
};
