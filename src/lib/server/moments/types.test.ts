import { describe, expect, it } from 'vitest';

import { isMomentReportReason, MAX_MOMENT_IMAGES } from './types.js';

describe('Moment contracts', () => {
	it('accepts only supported report reasons', () => {
		expect(isMomentReportReason('SPAM')).toBe(true);
		expect(isMomentReportReason('INVALID')).toBe(false);
	});

	it('limits external images to four per Moment', () => {
		expect(MAX_MOMENT_IMAGES).toBe(4);
	});
});
