import { json } from '@sveltejs/kit';
import { deleteAiProfile, setDefaultAiProfile } from '$lib/server/ai/profiles.js';
import type { RequestHandler } from './$types.js';
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	const body = await request.json().catch(() => null) as { isDefault?: unknown } | null;
	if (body?.isDefault !== true) return json({ error: 'Only default selection is supported' }, { status: 400 });
	const profile = await setDefaultAiProfile(locals.user.id, params.id);
	return profile ? json({ profile }) : json({ error: 'Profile not found' }, { status: 404 });
};
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	return (await deleteAiProfile(locals.user.id, params.id)) ? json({ ok: true }) : json({ error: 'Profile not found' }, { status: 404 });
};
