import { json } from '@sveltejs/kit';
import { deleteMoment, updateMoment } from '$lib/server/moments/mutations.js';
import { getMoment } from '$lib/server/moments/queries.js';
import { parseMomentRequest } from '../service.js';
import { isStagedMomentMedia } from '$lib/server/moments/media-token.js';
import type { RequestHandler } from './$types.js';
export const GET: RequestHandler = async ({ locals, params }) => { const moment = await getMoment(params.id, locals.user?.id); return moment ? json(moment) : json({ error: 'NOT_FOUND' }, { status: 404 }); };
export const PATCH: RequestHandler = async ({ locals, params, request }) => { const user = locals.user; if (!user) return json({ error: 'UNAUTHORIZED' }, { status: 401 }); const input = await parseMomentRequest(request); if (!input || !input.stagedMedia.every((media) => isStagedMomentMedia(media, params.id, user.id))) return json({ error: 'INVALID_MOMENT' }, { status: 400 }); return await updateMoment(params.id, user.id, input) ? json({ success: true }) : json({ error: 'NOT_FOUND' }, { status: 404 }); };
export const DELETE: RequestHandler = async ({ locals, params }) => { if (!locals.user) return json({ error: 'UNAUTHORIZED' }, { status: 401 }); return await deleteMoment(params.id, locals.user.id) ? json({ success: true }) : json({ error: 'NOT_FOUND' }, { status: 404 }); };
