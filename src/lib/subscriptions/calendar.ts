import type { BillingUnit, CalendarDate } from './types.js';

export type CalendarParts = { year: number; month: number; day: number };

function daysFromCivil({ year: originalYear, month, day }: CalendarParts): number {
	let year = originalYear - (month <= 2 ? 1 : 0);
	const era = Math.floor(year / 400);
	const yearOfEra = year - era * 400;
	const shiftedMonth = month + (month > 2 ? -3 : 9);
	const dayOfYear = Math.floor((153 * shiftedMonth + 2) / 5) + day - 1;
	const dayOfEra =
		yearOfEra * 365 +
		Math.floor(yearOfEra / 4) -
		Math.floor(yearOfEra / 100) +
		dayOfYear;
	return era * 146097 + dayOfEra - 719468;
}

function civilFromDays(originalDays: number): CalendarParts {
	const days = originalDays + 719468;
	const era = Math.floor(days / 146097);
	const dayOfEra = days - era * 146097;
	const yearOfEra = Math.floor(
		(dayOfEra -
			Math.floor(dayOfEra / 1460) +
			Math.floor(dayOfEra / 36524) -
			Math.floor(dayOfEra / 146096)) /
			365
	);
	let year = yearOfEra + era * 400;
	const dayOfYear =
		dayOfEra -
		(365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
	const shiftedMonth = Math.floor((5 * dayOfYear + 2) / 153);
	const day = dayOfYear - Math.floor((153 * shiftedMonth + 2) / 5) + 1;
	const month = shiftedMonth + (shiftedMonth < 10 ? 3 : -9);
	year += month <= 2 ? 1 : 0;
	return { year, month, day };
}

function daysInMonth(year: number, month: number): number {
	const nextYear = month === 12 ? year + 1 : year;
	const nextMonth = month === 12 ? 1 : month + 1;
	return (
		daysFromCivil({ year: nextYear, month: nextMonth, day: 1 }) -
		daysFromCivil({ year, month, day: 1 })
	);
}

function formatParts({ year, month, day }: CalendarParts): CalendarDate {
	return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` as CalendarDate;
}

function parseParts(value: string): CalendarParts | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;
	const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
	if (parts.year < 1 || parts.year > 9999 || parts.month < 1 || parts.month > 12) return null;
	if (parts.day < 1 || parts.day > daysInMonth(parts.year, parts.month)) return null;
	return parts;
}

export function parseCalendarDate(value: unknown): CalendarDate | null {
	if (typeof value !== 'string') return null;
	const parts = parseParts(value);
	return parts && formatParts(parts) === value ? (value as CalendarDate) : null;
}

export function formatCalendarDate(parts: CalendarParts): CalendarDate {
	const value = formatParts(parts);
	if (!parseParts(value)) throw new RangeError('Invalid calendar date parts');
	return value;
}

function requiredParts(value: CalendarDate): CalendarParts {
	const parts = parseParts(value);
	if (!parts) throw new RangeError('Invalid CalendarDate');
	return parts;
}

export function compareCalendarDates(left: CalendarDate, right: CalendarDate): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

export function addCalendarDays(value: CalendarDate, days: number): CalendarDate {
	if (!Number.isSafeInteger(days)) throw new RangeError('Day offset must be a safe integer');
	return formatCalendarDate(civilFromDays(daysFromCivil(requiredParts(value)) + days));
}

export function differenceInCalendarDays(later: CalendarDate, earlier: CalendarDate): number {
	return daysFromCivil(requiredParts(later)) - daysFromCivil(requiredParts(earlier));
}

export function addCalendarInterval(
	value: CalendarDate,
	unit: BillingUnit,
	amount: number
): CalendarDate {
	if (!Number.isSafeInteger(amount)) throw new RangeError('Interval amount must be a safe integer');
	if (unit === 'DAY') return addCalendarDays(value, amount);
	const anchor = requiredParts(value);
	const monthDelta = unit === 'YEAR' ? amount * 12 : amount;
	const absoluteMonth = anchor.year * 12 + anchor.month - 1 + monthDelta;
	const year = Math.floor(absoluteMonth / 12);
	const month = absoluteMonth - year * 12 + 1;
	return formatCalendarDate({ year, month, day: Math.min(anchor.day, daysInMonth(year, month)) });
}

export function getCalendarMonthRange(today: CalendarDate): {
	start: CalendarDate;
	endExclusive: CalendarDate;
} {
	const { year, month } = requiredParts(today);
	const start = formatCalendarDate({ year, month, day: 1 });
	return { start, endExclusive: addCalendarInterval(start, 'MONTH', 1) };
}

export function calculateNextPeriod(input: {
	anchorDate: CalendarDate;
	sequence: number;
	billingUnit: BillingUnit;
	billingInterval: number;
}): { start: CalendarDate; end: CalendarDate; nextSequence: number } {
	if (!Number.isSafeInteger(input.sequence) || input.sequence < 0) {
		throw new RangeError('Invalid renewal sequence');
	}
	if (!Number.isSafeInteger(input.billingInterval) || input.billingInterval < 1) {
		throw new RangeError('Invalid billing interval');
	}
	const start = addCalendarInterval(
		input.anchorDate,
		input.billingUnit,
		input.sequence * input.billingInterval
	);
	const nextBoundary = addCalendarInterval(
		input.anchorDate,
		input.billingUnit,
		(input.sequence + 1) * input.billingInterval
	);
	return { start, end: addCalendarDays(nextBoundary, -1), nextSequence: input.sequence + 1 };
}
