import { json } from '@sveltejs/kit';
import { createMoment, InvalidMomentSeriesError } from '$lib/server/moments/mutations.js';
import { decodeCursor } from '$lib/server/moments/cursor.js';
import { getMoments } from '$lib/server/moments/queries.js';
import { parseMomentRequest } from './service.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	const bookmarked = url.searchParams.get('bookmarked') === 'true';
	if (bookmarked && !locals.user) return json({ error: 'UNAUTHORIZED' }, { status: 401 });
	const rawLimit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
	const cursorValue = url.searchParams.get('cursor'); const cursor = cursorValue ? decodeCursor(cursorValue) : null;
	if (cursorValue && !cursor) return json({ error: 'INVALID_CURSOR' }, { status: 400 });
	return json(await getMoments({ limit: Number.isFinite(rawLimit) ? rawLimit : 20, cursor, seriesId: url.searchParams.get('seriesId'), artistId: url.searchParams.get('artistId'), shipId: url.searchParams.get('shipId'), authorId: url.searchParams.get('authorId'), bookmarked, viewerId: locals.user?.id }));
};
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'UNAUTHORIZED' }, { status: 401 });
	const input = await parseMomentRequest(request); if (!input) return json({ error: 'INVALID_MOMENT' }, { status: 400 });
	try { return json(await createMoment({ authorId: locals.user.id, ...input }), { status: 201 }); }
	catch (error) { return json({ error: error instanceof InvalidMomentSeriesError ? 'INVALID_MOMENT' : 'DUPLICATE_SOURCE' }, { status: error instanceof InvalidMomentSeriesError ? 400 : 409 }); }
};
