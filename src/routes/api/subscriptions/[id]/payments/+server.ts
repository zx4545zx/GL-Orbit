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
import { createManualPayment } from '$lib/server/subscriptions/mutations.js';
import { listSubscriptionPayments } from '$lib/server/subscriptions/queries.js';
import { parseCreatePaymentRequest } from '$lib/server/subscriptions/validation.js';

export const GET: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		const subscriptionId = requireResourceUuid(
			event.params.id,
			'SUBSCRIPTION_NOT_FOUND'
		);
		return apiSuccess(
			await listSubscriptionPayments(
				await getDb(),
				user.id,
				subscriptionId,
				event.url.searchParams.get('cursor'),
				25
			)
		);
	});

export const POST: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const subscriptionId = requireResourceUuid(
			event.params.id,
			'SUBSCRIPTION_NOT_FOUND'
		);
		const input = parseCreatePaymentRequest(
			await readJsonObject(event.request),
			serverValidationToday()
		);
		return apiSuccess(
			await createManualPayment(await getDb(), user.id, subscriptionId, input),
			201
		);
	});
