import { describe, expect, it } from 'vitest';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { decodePaymentCursor, encodePaymentCursor } from './cursor.js';

describe('payment cursor', () => {
	it('round-trips the deterministic sort tuple', () => {
		const cursor = {
			paidDate: parseCalendarDate('2026-07-21')!,
			createdAt: '2026-07-21T10:00:00.000Z',
			id: '11111111-1111-4111-8111-111111111111'
		};
		expect(decodePaymentCursor(encodePaymentCursor(cursor))).toEqual(cursor);
	});

	it.each([
		'',
		'not-base64',
		Buffer.from('{}').toString('base64url'),
		Buffer.from('{"paidDate":"bad"}').toString('base64url')
	])('rejects malformed cursor %s', (value) => {
		expect(decodePaymentCursor(value)).toBeNull();
	});
});
