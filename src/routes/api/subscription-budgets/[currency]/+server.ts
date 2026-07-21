import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import {
	apiSuccess,
	handleSubscriptionApi,
	readJsonObject,
	requireApiUser,
	requireMutationOrigin
} from '$lib/server/subscriptions/api.js';
import {
	deleteSubscriptionBudget,
	upsertSubscriptionBudget
} from '$lib/server/subscriptions/mutations.js';
import {
	parseBudgetCurrency,
	parseBudgetWriteRequest
} from '$lib/server/subscriptions/validation.js';

export const PUT: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const currency = parseBudgetCurrency(event.params.currency);
		const input = parseBudgetWriteRequest(await readJsonObject(event.request), currency);
		return apiSuccess(
			await upsertSubscriptionBudget(await getDb(), user.id, currency, input)
		);
	});

export const DELETE: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const currency = parseBudgetCurrency(event.params.currency);
		await deleteSubscriptionBudget(await getDb(), user.id, currency);
		return apiSuccess({ currency });
	});
