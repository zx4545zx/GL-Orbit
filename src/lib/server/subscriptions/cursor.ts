import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import type { CalendarDate } from '$lib/subscriptions/types.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PaymentCursor = { paidDate: CalendarDate; createdAt: string; id: string };

export function encodePaymentCursor(cursor: PaymentCursor): string {
	return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodePaymentCursor(value: string | null | undefined): PaymentCursor | null {
	if (!value) return null;
	try {
		const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<
			string,
			unknown
		>;
		const paidDate = parseCalendarDate(parsed.paidDate);
		if (
			!paidDate ||
			typeof parsed.createdAt !== 'string' ||
			!Number.isFinite(Date.parse(parsed.createdAt)) ||
			typeof parsed.id !== 'string' ||
			!UUID.test(parsed.id)
		) {
			return null;
		}
		return { paidDate, createdAt: parsed.createdAt, id: parsed.id };
	} catch {
		return null;
	}
}
