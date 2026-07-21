import { m } from '$lib/i18n/paraglide.js';
import { formatCalendarDate } from './calendar.js';
import type { ApiResult, CalendarDate, FieldErrorCode, SubscriptionErrorCode } from './types.js';

const apiMessages: Record<SubscriptionErrorCode, () => string> = {
	AUTH_REQUIRED: m.subscriptions_error_auth_required,
	INVALID_INPUT: m.subscriptions_error_invalid_input,
	INTERNAL_ERROR: m.subscriptions_error_internal,
	UNSUPPORTED_CURRENCY: m.subscriptions_error_unsupported_currency,
	PLATFORM_NOT_FOUND: m.subscriptions_error_platform_not_found,
	SUBSCRIPTION_NOT_FOUND: m.subscriptions_error_subscription_not_found,
	PAYMENT_NOT_FOUND: m.subscriptions_error_payment_not_found,
	RENEWAL_CONFLICT: m.subscriptions_error_renewal_conflict,
	RENEWAL_ALREADY_RECORDED: m.subscriptions_error_renewal_already_recorded,
	RENEWAL_REVERSAL_NOT_ALLOWED: m.subscriptions_error_renewal_reversal_not_allowed
};

const fieldMessages: Record<FieldErrorCode, () => string> = {
	required: m.subscriptions_field_required,
	invalid: m.subscriptions_field_invalid,
	too_long: m.subscriptions_field_too_long,
	out_of_range: m.subscriptions_field_out_of_range,
	future_date: m.subscriptions_field_future_date,
	fraction_digits: m.subscriptions_field_fraction_digits,
	source_xor: m.subscriptions_field_source_xor,
	date_order: m.subscriptions_field_date_order,
	duplicate: m.subscriptions_field_duplicate
};

export class SubscriptionApiRequestError extends Error {
	constructor(
		readonly status: number,
		readonly code: SubscriptionErrorCode,
		readonly fieldErrors: Record<string, FieldErrorCode[]> = {}
	) {
		super(code);
		this.name = 'SubscriptionApiRequestError';
	}
}

export function subscriptionErrorMessage(error: SubscriptionApiRequestError): string {
	return apiMessages[error.code]();
}

export function subscriptionFieldErrorMessage(code: FieldErrorCode): string {
	return fieldMessages[code]();
}

export function deviceLocalToday(now = new Date()): CalendarDate {
	return formatCalendarDate({
		year: now.getFullYear(),
		month: now.getMonth() + 1,
		day: now.getDate()
	});
}

export async function subscriptionFetch<T>(
	input: RequestInfo | URL,
	init: RequestInit = {},
	fetcher: typeof fetch = fetch
): Promise<T> {
	const headers = new Headers(init.headers);
	if (init.body !== undefined && !headers.has('content-type')) {
		headers.set('content-type', 'application/json');
	}

	const response = await fetcher(input, {
		...init,
		headers,
		credentials: 'same-origin',
		cache: 'no-store'
	});

	let payload: ApiResult<T> | null = null;
	try {
		payload = (await response.json()) as ApiResult<T>;
	} catch {
		// Invalid response bodies are mapped below; never infer success.
	}

	if (!response.ok) {
		const apiError = payload && !payload.ok ? payload : null;
		throw new SubscriptionApiRequestError(
			response.status,
			apiError?.code ?? 'INTERNAL_ERROR',
			apiError?.fieldErrors
		);
	}

	if (!payload?.ok) {
		throw new SubscriptionApiRequestError(500, 'INTERNAL_ERROR');
	}

	return payload.data;
}
