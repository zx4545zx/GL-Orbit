import { addCalendarDays, compareCalendarDates, differenceInCalendarDays } from './calendar.js';
import { toScaleFour } from './money.js';
import type { BudgetState, CalendarDate, SubscriptionStatus, UrgencyState } from './types.js';

export function normalizeAlertDays(value: unknown): number[] | null {
	if (!Array.isArray(value) || value.length > 10) return null;
	if (
		!value.every(
			(day) => typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 365
		)
	) {
		return null;
	}
	return [...new Set(value)].sort((left, right) => right - left);
}

export function classifyUrgency(
	periodEnd: CalendarDate,
	today: CalendarDate,
	alertDays: number[],
	renewsAutomatically: boolean,
	status: SubscriptionStatus
): {
	daysRemaining: number;
	state: UrgencyState;
	matchedAlertDay: number | null;
	awaitingConfirmation: boolean;
} {
	const daysRemaining = differenceInCalendarDays(periodEnd, today);
	if (status === 'CANCELED') {
		return { daysRemaining, state: 'SAFE', matchedAlertDay: null, awaitingConfirmation: false };
	}
	if (daysRemaining < 0) {
		return {
			daysRemaining,
			state: 'EXPIRED',
			matchedAlertDay: null,
			awaitingConfirmation: renewsAutomatically
		};
	}
	if (daysRemaining === 0) {
		return {
			daysRemaining,
			state: 'DUE_TODAY',
			matchedAlertDay: null,
			awaitingConfirmation: renewsAutomatically
		};
	}
	const matchedAlertDay =
		[...alertDays].sort((left, right) => left - right).find((day) => daysRemaining <= day) ??
		null;
	return {
		daysRemaining,
		state: matchedAlertDay === null ? 'SAFE' : 'UPCOMING',
		matchedAlertDay,
		awaitingConfirmation: false
	};
}

export function isInForecastWindow(periodEnd: CalendarDate, today: CalendarDate): boolean {
	return (
		compareCalendarDates(periodEnd, today) >= 0 &&
		compareCalendarDates(periodEnd, addCalendarDays(today, 30)) < 0
	);
}

export function evaluateBudget(
	actual: string,
	monthlyLimit: string,
	warningPercent: number
): { state: BudgetState; usageBasisPoints: number } {
	const actualScaled = toScaleFour(actual);
	const limitScaled = toScaleFour(monthlyLimit);
	if (
		limitScaled <= 0n ||
		!Number.isInteger(warningPercent) ||
		warningPercent < 1 ||
		warningPercent > 100
	) {
		throw new RangeError('Invalid budget');
	}
	const rawUsageBasisPoints = (actualScaled * 10000n) / limitScaled;
	const usageBasisPoints = Number(rawUsageBasisPoints > 10000n ? 10000n : rawUsageBasisPoints);
	const state: BudgetState =
		actualScaled >= limitScaled
			? 'OVER'
			: actualScaled * 100n >= limitScaled * BigInt(warningPercent)
				? 'NEAR'
				: 'SAFE';
	return { state, usageBasisPoints };
}
