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
	softDeleteEditablePayment,
	updateEditablePayment
} from '$lib/server/subscriptions/mutations.js';
import { parsePaymentWriteRequest } from '$lib/server/subscriptions/validation.js';

export const PATCH: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const paymentId = requireResourceUuid(event.params.paymentId, 'PAYMENT_NOT_FOUND');
		const input = parsePaymentWriteRequest(
			await readJsonObject(event.request),
			serverValidationToday()
		);
		return apiSuccess(await updateEditablePayment(await getDb(), user.id, paymentId, input));
	});

export const DELETE: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		requireMutationOrigin(event.request, event.url);
		const paymentId = requireResourceUuid(event.params.paymentId, 'PAYMENT_NOT_FOUND');
		await softDeleteEditablePayment(await getDb(), user.id, paymentId);
		return apiSuccess({ paymentId });
	});
