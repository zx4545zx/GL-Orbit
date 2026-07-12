import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor } from './cursor.js';

describe('Moment cursor', () => {
	it('round-trips a versioned cursor', () => {
		const cursor = encodeCursor({ createdAt: '2026-07-12T00:00:00.000Z', id: 'moment-1' });
		expect(decodeCursor(cursor)).toEqual({ createdAt: '2026-07-12T00:00:00.000Z', id: 'moment-1' });
	});
	it('rejects malformed cursors', () => expect(decodeCursor('not-base64')).toBeNull());
});
