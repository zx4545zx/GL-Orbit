import { error, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';
import {
	getSubscriptionDetail,
	listCurrencyOptions,
	listPlatformOptions
} from '$lib/server/subscriptions/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(303, '/login');

	try {
		const db = await getDb();
		const [subscription, platforms, currencies] = await Promise.all([
			getSubscriptionDetail(db, locals.user.id, params.id),
			listPlatformOptions(db),
			listCurrencyOptions(db)
		]);
		return { subscription, platforms, currencies };
	} catch (cause) {
		if (cause instanceof SubscriptionDomainError && cause.status === 404) {
			throw error(404, 'Not found');
		}
		throw cause;
	}
};
