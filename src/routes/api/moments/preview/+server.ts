import { json } from '@sveltejs/kit';
import { resolveEmbed } from '$lib/server/embeds/resolver.js';
import type { RequestHandler } from './$types.js';
export const POST: RequestHandler = async ({ locals, request }) => { if (!locals.user) return json({ error: 'UNAUTHORIZED' }, { status: 401 }); try { const body = await request.json() as { sourceUrl?: unknown }; if (typeof body.sourceUrl !== 'string') throw new Error(); return json(await resolveEmbed(body.sourceUrl)); } catch { return json({ error: 'INVALID_URL' }, { status: 400 }); } };
