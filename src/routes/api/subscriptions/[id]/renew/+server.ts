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
import { renewSubscription } from '$lib/server/subscriptions/mutations.js';
import { parseRenewSubscriptionRequest } from '$lib/server/subscriptions/validation.js';

export const POST: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
		const input = parseRenewSubscriptionRequest(
			await readJsonObject(event.request),
			serverValidationToday()
		);
		return apiSuccess(await renewSubscription(await getDb(), user.id, id, input));
	});
