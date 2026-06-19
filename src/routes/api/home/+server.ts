import { json } from '@sveltejs/kit';
import { getHomeData } from '$lib/server/queries/home.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async () => {
	return json(await getHomeData());
};
