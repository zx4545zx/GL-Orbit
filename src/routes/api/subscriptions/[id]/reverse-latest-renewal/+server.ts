import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import {
	apiSuccess,
	handleSubscriptionApi,
	readJsonObject,
	requireApiUser,
	requireMutationOrigin,
	requireResourceUuid
} from '$lib/server/subscriptions/api.js';
import { reverseLatestRenewal } from '$lib/server/subscriptions/mutations.js';
import { parseReverseRenewalRequest } from '$lib/server/subscriptions/validation.js';

export const POST: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
		const input = parseReverseRenewalRequest(await readJsonObject(event.request));
		return apiSuccess(await reverseLatestRenewal(await getDb(), user.id, id, input));
	});
