import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import {
	apiSuccess,
	handleSubscriptionApi,
	readJsonObject,
	requireApiUser,
	requireMutationOrigin,
	serverValidationToday
} from '$lib/server/subscriptions/api.js';
import { createSubscription } from '$lib/server/subscriptions/mutations.js';
import { listSubscriptions } from '$lib/server/subscriptions/queries.js';
import { parseCreateSubscriptionRequest } from '$lib/server/subscriptions/validation.js';

export const GET: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		return apiSuccess(await listSubscriptions(await getDb(), user.id));
	});

export const POST: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const input = parseCreateSubscriptionRequest(
			await readJsonObject(event.request),
			serverValidationToday()
		);
		return apiSuccess(await createSubscription(await getDb(), user.id, input), 201);
	});
