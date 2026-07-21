import { json } from '@sveltejs/kit';
import { formatCalendarDate } from '$lib/subscriptions/calendar.js';
import type {
	ApiSuccess,
	CalendarDate,
	SubscriptionApiError
} from '$lib/subscriptions/types.js';
import { SubscriptionDomainError } from './errors.js';

const PRIVATE_HEADERS = { 'cache-control': 'private, no-store' };

class SubscriptionTransportError extends Error {
	constructor(readonly status: 400 | 500) {
		super(`Subscription transport error ${status}`);
	}
}

export function apiSuccess<T>(data: T, status = 200): Response {
	return json({ ok: true, data } satisfies ApiSuccess<T>, {
		status,
		headers: PRIVATE_HEADERS
	});
}

export function requireApiUser(
	user: App.Locals['user']
): NonNullable<App.Locals['user']> {
	if (!user) throw new SubscriptionDomainError('AUTH_REQUIRED');
	return user;
}

export function requireMutationOrigin(request: Request, url: URL): void {
	if (request.headers.get('origin') !== url.origin) {
		throw new SubscriptionTransportError(400);
	}
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
	try {
		const value: unknown = await request.json();
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			throw new SubscriptionTransportError(400);
		}
		return value as Record<string, unknown>;
	} catch (error) {
		if (error instanceof SubscriptionTransportError) throw error;
		throw new SubscriptionTransportError(400);
	}
}

export function serverValidationToday(now = new Date()): CalendarDate {
	return formatCalendarDate({
		year: now.getUTCFullYear(),
		month: now.getUTCMonth() + 1,
		day: now.getUTCDate()
	});
}

export function requireResourceUuid(
	value: string | undefined,
	code: 'SUBSCRIPTION_NOT_FOUND' | 'PAYMENT_NOT_FOUND'
): string {
	if (
		!value ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			value
		)
	) {
		throw new SubscriptionDomainError(code);
	}
	return value;
}

export async function handleSubscriptionApi(run: () => Promise<Response>): Promise<Response> {
	try {
		return await run();
	} catch (error) {
		if (error instanceof SubscriptionDomainError) {
			const body: SubscriptionApiError = {
				ok: false,
				code: error.code,
				...(Object.keys(error.fieldErrors).length ? { fieldErrors: error.fieldErrors } : {})
			};
			return json(body, { status: error.status, headers: PRIVATE_HEADERS });
		}
		if (error instanceof SubscriptionTransportError) {
			return json(
				{ ok: false, code: 'INVALID_INPUT' } satisfies SubscriptionApiError,
				{ status: error.status, headers: PRIVATE_HEADERS }
			);
		}
		console.error('Subscription API failed', error instanceof Error ? error.name : 'UnknownError');
		return json(
			{ ok: false, code: 'INTERNAL_ERROR' } satisfies SubscriptionApiError,
			{ status: 500, headers: PRIVATE_HEADERS }
		);
	}
}
