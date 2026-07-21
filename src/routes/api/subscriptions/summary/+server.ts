import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import {
	apiSuccess,
	handleSubscriptionApi,
	requireApiUser
} from '$lib/server/subscriptions/api.js';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';
import { getSubscriptionSummary } from '$lib/server/subscriptions/summary-query.js';

export const GET: RequestHandler = (event) =>
	handleSubscriptionApi(async () => {
		const user = requireApiUser(event.locals.user);
		const today = parseCalendarDate(event.url.searchParams.get('today'));
		if (!today) {
			throw new SubscriptionDomainError('INVALID_INPUT', { today: ['invalid'] });
		}
		return apiSuccess(await getSubscriptionSummary(await getDb(), user.id, today));
	});
