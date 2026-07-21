import type { FieldErrorCode, SubscriptionErrorCode } from '$lib/subscriptions/types.js';

const statusByCode: Record<SubscriptionErrorCode, number> = {
	AUTH_REQUIRED: 401,
	INVALID_INPUT: 422,
	INTERNAL_ERROR: 500,
	UNSUPPORTED_CURRENCY: 422,
	PLATFORM_NOT_FOUND: 422,
	SUBSCRIPTION_NOT_FOUND: 404,
	PAYMENT_NOT_FOUND: 404,
	RENEWAL_CONFLICT: 409,
	RENEWAL_ALREADY_RECORDED: 409,
	RENEWAL_REVERSAL_NOT_ALLOWED: 409
};

export class SubscriptionDomainError extends Error {
	readonly status: number;

	constructor(
		readonly code: SubscriptionErrorCode,
		readonly fieldErrors: Record<string, FieldErrorCode[]> = {}
	) {
		super(code);
		this.name = 'SubscriptionDomainError';
		this.status = statusByCode[code];
	}
}

export function invalidInput(fieldErrors: Record<string, FieldErrorCode[]>): never {
	throw new SubscriptionDomainError('INVALID_INPUT', fieldErrors);
}
