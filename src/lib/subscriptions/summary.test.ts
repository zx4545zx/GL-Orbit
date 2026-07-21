import { describe, expect, it } from 'vitest';
import { parseCalendarDate } from './calendar.js';
import { classifyUrgency, evaluateBudget, isInForecastWindow, normalizeAlertDays } from './summary.js';

const date = (value: string) => parseCalendarDate(value)!;

describe('subscription summary rules', () => {
	it('normalizes at most ten unique alert days descending', () => {
		expect(normalizeAlertDays([1, 7, 3, 7])).toEqual([7, 3, 1]);
		expect(normalizeAlertDays([0, 366])).toBeNull();
		expect(normalizeAlertDays(Array.from({ length: 11 }, (_, index) => index + 1))).toBeNull();
	});

	it('uses exact remaining days and the smallest matching configured tier', () => {
		expect(classifyUrgency(date('2026-07-26'), date('2026-07-21'), [7, 3, 1], true, 'ACTIVE')).toEqual({
			daysRemaining: 5,
			state: 'UPCOMING',
			matchedAlertDay: 7,
			awaitingConfirmation: false
		});
		expect(
			classifyUrgency(date('2026-07-23'), date('2026-07-21'), [7, 3, 1], true, 'ACTIVE')
				.matchedAlertDay
		).toBe(3);
		expect(classifyUrgency(date('2026-07-21'), date('2026-07-21'), [], true, 'ACTIVE').state).toBe(
			'DUE_TODAY'
		);
		expect(classifyUrgency(date('2026-07-20'), date('2026-07-21'), [], true, 'ACTIVE')).toMatchObject({
			state: 'EXPIRED',
			awaitingConfirmation: true
		});
		expect(classifyUrgency(date('2026-07-20'), date('2026-07-21'), [], true, 'CANCELED').state).toBe(
			'SAFE'
		);
	});

	it('uses a half-open 30-date forecast window', () => {
		expect(isInForecastWindow(date('2026-07-21'), date('2026-07-21'))).toBe(true);
		expect(isInForecastWindow(date('2026-08-19'), date('2026-07-21'))).toBe(true);
		expect(isInForecastWindow(date('2026-08-20'), date('2026-07-21'))).toBe(false);
		expect(isInForecastWindow(date('2026-07-20'), date('2026-07-21'))).toBe(false);
	});

	it('evaluates budget thresholds from exact amounts', () => {
		expect(evaluateBudget('79.99', '100', 80)).toMatchObject({
			state: 'SAFE',
			usageBasisPoints: 7999
		});
		expect(evaluateBudget('80', '100', 80)).toMatchObject({
			state: 'NEAR',
			usageBasisPoints: 8000
		});
		expect(evaluateBudget('100', '100', 80)).toMatchObject({
			state: 'OVER',
			usageBasisPoints: 10000
		});
		expect(evaluateBudget('99999999999999', '0.0001', 80)).toMatchObject({
			state: 'OVER',
			usageBasisPoints: 10000
		});
	});
});
