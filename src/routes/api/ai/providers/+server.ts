import { json } from '@sveltejs/kit';
import { createAiProvider, listAiSettings } from '$lib/server/ai/profiles.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	return json(await listAiSettings(locals.user.id));
};
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	try { return json({ provider: await createAiProvider(locals.user.id, await request.json()) }, { status: 201 }); }
	catch { return json({ error: 'Provider could not be saved. Check the required fields and public HTTPS URL.' }, { status: 400 }); }
};
