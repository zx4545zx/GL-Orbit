import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import {
	listCurrencyOptions,
	listPlatformOptions,
	listSubscriptionBudgets,
	listSubscriptions
} from '$lib/server/subscriptions/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const db = await getDb();
	const [subscriptions, budgets, platforms, currencies] = await Promise.all([
		listSubscriptions(db, locals.user.id),
		listSubscriptionBudgets(db, locals.user.id),
		listPlatformOptions(db),
		listCurrencyOptions(db)
	]);

	return { subscriptions, budgets, platforms, currencies };
};
