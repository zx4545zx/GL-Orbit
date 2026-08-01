import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { listCurrencyOptions, listPlatformOptions } from '$lib/server/subscriptions/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const db = await getDb();
	const [platforms, currencies] = await Promise.all([
		listPlatformOptions(db),
		listCurrencyOptions(db)
	]);
	return { platforms, currencies };
};
