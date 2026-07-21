import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import {
	apiSuccess,
	handleSubscriptionApi,
	readJsonObject,
	requireApiUser,
	requireMutationOrigin,
	requireResourceUuid,
	serverValidationToday
} from '$lib/server/subscriptions/api.js';
import {
	softDeleteSubscription,
	updateSubscription
} from '$lib/server/subscriptions/mutations.js';
import { getSubscriptionDetail } from '$lib/server/subscriptions/queries.js';
import { parseUpdateSubscriptionRequest } from '$lib/server/subscriptions/validation.js';

export const GET: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
		return apiSuccess(
			await getSubscriptionDetail(
				await getDb(),
				user.id,
				id,
				event.url.searchParams.get('cursor')
			)
		);
	});

export const PATCH: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
		const input = parseUpdateSubscriptionRequest(
			await readJsonObject(event.request),
			serverValidationToday()
		);
		return apiSuccess(await updateSubscription(await getDb(), user.id, id, input));
	});

export const DELETE: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
		await softDeleteSubscription(await getDb(), user.id, id);
		return apiSuccess({ id });
	});
