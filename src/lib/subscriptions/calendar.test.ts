import { describe, expect, it } from 'vitest';
import {
	addCalendarDays,
	addCalendarInterval,
	calculateNextPeriod,
	differenceInCalendarDays,
	getCalendarMonthRange,
	parseCalendarDate
} from './calendar.js';

const date = (value: string) => {
	const parsed = parseCalendarDate(value);
	if (!parsed) throw new Error(`Invalid fixture: ${value}`);
	return parsed;
};

describe('subscription civil dates', () => {
	it('rejects rollover and non-padded dates', () => {
		expect(parseCalendarDate('2026-02-29')).toBeNull();
		expect(parseCalendarDate('2026-2-01')).toBeNull();
		expect(parseCalendarDate('2024-02-29')).toBe('2024-02-29');
	});

	it('adds exact days without UTC conversion', () => {
		expect(addCalendarDays(date('2026-03-31'), 1)).toBe('2026-04-01');
		expect(addCalendarDays(date('2024-03-01'), -1)).toBe('2024-02-29');
		expect(differenceInCalendarDays(date('2026-04-01'), date('2026-03-31'))).toBe(1);
	});

	it('restores a January 31 monthly anchor after February clamping', () => {
		expect(addCalendarInterval(date('2025-01-31'), 'MONTH', 1)).toBe('2025-02-28');
		expect(addCalendarInterval(date('2025-01-31'), 'MONTH', 2)).toBe('2025-03-31');
	});

	it('restores a leap-day yearly anchor', () => {
		expect(addCalendarInterval(date('2024-02-29'), 'YEAR', 1)).toBe('2025-02-28');
		expect(addCalendarInterval(date('2024-02-29'), 'YEAR', 4)).toBe('2028-02-29');
	});

	it('creates contiguous inclusive renewal periods from the next-period anchor and sequence', () => {
		expect(
			calculateNextPeriod({
				anchorDate: date('2026-08-25'),
				sequence: 0,
				billingUnit: 'MONTH',
				billingInterval: 1
			})
		).toEqual({ start: '2026-08-25', end: '2026-09-24', nextSequence: 1 });
		expect(
			calculateNextPeriod({
				anchorDate: date('2026-08-25'),
				sequence: 1,
				billingUnit: 'MONTH',
				billingInterval: 1
			})
		).toEqual({ start: '2026-09-25', end: '2026-10-24', nextSequence: 2 });
	});

	it('supports custom day/month/year counts and month ranges', () => {
		expect(addCalendarInterval(date('2026-07-01'), 'DAY', 14)).toBe('2026-07-15');
		expect(addCalendarInterval(date('2026-01-31'), 'MONTH', 3)).toBe('2026-04-30');
		expect(addCalendarInterval(date('2024-02-29'), 'YEAR', 2)).toBe('2026-02-28');
		expect(getCalendarMonthRange(date('2026-12-18'))).toEqual({
			start: '2026-12-01',
			endExclusive: '2027-01-01'
		});
	});
});
