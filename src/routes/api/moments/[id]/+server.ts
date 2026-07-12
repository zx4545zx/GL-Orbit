import { json } from '@sveltejs/kit';
import { deleteMoment, updateMoment } from '$lib/server/moments/mutations.js';
import { getMoment } from '$lib/server/moments/queries.js';
import { parseMomentRequest } from '../service.js';
import type { RequestHandler } from './$types.js';
export const GET: RequestHandler = async ({ locals, params }) => { const moment = await getMoment(params.id, locals.user?.id); return moment ? json(moment) : json({ error: 'NOT_FOUND' }, { status: 404 }); };
export const PATCH: RequestHandler = async ({ locals, params, request }) => { if (!locals.user) return json({ error: 'UNAUTHORIZED' }, { status: 401 }); const input = await parseMomentRequest(request); if (!input) return json({ error: 'INVALID_MOMENT' }, { status: 400 }); await updateMoment(params.id, locals.user.id, input); return json({ success: true }); };
export const DELETE: RequestHandler = async ({ locals, params }) => { if (!locals.user) return json({ error: 'UNAUTHORIZED' }, { status: 401 }); await deleteMoment(params.id, locals.user.id, locals.user.role === 'ADMIN'); return json({ success: true }); };
