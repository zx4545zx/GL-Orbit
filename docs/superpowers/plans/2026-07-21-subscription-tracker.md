# Subscription Tracker and Expense Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private subscription workspace where signed-in users track streaming periods, record only confirmed payments, compare actual spend with per-currency budgets, and see related GL series.

**Architecture:** Add three normalized Drizzle tables and a focused subscription domain. Shared pure modules own civil-date arithmetic, exact decimal money, and summary classification; server modules own validation, scoped reads, and atomic PostgreSQL CTE mutations; thin authenticated APIs and localized Svelte pages present the approved dashboard-first workflow.

**Tech Stack:** SvelteKit 2.20+, Svelte 5 runes, TypeScript 5.8 strict mode, Drizzle ORM 0.43, PostgreSQL/Neon HTTP, Vitest 4, Tailwind CSS 4, Paraglide, Svelte Testing Library with jsdom.

## Global Constraints

- Treat this approved spec as authoritative: `docs/superpowers/specs/2026-07-21-subscription-tracker-design.md`.
- Use PostgreSQL `numeric(18,4)` for money. Keep monetary values as canonical decimal strings or scale-four `bigint`; never sum with JavaScript `number`.
- Use PostgreSQL `date` and strict `YYYY-MM-DD` civil-date helpers for billing/payment dates. Never pass these values through `Date`, UTC timestamps, or `toISOString()`.
- Keep every currency separate. Do not add FX conversion or a mixed-currency total.
- Create a payment only from explicit initial-payment, manual-payment, or final renewal confirmation actions.
- Add no cron, background worker, push/email/SMS integration, notification row, notification schema change, persisted timezone, or new environment variable.
- Scope every read/write by `locals.user.id`. Return the same `404` for missing, deleted, and foreign-owned resources.
- Use `getDb()` in server modules/routes; never use the async `db` proxy in SSR.
- Use `.js` suffixes on TypeScript imports because the repository uses NodeNext resolution.
- Financial writes are pessimistic: disable pending controls and update visible authoritative values only after a successful server response.
- Use Svelte 5 runes (`$props`, `$state`, `$derived`, `$effect`) and localized Paraglide copy in both `messages/th.json` and `messages/en.json`; never edit generated `src/lib/i18n/paraglide/` files.
- Follow Orbit Editorial: sharp rectangular surfaces, restrained borders, no new rounded cards/pills, no rainbow/gradient dividers, visible focus, keyboard support, reduced motion, and touch targets of at least 44×44px.
- Use page-local skeletons only for date-sensitive or paginated regions. Do not recreate any route-level `*PendingShell.svelte` architecture.
- Do not run `npm run db:push`, mutate a live database, commit, amend, or push unless the user explicitly asks.

---

## Locked File Structure

### Shared subscription domain (safe for server and browser imports)

- Create `src/lib/subscriptions/types.ts` — shared request/response, list/detail, summary, cursor, and error types.
- Create `src/lib/subscriptions/calendar.ts` — strict civil-date parsing/arithmetic and stable-anchor renewal periods.
- Create `src/lib/subscriptions/calendar.test.ts` — month-end, leap-year, day-cycle, range, and no-UTC tests.
- Create `src/lib/subscriptions/money.ts` — ISO-currency validation and scale-four exact decimal operations.
- Create `src/lib/subscriptions/money.test.ts` — exponent, canonicalization, exact grouping, and large-value tests.
- Create `src/lib/subscriptions/summary.ts` — alert, forecast, and budget classification.
- Create `src/lib/subscriptions/summary.test.ts` — thresholds, due/expired, month, and day-29/day-30 tests.
- Create `src/lib/subscriptions/client.ts` — device-local today, API error localization, and non-optimistic fetch helper.
- Create `src/lib/subscriptions/client.test.ts` — local-date construction and stable error mapping tests.

### Database and server domain

- Modify `src/lib/server/db/schema.ts` — add enums and `userSubscriptions`, `subscriptionPayments`, and `subscriptionBudgets`.
- Generate `drizzle/0024_subscription_tracker.sql`, `drizzle/meta/0024_snapshot.json`, and update `drizzle/meta/_journal.json` through Drizzle Kit.
- Modify `src/lib/server/db/schema.test.ts` — assert ownership, idempotency, money/date, and soft-delete schema contracts.
- Create `src/lib/server/subscriptions/errors.ts` — typed domain errors and stable status metadata.
- Create `src/lib/server/subscriptions/validation.ts` — authoritative parsers for every mutation.
- Create `src/lib/server/subscriptions/validation.test.ts` — source XOR, cycles, dates, paid-date, alerts, and CAS tuple tests.
- Create `src/lib/server/subscriptions/cursor.ts` — opaque payment-history cursor encode/decode.
- Create `src/lib/server/subscriptions/cursor.test.ts` — round-trip and malformed cursor tests.
- Create `src/lib/server/subscriptions/queries.ts` — owned list/detail/platform/budget/payment/related-series reads.
- Create `src/lib/server/subscriptions/queries.test.ts` — user scoping, soft-delete, union/deduplication, and pagination tests.
- Create `src/lib/server/subscriptions/summary-query.ts` — exact actual/forecast/budget aggregates and warning rows.
- Create `src/lib/server/subscriptions/summary-query.test.ts` — query-boundary and currency-isolation tests.
- Create `src/lib/server/subscriptions/mutations.ts` — create/edit/delete, manual payments, budgets, renewal, and reversal.
- Create `src/lib/server/subscriptions/mutations.test.ts` — CTE atomicity, CAS, idempotency, ownership, immutable history, and reversal tests.
- Create `src/lib/server/subscriptions/api.ts` — JSON parsing, same-origin guard, auth/error responses, and private-cache headers.
- Create `src/lib/server/subscriptions/api.test.ts` — transport/status/redaction tests.

### Authenticated APIs

- Create `src/routes/api/subscriptions/+server.ts` and `server.test.ts` — list/create subscriptions.
- Create `src/routes/api/subscriptions/summary/+server.ts` and `server.test.ts` — device-date summary.
- Create `src/routes/api/subscriptions/[id]/+server.ts` and `server.test.ts` — detail, edit, soft-delete.
- Create `src/routes/api/subscriptions/[id]/renew/+server.ts` and `server.test.ts` — confirm one renewal.
- Create `src/routes/api/subscriptions/[id]/reverse-latest-renewal/+server.ts` and `server.test.ts` — reverse eligible latest renewal.
- Create `src/routes/api/subscriptions/[id]/payments/+server.ts` and `server.test.ts` — add manual payment.
- Create `src/routes/api/subscription-payments/[paymentId]/+server.ts` and `server.test.ts` — edit/delete initial or manual payment.
- Create `src/routes/api/subscription-budgets/[currency]/+server.ts` and `server.test.ts` — upsert/delete one budget.

### Localized pages and UI

- Create `src/routes/[lang=lang]/(app)/subscriptions/+page.server.ts` — authenticated stable dashboard load.
- Create `src/routes/[lang=lang]/(app)/subscriptions/+page.svelte` — dashboard orchestration and local summary refresh.
- Create `src/routes/[lang=lang]/(app)/subscriptions/new/+page.server.ts` — authenticated platform options.
- Create `src/routes/[lang=lang]/(app)/subscriptions/new/+page.svelte` — create workflow.
- Create `src/routes/[lang=lang]/(app)/subscriptions/[id]/+page.server.ts` — owned detail and first payment page.
- Create `src/routes/[lang=lang]/(app)/subscriptions/[id]/+page.svelte` — overview, history, actions, and related series.
- Create `src/routes/[lang=lang]/(app)/subscriptions/[id]/edit/+page.server.ts` — owned edit payload.
- Create `src/routes/[lang=lang]/(app)/subscriptions/[id]/edit/+page.svelte` — edit workflow.
- Create `src/lib/components/subscriptions/SubscriptionSummary.svelte` and `.test.ts` — actual/forecast/budget/alert panels.
- Create `src/lib/components/subscriptions/SubscriptionList.svelte` and `.test.ts` — filters and responsive rows.
- Create `src/lib/components/subscriptions/SubscriptionForm.svelte` and `.test.ts` — shared dedicated-page form.
- Create `src/lib/components/subscriptions/BudgetControls.svelte` and `.test.ts` — compact per-currency budget writes.
- Create `src/lib/components/subscriptions/RenewalDialog.svelte` and `.test.ts` — reviewed, pending-safe renewal confirmation.
- Create `src/lib/components/subscriptions/PaymentHistory.svelte` and `.test.ts` — cursor pagination, restrictions, corrections, and reversal.
- Modify `messages/th.json` and `messages/en.json` — all `subscriptions_*` labels, field messages, API errors, status text, and SEO copy.
- Modify `src/routes/[lang=lang]/(app)/menus/+page.svelte` — authenticated subscription entry.
- Modify `src/routes/[lang=lang]/(app)/profile/+page.svelte` — visible account-surface subscription entry.
- Modify `package.json` and `package-lock.json` — focused component-test dependencies only.

---

## Shared Interface Contract

Create these names once in `src/lib/subscriptions/types.ts`; every later task imports them rather than redefining request/response shapes:

```ts
export const billingUnits = ['DAY', 'MONTH', 'YEAR'] as const;
export const subscriptionStatuses = ['ACTIVE', 'CANCELED'] as const;
export const paymentKinds = ['INITIAL', 'RENEWAL', 'MANUAL'] as const;

export type BillingUnit = (typeof billingUnits)[number];
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];
export type PaymentKind = (typeof paymentKinds)[number];
export type CalendarDate = string & { readonly __calendarDate: unique symbol };

export type ScheduleVersion = {
	currentPeriodStart: CalendarDate;
	currentPeriodEnd: CalendarDate;
	renewalAnchorDate: CalendarDate;
	renewalSequence: number;
	billingUnit: BillingUnit;
	billingInterval: number;
};

export type SubscriptionWrite = {
	platformId: string | null;
	customPlatformName: string | null;
	planName: string | null;
	accountLabel: string | null;
	amount: string;
	currency: string;
	billingUnit: BillingUnit;
	billingInterval: number;
	currentPeriodStart: CalendarDate;
	currentPeriodEnd: CalendarDate;
	renewsAutomatically: boolean;
	status: SubscriptionStatus;
	alertDays: number[];
};

export type CreateSubscriptionRequest = SubscriptionWrite & {
	recordInitialPayment: boolean;
	initialPaidDate: CalendarDate | null;
};

export type UpdateSubscriptionRequest = SubscriptionWrite & {
	expectedSchedule: ScheduleVersion;
};

export type PaymentWriteRequest = {
	amount: string;
	currency: string;
	paidDate: CalendarDate;
	servicePeriodStart: CalendarDate;
	servicePeriodEnd: CalendarDate;
};

export type RenewSubscriptionRequest = {
	expectedPeriodEnd: CalendarDate;
	paidDate: CalendarDate;
	amount: string;
	currency: string;
};

export type ReverseRenewalRequest = { paymentId: string };
export type BudgetWriteRequest = { monthlyLimit: string; warningPercent: number };
export type RenewalResult = {
	paymentId: string;
	currentPeriodStart: CalendarDate;
	currentPeriodEnd: CalendarDate;
	renewalSequence: number;
};
export type ReversalResult = {
	paymentId: string;
	currentPeriodStart: CalendarDate;
	currentPeriodEnd: CalendarDate;
	renewalSequence: number;
};

export type SubscriptionErrorCode =
	| 'AUTH_REQUIRED'
	| 'INVALID_INPUT'
	| 'INTERNAL_ERROR'
	| 'UNSUPPORTED_CURRENCY'
	| 'PLATFORM_NOT_FOUND'
	| 'SUBSCRIPTION_NOT_FOUND'
	| 'PAYMENT_NOT_FOUND'
	| 'RENEWAL_CONFLICT'
	| 'RENEWAL_ALREADY_RECORDED'
	| 'RENEWAL_REVERSAL_NOT_ALLOWED';

export type FieldErrorCode =
	| 'required'
	| 'invalid'
	| 'too_long'
	| 'out_of_range'
	| 'future_date'
	| 'fraction_digits'
	| 'source_xor'
	| 'date_order'
	| 'duplicate';

export type SubscriptionApiError = {
	ok: false;
	code: SubscriptionErrorCode;
	fieldErrors?: Record<string, FieldErrorCode[]>;
};

export type PlatformOption = { id: string; name: string; logoUrl: string | null };
export type RelatedSeries = { id: string; titleTh: string | null; titleEn: string; posterUrl: string | null };

export type SubscriptionListItem = SubscriptionWrite & {
	id: string;
	platform: PlatformOption | null;
	scheduleVersion: ScheduleVersion;
	nextPeriod: { start: CalendarDate; end: CalendarDate };
	relatedSeries: RelatedSeries[];
	relatedSeriesRemaining: number;
};

export type PaymentItem = PaymentWriteRequest & {
	id: string;
	kind: PaymentKind;
	createdAt: string;
	canEdit: boolean;
	canDelete: boolean;
	canReverse: boolean;
};

export type PaymentPage = { items: PaymentItem[]; nextCursor: string | null };

export type SubscriptionDetail = SubscriptionListItem & {
	payments: PaymentPage;
	relatedSeries: RelatedSeries[];
};

export type CurrencyTotal = { currency: string; total: string };
export type UrgencyState = 'SAFE' | 'UPCOMING' | 'DUE_TODAY' | 'EXPIRED';
export type BudgetState = 'SAFE' | 'NEAR' | 'OVER';
export type SubscriptionUrgency = {
	subscriptionId: string;
	daysRemaining: number;
	state: UrgencyState;
	matchedAlertDay: number | null;
	awaitingConfirmation: boolean;
};
export type BudgetSummary = {
	currency: string;
	actual: string;
	monthlyLimit: string;
	warningPercent: number;
	state: BudgetState;
	usageBasisPoints: number;
};
export type SubscriptionSummary = {
	today: CalendarDate;
	monthStart: CalendarDate;
	monthEndExclusive: CalendarDate;
	forecastEndExclusive: CalendarDate;
	actualTotals: CurrencyTotal[];
	forecastTotals: CurrencyTotal[];
	budgets: BudgetSummary[];
	urgencies: SubscriptionUrgency[];
	counts: { expired: number; dueToday: number; awaitingConfirmation: number };
};

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiResult<T> = ApiSuccess<T> | SubscriptionApiError;
```

The dashboard load returns `{ subscriptions: SubscriptionListItem[]; budgets: Array<{ currency: string; monthlyLimit: string; warningPercent: number }>; platforms: PlatformOption[] }`. API success responses always wrap data in `{ ok: true, data }`; error responses always use `SubscriptionApiError`.

---

### Task 1: Implement Civil-Date and Stable Renewal Arithmetic

**Files:**
- Create: `src/lib/subscriptions/types.ts`
- Create: `src/lib/subscriptions/calendar.ts`
- Test: `src/lib/subscriptions/calendar.test.ts`

**Interfaces:**
- Produces: the shared types above plus `parseCalendarDate`, `formatCalendarDate`, `compareCalendarDates`, `addCalendarDays`, `addCalendarInterval`, `differenceInCalendarDays`, `getCalendarMonthRange`, and `calculateNextPeriod`.
- Consumes: no database, browser, locale, or JavaScript `Date` API.

- [ ] **Step 1: Write strict date and recurrence tests**

Create `src/lib/subscriptions/calendar.test.ts` with concrete cases:

```ts
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
		expect(calculateNextPeriod({
			anchorDate: date('2026-08-25'),
			sequence: 0,
			billingUnit: 'MONTH',
			billingInterval: 1
		})).toEqual({ start: '2026-08-25', end: '2026-09-24', nextSequence: 1 });
		expect(calculateNextPeriod({
			anchorDate: date('2026-08-25'),
			sequence: 1,
			billingUnit: 'MONTH',
			billingInterval: 1
		})).toEqual({ start: '2026-09-25', end: '2026-10-24', nextSequence: 2 });
	});

	it('supports custom day/month/year counts and month ranges', () => {
		expect(addCalendarInterval(date('2026-07-01'), 'DAY', 14)).toBe('2026-07-15');
		expect(addCalendarInterval(date('2026-01-31'), 'MONTH', 3)).toBe('2026-04-30');
		expect(addCalendarInterval(date('2024-02-29'), 'YEAR', 2)).toBe('2026-02-28');
		expect(getCalendarMonthRange(date('2026-12-18'))).toEqual({ start: '2026-12-01', endExclusive: '2027-01-01' });
	});
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/subscriptions/calendar.test.ts`

Expected: FAIL because `calendar.ts` and the shared types do not exist.

- [ ] **Step 3: Add the shared type contract**

Create `src/lib/subscriptions/types.ts` with the complete code from **Shared Interface Contract**. Do not add server imports to this file.

- [ ] **Step 4: Implement integer-only civil-date arithmetic**

Create `src/lib/subscriptions/calendar.ts`:

```ts
import type { BillingUnit, CalendarDate } from './types.js';

export type CalendarParts = { year: number; month: number; day: number };

function daysFromCivil({ year: originalYear, month, day }: CalendarParts): number {
	let year = originalYear - (month <= 2 ? 1 : 0);
	const era = Math.floor(year / 400);
	const yearOfEra = year - era * 400;
	const shiftedMonth = month + (month > 2 ? -3 : 9);
	const dayOfYear = Math.floor((153 * shiftedMonth + 2) / 5) + day - 1;
	const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
	return era * 146097 + dayOfEra - 719468;
}

function civilFromDays(originalDays: number): CalendarParts {
	const days = originalDays + 719468;
	const era = Math.floor(days / 146097);
	const dayOfEra = days - era * 146097;
	const yearOfEra = Math.floor((dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36524) - Math.floor(dayOfEra / 146096)) / 365);
	let year = yearOfEra + era * 400;
	const dayOfYear = dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
	const shiftedMonth = Math.floor((5 * dayOfYear + 2) / 153);
	const day = dayOfYear - Math.floor((153 * shiftedMonth + 2) / 5) + 1;
	const month = shiftedMonth + (shiftedMonth < 10 ? 3 : -9);
	year += month <= 2 ? 1 : 0;
	return { year, month, day };
}

function daysInMonth(year: number, month: number): number {
	const nextYear = month === 12 ? year + 1 : year;
	const nextMonth = month === 12 ? 1 : month + 1;
	return daysFromCivil({ year: nextYear, month: nextMonth, day: 1 }) - daysFromCivil({ year, month, day: 1 });
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
	return parts && formatParts(parts) === value ? value as CalendarDate : null;
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

export function addCalendarInterval(value: CalendarDate, unit: BillingUnit, amount: number): CalendarDate {
	if (!Number.isSafeInteger(amount)) throw new RangeError('Interval amount must be a safe integer');
	if (unit === 'DAY') return addCalendarDays(value, amount);
	const anchor = requiredParts(value);
	const monthDelta = unit === 'YEAR' ? amount * 12 : amount;
	const absoluteMonth = anchor.year * 12 + anchor.month - 1 + monthDelta;
	const year = Math.floor(absoluteMonth / 12);
	const month = absoluteMonth - year * 12 + 1;
	return formatCalendarDate({ year, month, day: Math.min(anchor.day, daysInMonth(year, month)) });
}

export function getCalendarMonthRange(today: CalendarDate): { start: CalendarDate; endExclusive: CalendarDate } {
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
	if (!Number.isSafeInteger(input.sequence) || input.sequence < 0) throw new RangeError('Invalid renewal sequence');
	if (!Number.isSafeInteger(input.billingInterval) || input.billingInterval < 1) throw new RangeError('Invalid billing interval');
	const start = addCalendarInterval(input.anchorDate, input.billingUnit, input.sequence * input.billingInterval);
	const nextBoundary = addCalendarInterval(input.anchorDate, input.billingUnit, (input.sequence + 1) * input.billingInterval);
	return { start, end: addCalendarDays(nextBoundary, -1), nextSequence: input.sequence + 1 };
}
```

- [ ] **Step 5: Run tests and static checks**

Run:

```bash
npm test -- src/lib/subscriptions/calendar.test.ts
npm run check
```

Expected: date tests PASS; `npm run check` reports no type errors from the new modules.

---

### Task 2: Implement Exact Money and Summary Classification

**Files:**
- Create: `src/lib/subscriptions/money.ts`
- Test: `src/lib/subscriptions/money.test.ts`
- Create: `src/lib/subscriptions/summary.ts`
- Test: `src/lib/subscriptions/summary.test.ts`

**Interfaces:**
- Consumes: `CalendarDate`, `BillingUnit`, `CurrencyTotal`, `BudgetState`, and urgency types from `types.ts`; date helpers from Task 1.
- Produces: `normalizeCurrency`, `getCurrencyMinorUnits`, `parseMoney`, `toScaleFour`, `fromScaleFour`, `sumCurrencyAmounts`, `normalizeAlertDays`, `classifyUrgency`, `isInForecastWindow`, and `evaluateBudget`.

- [ ] **Step 1: Write exact-money tests**

Create `src/lib/subscriptions/money.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fromScaleFour, getCurrencyMinorUnits, parseMoney, sumCurrencyAmounts, toScaleFour } from './money.js';

describe('subscription money', () => {
	it('enforces ISO currency exponents', () => {
		expect(getCurrencyMinorUnits('JPY')).toBe(0);
		expect(getCurrencyMinorUnits('USD')).toBe(2);
		expect(getCurrencyMinorUnits('KWD')).toBe(3);
		expect(parseMoney('1.00', 'JPY')).toEqual({ ok: false, reason: 'fraction_digits' });
		expect(parseMoney('1.234', 'USD')).toEqual({ ok: false, reason: 'fraction_digits' });
	});

	it('canonicalizes without binary floating point', () => {
		expect(parseMoney('00012.30', 'USD')).toEqual({ ok: true, value: '12.3' });
		expect(toScaleFour('0.1') + toScaleFour('0.2')).toBe(3000n);
		expect(fromScaleFour(3000n)).toBe('0.3');
	});

	it('rejects negatives, exponent notation, overflow, and unsupported codes', () => {
		expect(parseMoney('-1', 'USD').ok).toBe(false);
		expect(parseMoney('1e2', 'USD').ok).toBe(false);
		expect(parseMoney('100000000000000', 'USD').ok).toBe(false);
		expect(parseMoney('1', 'ZZZ')).toEqual({ ok: false, reason: 'unsupported_currency' });
	});

	it('groups currencies independently and preserves exact large totals', () => {
		expect(sumCurrencyAmounts([
		{ currency: 'USD', amount: '900719925474.09' },
		{ currency: 'USD', amount: '0.01' },
		{ currency: 'THB', amount: '199' }
	])).toEqual([
		{ currency: 'THB', total: '199' },
		{ currency: 'USD', total: '900719925474.1' }
	]);
	});
});
```

- [ ] **Step 2: Write alert, forecast, and budget tests**

Create `src/lib/subscriptions/summary.test.ts`:

```ts
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
			daysRemaining: 5, state: 'UPCOMING', matchedAlertDay: 7, awaitingConfirmation: false
		});
		expect(classifyUrgency(date('2026-07-23'), date('2026-07-21'), [7, 3, 1], true, 'ACTIVE').matchedAlertDay).toBe(3);
		expect(classifyUrgency(date('2026-07-21'), date('2026-07-21'), [], true, 'ACTIVE').state).toBe('DUE_TODAY');
		expect(classifyUrgency(date('2026-07-20'), date('2026-07-21'), [], true, 'ACTIVE')).toMatchObject({ state: 'EXPIRED', awaitingConfirmation: true });
		expect(classifyUrgency(date('2026-07-20'), date('2026-07-21'), [], true, 'CANCELED').state).toBe('SAFE');
	});

	it('uses a half-open 30-date forecast window', () => {
		expect(isInForecastWindow(date('2026-07-21'), date('2026-07-21'))).toBe(true);
		expect(isInForecastWindow(date('2026-08-19'), date('2026-07-21'))).toBe(true);
		expect(isInForecastWindow(date('2026-08-20'), date('2026-07-21'))).toBe(false);
		expect(isInForecastWindow(date('2026-07-20'), date('2026-07-21'))).toBe(false);
	});

	it('evaluates budget thresholds from exact amounts', () => {
		expect(evaluateBudget('79.99', '100', 80)).toMatchObject({ state: 'SAFE', usageBasisPoints: 7999 });
		expect(evaluateBudget('80', '100', 80)).toMatchObject({ state: 'NEAR', usageBasisPoints: 8000 });
		expect(evaluateBudget('100', '100', 80)).toMatchObject({ state: 'OVER', usageBasisPoints: 10000 });
		expect(evaluateBudget('99999999999999', '0.0001', 80)).toMatchObject({ state: 'OVER', usageBasisPoints: 10000 });
	});
});
```

- [ ] **Step 3: Run both tests and verify RED**

Run: `npm test -- src/lib/subscriptions/money.test.ts src/lib/subscriptions/summary.test.ts`

Expected: FAIL because both implementations are absent.

- [ ] **Step 4: Implement exact decimal helpers**

Create `src/lib/subscriptions/money.ts`:

```ts
import type { CurrencyTotal } from './types.js';

const supportedCurrencies = new Set(Intl.supportedValuesOf('currency'));
const DECIMAL_PATTERN = /^(\d+)(?:\.(\d+))?$/;

export type MoneyParseFailure = 'invalid' | 'fraction_digits' | 'unsupported_currency' | 'out_of_range';

export function normalizeCurrency(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const currency = value.trim().toUpperCase();
	return /^[A-Z]{3}$/.test(currency) && supportedCurrencies.has(currency) ? currency : null;
}

export function getCurrencyMinorUnits(value: unknown): number | null {
	const currency = normalizeCurrency(value);
	if (!currency) return null;
	return Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits;
}

export function parseMoney(value: unknown, currencyValue: unknown, options: { positive?: boolean } = {}):
	| { ok: true; value: string }
	| { ok: false; reason: MoneyParseFailure } {
	const currency = normalizeCurrency(currencyValue);
	if (!currency) return { ok: false, reason: 'unsupported_currency' };
	if (typeof value !== 'string') return { ok: false, reason: 'invalid' };
	const match = DECIMAL_PATTERN.exec(value.trim());
	if (!match) return { ok: false, reason: 'invalid' };
	const integer = match[1].replace(/^0+(?=\d)/, '');
	const fraction = (match[2] ?? '').replace(/0+$/, '');
	const minorUnits = getCurrencyMinorUnits(currency)!;
	if (fraction.length > Math.min(4, minorUnits)) return { ok: false, reason: 'fraction_digits' };
	if (integer.length > 14) return { ok: false, reason: 'out_of_range' };
	const canonical = fraction ? `${integer}.${fraction}` : integer;
	if (options.positive && toScaleFour(canonical) <= 0n) return { ok: false, reason: 'out_of_range' };
	return { ok: true, value: canonical };
}

export function toScaleFour(value: string): bigint {
	const match = DECIMAL_PATTERN.exec(value);
	if (!match || (match[2]?.length ?? 0) > 4) throw new RangeError('Invalid scale-four decimal');
	return BigInt(match[1]) * 10000n + BigInt((match[2] ?? '').padEnd(4, '0'));
}

export function fromScaleFour(value: bigint): string {
	if (value < 0n) throw new RangeError('Negative money is unsupported');
	const integer = value / 10000n;
	const fraction = String(value % 10000n).padStart(4, '0').replace(/0+$/, '');
	return fraction ? `${integer}.${fraction}` : String(integer);
}

export function sumCurrencyAmounts(rows: Array<{ currency: string; amount: string }>): CurrencyTotal[] {
	const totals = new Map<string, bigint>();
	for (const row of rows) totals.set(row.currency, (totals.get(row.currency) ?? 0n) + toScaleFour(row.amount));
	return [...totals.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([currency, total]) => ({ currency, total: fromScaleFour(total) }));
}
```

- [ ] **Step 5: Implement pure summary rules**

Create `src/lib/subscriptions/summary.ts`:

```ts
import { addCalendarDays, compareCalendarDates, differenceInCalendarDays } from './calendar.js';
import { toScaleFour } from './money.js';
import type { BudgetState, CalendarDate, SubscriptionStatus, UrgencyState } from './types.js';

export function normalizeAlertDays(value: unknown): number[] | null {
	if (!Array.isArray(value) || value.length > 10) return null;
	if (!value.every((day) => typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 365)) return null;
	return [...new Set(value)].sort((left, right) => right - left);
}

export function classifyUrgency(
	periodEnd: CalendarDate,
	today: CalendarDate,
	alertDays: number[],
	renewsAutomatically: boolean,
	status: SubscriptionStatus
): { daysRemaining: number; state: UrgencyState; matchedAlertDay: number | null; awaitingConfirmation: boolean } {
	const daysRemaining = differenceInCalendarDays(periodEnd, today);
	if (status === 'CANCELED') return { daysRemaining, state: 'SAFE', matchedAlertDay: null, awaitingConfirmation: false };
	if (daysRemaining < 0) return { daysRemaining, state: 'EXPIRED', matchedAlertDay: null, awaitingConfirmation: renewsAutomatically };
	if (daysRemaining === 0) return { daysRemaining, state: 'DUE_TODAY', matchedAlertDay: null, awaitingConfirmation: renewsAutomatically };
	const matchedAlertDay = [...alertDays].sort((left, right) => left - right).find((day) => daysRemaining <= day) ?? null;
	return { daysRemaining, state: matchedAlertDay === null ? 'SAFE' : 'UPCOMING', matchedAlertDay, awaitingConfirmation: false };
}

export function isInForecastWindow(periodEnd: CalendarDate, today: CalendarDate): boolean {
	return compareCalendarDates(periodEnd, today) >= 0 && compareCalendarDates(periodEnd, addCalendarDays(today, 30)) < 0;
}

export function evaluateBudget(actual: string, monthlyLimit: string, warningPercent: number): { state: BudgetState; usageBasisPoints: number } {
	const actualScaled = toScaleFour(actual);
	const limitScaled = toScaleFour(monthlyLimit);
	if (limitScaled <= 0n || !Number.isInteger(warningPercent) || warningPercent < 1 || warningPercent > 100) throw new RangeError('Invalid budget');
	const rawUsageBasisPoints = (actualScaled * 10000n) / limitScaled;
	const usageBasisPoints = Number(rawUsageBasisPoints > 10000n ? 10000n : rawUsageBasisPoints);
	const state: BudgetState = actualScaled >= limitScaled ? 'OVER' : actualScaled * 100n >= limitScaled * BigInt(warningPercent) ? 'NEAR' : 'SAFE';
	return { state, usageBasisPoints };
}
```

- [ ] **Step 6: Run focused tests and check**

Run:

```bash
npm test -- src/lib/subscriptions/calendar.test.ts src/lib/subscriptions/money.test.ts src/lib/subscriptions/summary.test.ts
npm run check
```

Expected: all focused tests PASS and no type errors.

---

### Task 3: Add the Additive Subscription Schema and Migration

**Files:**
- Modify: `src/lib/server/db/schema.ts`
- Modify: `src/lib/server/db/schema.test.ts`
- Generate: `drizzle/0024_subscription_tracker.sql`
- Generate: `drizzle/meta/0024_snapshot.json`
- Modify through generator: `drizzle/meta/_journal.json`

**Interfaces:**
- Consumes: existing `users` and `platforms` tables.
- Produces: `subscriptionStatusEnum`, `subscriptionBillingUnitEnum`, `subscriptionPaymentKindEnum`, `userSubscriptions`, `subscriptionPayments`, and `subscriptionBudgets` exports.

- [ ] **Step 1: Write schema contract tests before changing the schema**

Extend `src/lib/server/db/schema.test.ts` with imports and assertions that inspect Drizzle metadata:

```ts
import { getTableConfig } from 'drizzle-orm/pg-core';
import { subscriptionBudgets, subscriptionPayments, userSubscriptions } from './schema.js';

describe('subscription schema', () => {
	it('uses date-only service fields and numeric(18,4) money', () => {
		const subscription = getTableConfig(userSubscriptions);
		expect(subscription.columns.find((column) => column.name === 'amount')?.getSQLType()).toBe('numeric(18, 4)');
		expect(subscription.columns.find((column) => column.name === 'current_period_end')?.getSQLType()).toBe('date');
		const payment = getTableConfig(subscriptionPayments);
		expect(payment.columns.find((column) => column.name === 'paid_date')?.getSQLType()).toBe('date');
	});

	it('defines composite ownership and live renewal idempotency constraints', () => {
		const subscription = getTableConfig(userSubscriptions);
		const payment = getTableConfig(subscriptionPayments);
		expect(subscription.uniqueConstraints.some((item) => item.name === 'user_subscriptions_user_id_id_unique')).toBe(true);
		expect(payment.foreignKeys.some((item) => item.getName() === 'subscription_payments_user_subscription_fk')).toBe(true);
		expect(payment.indexes.some((item) => item.config.name === 'subscription_payments_live_renewal_unique')).toBe(true);
	});

	it('keeps budgets unique per user and currency', () => {
		const budget = getTableConfig(subscriptionBudgets);
		expect(budget.uniqueConstraints.some((item) => item.name === 'subscription_budgets_user_currency_unique')).toBe(true);
	});
});
```

Adapt property access only if the installed Drizzle metadata API names differ; keep the three exact behavioral assertions.

- [ ] **Step 2: Run the schema test and verify RED**

Run: `npm test -- src/lib/server/db/schema.test.ts`

Expected: FAIL because subscription exports do not exist.

- [ ] **Step 3: Add imports, enums, and tables**

Add `date`, `foreignKey`, `numeric`, and `unique` to the `drizzle-orm/pg-core` import. Add these enums beside existing enums:

```ts
export const subscriptionStatusEnum = pgEnum('subscription_status', ['ACTIVE', 'CANCELED']);
export const subscriptionBillingUnitEnum = pgEnum('subscription_billing_unit', ['DAY', 'MONTH', 'YEAR']);
export const subscriptionPaymentKindEnum = pgEnum('subscription_payment_kind', ['INITIAL', 'RENEWAL', 'MANUAL']);
```

Add the following tables after `platforms` so subscription ownership/catalog references remain easy to find:

```ts
export const userSubscriptions = pgTable('user_subscriptions', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	platformId: uuid('platform_id').references(() => platforms.id, { onDelete: 'restrict' }),
	customPlatformName: varchar('custom_platform_name', { length: 255 }),
	planName: varchar('plan_name', { length: 120 }),
	accountLabel: varchar('account_label', { length: 120 }),
	amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
	currency: varchar('currency', { length: 3 }).notNull(),
	billingUnit: subscriptionBillingUnitEnum('billing_unit').notNull(),
	billingInterval: integer('billing_interval').notNull(),
	currentPeriodStart: date('current_period_start').notNull(),
	currentPeriodEnd: date('current_period_end').notNull(),
	renewalAnchorDate: date('renewal_anchor_date').notNull(),
	renewalSequence: integer('renewal_sequence').notNull().default(0),
	renewsAutomatically: boolean('renews_automatically').notNull().default(true),
	status: subscriptionStatusEnum('status').notNull().default('ACTIVE'),
	alertDays: integer('alert_days').array().notNull().default(sql`ARRAY[]::integer[]`),
	canceledAt: timestamp('canceled_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => ({
	userIdIdUnique: unique('user_subscriptions_user_id_id_unique').on(table.userId, table.id),
	activeDueIndex: index('user_subscriptions_active_due_idx').on(table.userId, table.currentPeriodEnd).where(sql`${table.deletedAt} IS NULL AND ${table.status} = 'ACTIVE'`),
	userLookupIndex: index('user_subscriptions_user_lookup_idx').on(table.userId, table.id).where(sql`${table.deletedAt} IS NULL`),
	sourceXor: check('user_subscriptions_source_xor', sql`((${table.platformId} IS NOT NULL)::int + (NULLIF(BTRIM(${table.customPlatformName}), '') IS NOT NULL)::int) = 1`),
	amountNonNegative: check('user_subscriptions_amount_non_negative', sql`${table.amount} >= 0`),
	currencyShape: check('user_subscriptions_currency_shape', sql`${table.currency} ~ '^[A-Z]{3}$'`),
	periodOrder: check('user_subscriptions_period_order', sql`${table.currentPeriodStart} <= ${table.currentPeriodEnd}`),
	intervalRange: check('user_subscriptions_interval_range', sql`(${table.billingUnit} = 'DAY' AND ${table.billingInterval} BETWEEN 1 AND 365) OR (${table.billingUnit} = 'MONTH' AND ${table.billingInterval} BETWEEN 1 AND 120) OR (${table.billingUnit} = 'YEAR' AND ${table.billingInterval} BETWEEN 1 AND 20)`),
	sequenceNonNegative: check('user_subscriptions_sequence_non_negative', sql`${table.renewalSequence} >= 0`),
	alertDaysRange: check('user_subscriptions_alert_days_range', sql`cardinality(${table.alertDays}) <= 10 AND array_position(${table.alertDays}, NULL) IS NULL AND 0 < ALL(${table.alertDays}) AND 366 > ALL(${table.alertDays})`),
	canceledState: check('user_subscriptions_canceled_state', sql`(${table.status} = 'CANCELED') = (${table.canceledAt} IS NOT NULL)`)
}));

export const subscriptionPayments = pgTable('subscription_payments', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	subscriptionId: uuid('subscription_id').notNull(),
	kind: subscriptionPaymentKindEnum('kind').notNull(),
	amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
	currency: varchar('currency', { length: 3 }).notNull(),
	paidDate: date('paid_date').notNull(),
	servicePeriodStart: date('service_period_start').notNull(),
	servicePeriodEnd: date('service_period_end').notNull(),
	renewalFromPeriodStart: date('renewal_from_period_start'),
	renewalFromPeriodEnd: date('renewal_from_period_end'),
	renewalAnchorBefore: date('renewal_anchor_before'),
	renewalSequenceBefore: integer('renewal_sequence_before'),
	billingUnitSnapshot: subscriptionBillingUnitEnum('billing_unit_snapshot'),
	billingIntervalSnapshot: integer('billing_interval_snapshot'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => ({
	ownershipForeignKey: foreignKey({
		columns: [table.userId, table.subscriptionId],
		foreignColumns: [userSubscriptions.userId, userSubscriptions.id],
		name: 'subscription_payments_user_subscription_fk'
	}).onDelete('cascade'),
	userPaidIndex: index('subscription_payments_user_paid_idx').on(table.userId, table.paidDate.desc(), table.id).where(sql`${table.deletedAt} IS NULL`),
	subscriptionHistoryIndex: index('subscription_payments_subscription_history_idx').on(table.subscriptionId, table.paidDate.desc(), table.createdAt.desc(), table.id.desc()).where(sql`${table.deletedAt} IS NULL`),
	liveRenewalUnique: uniqueIndex('subscription_payments_live_renewal_unique').on(table.subscriptionId, table.renewalFromPeriodEnd).where(sql`${table.kind} = 'RENEWAL' AND ${table.deletedAt} IS NULL`),
	amountNonNegative: check('subscription_payments_amount_non_negative', sql`${table.amount} >= 0`),
	currencyShape: check('subscription_payments_currency_shape', sql`${table.currency} ~ '^[A-Z]{3}$'`),
	periodOrder: check('subscription_payments_period_order', sql`${table.servicePeriodStart} <= ${table.servicePeriodEnd}`),
	renewalSnapshots: check('subscription_payments_renewal_snapshots', sql`(${table.kind} = 'RENEWAL' AND ${table.renewalFromPeriodStart} IS NOT NULL AND ${table.renewalFromPeriodEnd} IS NOT NULL AND ${table.renewalAnchorBefore} IS NOT NULL AND ${table.renewalSequenceBefore} IS NOT NULL AND ${table.billingUnitSnapshot} IS NOT NULL AND ${table.billingIntervalSnapshot} IS NOT NULL) OR (${table.kind} <> 'RENEWAL' AND ${table.renewalFromPeriodStart} IS NULL AND ${table.renewalFromPeriodEnd} IS NULL AND ${table.renewalAnchorBefore} IS NULL AND ${table.renewalSequenceBefore} IS NULL AND ${table.billingUnitSnapshot} IS NULL AND ${table.billingIntervalSnapshot} IS NULL)`)
}));

export const subscriptionBudgets = pgTable('subscription_budgets', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	currency: varchar('currency', { length: 3 }).notNull(),
	monthlyLimit: numeric('monthly_limit', { precision: 18, scale: 4 }).notNull(),
	warningPercent: integer('warning_percent').notNull().default(80),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	userCurrencyUnique: unique('subscription_budgets_user_currency_unique').on(table.userId, table.currency),
	userCurrencyIndex: index('subscription_budgets_user_currency_idx').on(table.userId, table.currency),
	limitPositive: check('subscription_budgets_limit_positive', sql`${table.monthlyLimit} > 0`),
	currencyShape: check('subscription_budgets_currency_shape', sql`${table.currency} ~ '^[A-Z]{3}$'`),
	warningRange: check('subscription_budgets_warning_range', sql`${table.warningPercent} BETWEEN 1 AND 100`)
}));
```

- [ ] **Step 4: Generate the named additive migration**

Run:

```bash
npm run db:generate -- --name subscription_tracker
```

Expected: Drizzle creates the next migration (`0024_subscription_tracker.sql`), updates `_journal.json`, and adds `0024_snapshot.json`. If the numeric prefix differs because another migration landed, keep the generated prefix and update this plan's filename references only; never rename migration metadata manually.

- [ ] **Step 5: Inspect migration invariants**

Open the generated SQL and verify it contains all three enum types, all three tables, the composite ownership FK, and the partial live-renewal index. Confirm the relevant SQL includes:

```sql
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'CANCELED');
CREATE TYPE "public"."subscription_billing_unit" AS ENUM('DAY', 'MONTH', 'YEAR');
CREATE TYPE "public"."subscription_payment_kind" AS ENUM('INITIAL', 'RENEWAL', 'MANUAL');
CREATE TABLE "user_subscriptions";
CREATE TABLE "subscription_payments";
CREATE TABLE "subscription_budgets";
CREATE UNIQUE INDEX "subscription_payments_live_renewal_unique"
  ON "subscription_payments" USING btree ("subscription_id", "renewal_from_period_end")
  WHERE "subscription_payments"."kind" = 'RENEWAL' AND "subscription_payments"."deleted_at" IS NULL;
```

Also verify no statement alters existing data, notifications, push subscriptions, users, or timezone fields. Do not run `db:push`.

- [ ] **Step 6: Run schema and migration checks**

Run:

```bash
npm test -- src/lib/server/db/schema.test.ts
npm run check
git diff --check
```

Expected: tests/check PASS and no whitespace errors.

---

### Task 4: Add Stable Errors, Authoritative Validation, and Payment Cursors

**Files:**
- Create: `src/lib/server/subscriptions/errors.ts`
- Create: `src/lib/server/subscriptions/validation.ts`
- Test: `src/lib/server/subscriptions/validation.test.ts`
- Create: `src/lib/server/subscriptions/cursor.ts`
- Test: `src/lib/server/subscriptions/cursor.test.ts`

**Interfaces:**
- Consumes: shared request types, date helpers, money helpers, and alert normalization from Tasks 1–2.
- Produces: `SubscriptionDomainError`, `parseCreateSubscriptionRequest`, `parseUpdateSubscriptionRequest`, `parsePaymentWriteRequest`, `parseRenewSubscriptionRequest`, `parseReverseRenewalRequest`, `parseBudgetCurrency`, `parseBudgetWriteRequest`, `encodePaymentCursor`, and `decodePaymentCursor`.

- [ ] **Step 1: Write validation tests for every mutation boundary**

Create `src/lib/server/subscriptions/validation.test.ts`. Use this valid baseline and table-driven invalid cases:

```ts
import { describe, expect, it } from 'vitest';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { SubscriptionDomainError } from './errors.js';
import {
	parseBudgetCurrency,
	parseBudgetWriteRequest,
	parseCreateSubscriptionRequest,
	parsePaymentWriteRequest,
	parseRenewSubscriptionRequest,
	parseReverseRenewalRequest,
	parseUpdateSubscriptionRequest
} from './validation.js';

const today = parseCalendarDate('2026-07-21')!;
const validCreate = {
	platformId: '11111111-1111-4111-8111-111111111111',
	customPlatformName: null,
	planName: 'Premium',
	accountLabel: 'Family',
	amount: '219.00',
	currency: 'thb',
	billingUnit: 'MONTH',
	billingInterval: 1,
	currentPeriodStart: '2026-07-01',
	currentPeriodEnd: '2026-07-31',
	renewsAutomatically: true,
	status: 'ACTIVE',
	alertDays: [1, 7, 3, 7],
	recordInitialPayment: false,
	initialPaidDate: null
};

function expectFieldError(run: () => unknown, field: string, code: string) {
	try {
		run();
		throw new Error('Expected validation error');
	} catch (error) {
		expect(error).toBeInstanceOf(SubscriptionDomainError);
		expect((error as SubscriptionDomainError).fieldErrors[field]).toContain(code);
	}
}

describe('subscription validation', () => {
	it('normalizes a valid create request', () => {
		expect(parseCreateSubscriptionRequest(validCreate, today)).toMatchObject({
		currency: 'THB', amount: '219', alertDays: [7, 3, 1], planName: 'Premium'
	});
	});

	it.each([
		[{ ...validCreate, customPlatformName: 'Custom' }, 'customPlatformName', 'source_xor'],
		[{ ...validCreate, platformId: null }, 'customPlatformName', 'source_xor'],
		[{ ...validCreate, currency: 'US' }, 'currency', 'invalid'],
		[{ ...validCreate, currentPeriodEnd: '2026-06-30' }, 'currentPeriodEnd', 'date_order'],
		[{ ...validCreate, billingInterval: 0 }, 'billingInterval', 'out_of_range'],
		[{ ...validCreate, billingUnit: 'DAY', billingInterval: 366 }, 'billingInterval', 'out_of_range'],
		[{ ...validCreate, amount: '1.001' }, 'amount', 'fraction_digits'],
		[{ ...validCreate, alertDays: [0] }, 'alertDays', 'out_of_range']
	])('rejects invalid create fields', (input, field, code) => {
		expectFieldError(() => parseCreateSubscriptionRequest(input, today), field, code);
	});

	it('requires and bounds the optional initial payment date', () => {
		expectFieldError(() => parseCreateSubscriptionRequest({ ...validCreate, recordInitialPayment: true }, today), 'initialPaidDate', 'required');
		expectFieldError(() => parseCreateSubscriptionRequest({ ...validCreate, recordInitialPayment: true, initialPaidDate: '2026-07-23' }, today), 'initialPaidDate', 'future_date');
	});

	it('requires the complete edit compare-and-swap schedule', () => {
		expectFieldError(() => parseUpdateSubscriptionRequest({ ...validCreate, expectedSchedule: {} }, today), 'expectedSchedule', 'invalid');
	});

	it('validates manual payment period and paid date', () => {
		expectFieldError(() => parsePaymentWriteRequest({ amount: '10', currency: 'USD', paidDate: '2026-07-23', servicePeriodStart: '2026-07-01', servicePeriodEnd: '2026-07-31' }, today), 'paidDate', 'future_date');
		expectFieldError(() => parsePaymentWriteRequest({ amount: '10', currency: 'USD', paidDate: '2026-07-21', servicePeriodStart: '2026-08-01', servicePeriodEnd: '2026-07-31' }, today), 'servicePeriodEnd', 'date_order');
	});

	it('validates renewal, reversal, and positive budget inputs', () => {
		expect(parseRenewSubscriptionRequest({ expectedPeriodEnd: '2026-07-31', paidDate: '2026-07-21', amount: '19.99', currency: 'USD' }, today).currency).toBe('USD');
		expectFieldError(() => parseRenewSubscriptionRequest({ expectedPeriodEnd: 'bad', paidDate: '2026-07-21', amount: '19.99', currency: 'USD' }, today), 'expectedPeriodEnd', 'invalid');
		expect(parseReverseRenewalRequest({ paymentId: '11111111-1111-4111-8111-111111111111' }).paymentId).toBe('11111111-1111-4111-8111-111111111111');
		expect(parseBudgetCurrency('thb')).toBe('THB');
		expectFieldError(() => parseBudgetCurrency('not-a-currency'), 'currency', 'invalid');
		expect(() => parseBudgetCurrency('ZZZ')).toThrowError(expect.objectContaining({ code: 'UNSUPPORTED_CURRENCY' }));
		expectFieldError(() => parseBudgetWriteRequest({ monthlyLimit: '0', warningPercent: 80 }, 'USD'), 'monthlyLimit', 'out_of_range');
		expectFieldError(() => parseBudgetWriteRequest({ monthlyLimit: '100', warningPercent: 101 }, 'USD'), 'warningPercent', 'out_of_range');
	});
});
```

- [ ] **Step 2: Write cursor tests**

Create `src/lib/server/subscriptions/cursor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { decodePaymentCursor, encodePaymentCursor } from './cursor.js';

describe('payment cursor', () => {
	it('round-trips the deterministic sort tuple', () => {
		const cursor = { paidDate: parseCalendarDate('2026-07-21')!, createdAt: '2026-07-21T10:00:00.000Z', id: '11111111-1111-4111-8111-111111111111' };
		expect(decodePaymentCursor(encodePaymentCursor(cursor))).toEqual(cursor);
	});

	it.each(['', 'not-base64', Buffer.from('{}').toString('base64url'), Buffer.from('{"paidDate":"bad"}').toString('base64url')])('rejects malformed cursor %s', (value) => {
		expect(decodePaymentCursor(value)).toBeNull();
	});
});
```

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- src/lib/server/subscriptions/validation.test.ts src/lib/server/subscriptions/cursor.test.ts`

Expected: FAIL because the server subscription modules do not exist.

- [ ] **Step 4: Implement typed domain errors**

Create `src/lib/server/subscriptions/errors.ts`:

```ts
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
```

- [ ] **Step 5: Implement complete validation parsers**

Create `src/lib/server/subscriptions/validation.ts`. The implementation must aggregate field errors, trim optional labels, canonicalize money/currency, normalize alert days, and return the exact shared request types:

```ts
import { addCalendarDays, compareCalendarDates, parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { normalizeCurrency, parseMoney } from '$lib/subscriptions/money.js';
import { normalizeAlertDays } from '$lib/subscriptions/summary.js';
import {
	billingUnits,
	subscriptionStatuses,
	type BudgetWriteRequest,
	type CalendarDate,
	type CreateSubscriptionRequest,
	type FieldErrorCode,
	type PaymentWriteRequest,
	type RenewSubscriptionRequest,
	type ReverseRenewalRequest,
	type ScheduleVersion,
	type SubscriptionWrite,
	type UpdateSubscriptionRequest
} from '$lib/subscriptions/types.js';
import { SubscriptionDomainError, invalidInput } from './errors.js';

type ObjectValue = Record<string, unknown>;
type Errors = Record<string, FieldErrorCode[]>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function object(value: unknown): ObjectValue {
	if (!value || typeof value !== 'object' || Array.isArray(value)) invalidInput({ _form: ['invalid'] });
	return value as ObjectValue;
}

function addError(errors: Errors, field: string, code: FieldErrorCode): void {
	(errors[field] ??= []).push(code);
}

function nullableText(value: unknown, field: string, max: number, errors: Errors): string | null {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value !== 'string') { addError(errors, field, 'invalid'); return null; }
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (trimmed.length > max) addError(errors, field, 'too_long');
	return trimmed;
}

function uuidOrNull(value: unknown, field: string, errors: Errors): string | null {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value !== 'string' || !UUID.test(value)) { addError(errors, field, 'invalid'); return null; }
	return value;
}

function requiredDate(value: unknown, field: string, errors: Errors): CalendarDate {
	const parsed = parseCalendarDate(value);
	if (!parsed) addError(errors, field, value === null || value === undefined || value === '' ? 'required' : 'invalid');
	return parsed ?? ('0001-01-01' as CalendarDate);
}

function bool(value: unknown, field: string, errors: Errors): boolean {
	if (typeof value !== 'boolean') addError(errors, field, 'invalid');
	return value === true;
}

function integer(value: unknown, field: string, min: number, max: number, errors: Errors): number {
	if (typeof value !== 'number' || !Number.isInteger(value)) { addError(errors, field, 'invalid'); return min; }
	if (value < min || value > max) addError(errors, field, 'out_of_range');
	return value;
}

function parseCurrencyAndMoney(input: ObjectValue, errors: Errors, positive: boolean): { currency: string; amount: string } {
	const currencyText = typeof input.currency === 'string' ? input.currency.trim().toUpperCase() : '';
	const validCurrencyShape = /^[A-Z]{3}$/.test(currencyText);
	if (!validCurrencyShape) addError(errors, 'currency', 'invalid');
	const currency = validCurrencyShape ? normalizeCurrency(currencyText) : null;
	if (validCurrencyShape && !currency) throw new SubscriptionDomainError('UNSUPPORTED_CURRENCY', { currency: ['invalid'] });
	const parsed = parseMoney(input.amount, currency ?? 'USD', { positive });
	if (!parsed.ok) {
		addError(errors, 'amount', parsed.reason === 'fraction_digits' ? 'fraction_digits' : parsed.reason === 'out_of_range' ? 'out_of_range' : 'invalid');
	}
	return { currency: currency ?? 'USD', amount: parsed.ok ? parsed.value : '0' };
}

function parseSubscriptionWrite(inputValue: unknown): { value: SubscriptionWrite; errors: Errors } {
	const input = object(inputValue);
	const errors: Errors = {};
	const platformId = uuidOrNull(input.platformId, 'platformId', errors);
	const customPlatformName = nullableText(input.customPlatformName, 'customPlatformName', 255, errors);
	if ((platformId === null) === (customPlatformName === null)) {
		addError(errors, 'platformId', 'source_xor');
		addError(errors, 'customPlatformName', 'source_xor');
	}
	const planName = nullableText(input.planName, 'planName', 120, errors);
	const accountLabel = nullableText(input.accountLabel, 'accountLabel', 120, errors);
	const { currency, amount } = parseCurrencyAndMoney(input, errors, false);
	const billingUnit = billingUnits.includes(input.billingUnit as never) ? input.billingUnit as SubscriptionWrite['billingUnit'] : 'MONTH';
	if (!billingUnits.includes(input.billingUnit as never)) addError(errors, 'billingUnit', 'invalid');
	const intervalMax = billingUnit === 'DAY' ? 365 : billingUnit === 'MONTH' ? 120 : 20;
	const billingInterval = integer(input.billingInterval, 'billingInterval', 1, intervalMax, errors);
	const currentPeriodStart = requiredDate(input.currentPeriodStart, 'currentPeriodStart', errors);
	const currentPeriodEnd = requiredDate(input.currentPeriodEnd, 'currentPeriodEnd', errors);
	if (compareCalendarDates(currentPeriodEnd, currentPeriodStart) < 0) addError(errors, 'currentPeriodEnd', 'date_order');
	const renewsAutomatically = bool(input.renewsAutomatically, 'renewsAutomatically', errors);
	const status = subscriptionStatuses.includes(input.status as never) ? input.status as SubscriptionWrite['status'] : 'ACTIVE';
	if (!subscriptionStatuses.includes(input.status as never)) addError(errors, 'status', 'invalid');
	const alertDays = normalizeAlertDays(input.alertDays);
	if (!alertDays) addError(errors, 'alertDays', 'out_of_range');
	return { value: { platformId, customPlatformName, planName, accountLabel, amount, currency, billingUnit, billingInterval, currentPeriodStart, currentPeriodEnd, renewsAutomatically, status, alertDays: alertDays ?? [] }, errors };
}

function parseScheduleVersion(value: unknown, errors: Errors): ScheduleVersion {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		addError(errors, 'expectedSchedule', 'invalid');
		return { currentPeriodStart: '0001-01-01' as CalendarDate, currentPeriodEnd: '0001-01-01' as CalendarDate, renewalAnchorDate: '0001-01-01' as CalendarDate, renewalSequence: 0, billingUnit: 'MONTH', billingInterval: 1 };
	}
	const input = value as ObjectValue;
	const local: Errors = {};
	const currentPeriodStart = requiredDate(input.currentPeriodStart, 'currentPeriodStart', local);
	const currentPeriodEnd = requiredDate(input.currentPeriodEnd, 'currentPeriodEnd', local);
	const renewalAnchorDate = requiredDate(input.renewalAnchorDate, 'renewalAnchorDate', local);
	const renewalSequence = integer(input.renewalSequence, 'renewalSequence', 0, Number.MAX_SAFE_INTEGER, local);
	const billingUnit = billingUnits.includes(input.billingUnit as never) ? input.billingUnit as ScheduleVersion['billingUnit'] : 'MONTH';
	const billingInterval = integer(input.billingInterval, 'billingInterval', 1, billingUnit === 'DAY' ? 365 : billingUnit === 'MONTH' ? 120 : 20, local);
	if (!billingUnits.includes(input.billingUnit as never) || Object.keys(local).length) addError(errors, 'expectedSchedule', 'invalid');
	return { currentPeriodStart, currentPeriodEnd, renewalAnchorDate, renewalSequence, billingUnit, billingInterval };
}

function assertNoErrors(errors: Errors): void {
	if (Object.keys(errors).length) invalidInput(errors);
}

function assertPaidDate(paidDate: CalendarDate, today: CalendarDate, field: string, errors: Errors): void {
	if (compareCalendarDates(paidDate, addCalendarDays(today, 1)) > 0) addError(errors, field, 'future_date');
}

export function parseCreateSubscriptionRequest(value: unknown, today: CalendarDate): CreateSubscriptionRequest {
	const input = object(value);
	const parsed = parseSubscriptionWrite(input);
	const recordInitialPayment = bool(input.recordInitialPayment, 'recordInitialPayment', parsed.errors);
	const initialPaidDate = input.initialPaidDate === null || input.initialPaidDate === undefined || input.initialPaidDate === '' ? null : requiredDate(input.initialPaidDate, 'initialPaidDate', parsed.errors);
	if (recordInitialPayment && !initialPaidDate) addError(parsed.errors, 'initialPaidDate', 'required');
	if (initialPaidDate) assertPaidDate(initialPaidDate, today, 'initialPaidDate', parsed.errors);
	assertNoErrors(parsed.errors);
	return { ...parsed.value, recordInitialPayment, initialPaidDate };
}

export function parseUpdateSubscriptionRequest(value: unknown, _today: CalendarDate): UpdateSubscriptionRequest {
	const input = object(value);
	const parsed = parseSubscriptionWrite(input);
	const expectedSchedule = parseScheduleVersion(input.expectedSchedule, parsed.errors);
	assertNoErrors(parsed.errors);
	return { ...parsed.value, expectedSchedule };
}

export function parsePaymentWriteRequest(value: unknown, today: CalendarDate): PaymentWriteRequest {
	const input = object(value);
	const errors: Errors = {};
	const { currency, amount } = parseCurrencyAndMoney(input, errors, false);
	const paidDate = requiredDate(input.paidDate, 'paidDate', errors);
	const servicePeriodStart = requiredDate(input.servicePeriodStart, 'servicePeriodStart', errors);
	const servicePeriodEnd = requiredDate(input.servicePeriodEnd, 'servicePeriodEnd', errors);
	assertPaidDate(paidDate, today, 'paidDate', errors);
	if (compareCalendarDates(servicePeriodEnd, servicePeriodStart) < 0) addError(errors, 'servicePeriodEnd', 'date_order');
	assertNoErrors(errors);
	return { amount, currency, paidDate, servicePeriodStart, servicePeriodEnd };
}

export function parseRenewSubscriptionRequest(value: unknown, today: CalendarDate): RenewSubscriptionRequest {
	const input = object(value);
	const errors: Errors = {};
	const { currency, amount } = parseCurrencyAndMoney(input, errors, false);
	const paidDate = requiredDate(input.paidDate, 'paidDate', errors);
	const expectedPeriodEnd = requiredDate(input.expectedPeriodEnd, 'expectedPeriodEnd', errors);
	assertPaidDate(paidDate, today, 'paidDate', errors);
	assertNoErrors(errors);
	return { expectedPeriodEnd, paidDate, amount, currency };
}

export function parseReverseRenewalRequest(value: unknown): ReverseRenewalRequest {
	const input = object(value);
	if (typeof input.paymentId !== 'string' || !UUID.test(input.paymentId)) invalidInput({ paymentId: ['invalid'] });
	return { paymentId: input.paymentId };
}

export function parseBudgetCurrency(value: unknown): string {
	const currencyText = typeof value === 'string' ? value.trim().toUpperCase() : '';
	if (!/^[A-Z]{3}$/.test(currencyText)) invalidInput({ currency: ['invalid'] });
	const currency = normalizeCurrency(currencyText);
	if (!currency) throw new SubscriptionDomainError('UNSUPPORTED_CURRENCY', { currency: ['invalid'] });
	return currency;
}

export function parseBudgetWriteRequest(value: unknown, currencyValue: unknown): BudgetWriteRequest {
	const input = object(value);
	const errors: Errors = {};
	const currency = parseBudgetCurrency(currencyValue);
	const parsed = parseMoney(input.monthlyLimit, currency, { positive: true });
	if (!parsed.ok) addError(errors, 'monthlyLimit', parsed.reason === 'fraction_digits' ? 'fraction_digits' : 'out_of_range');
	const warningPercent = integer(input.warningPercent, 'warningPercent', 1, 100, errors);
	assertNoErrors(errors);
	return { monthlyLimit: parsed.ok ? parsed.value : '0', warningPercent };
}
```

The renewal parser deliberately validates only user-entered payment fields and `expectedPeriodEnd`; the server computes the new service period from the owned subscription.

- [ ] **Step 6: Implement opaque cursor encoding**

Create `src/lib/server/subscriptions/cursor.ts`:

```ts
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
		const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<string, unknown>;
		const paidDate = parseCalendarDate(parsed.paidDate);
		if (!paidDate || typeof parsed.createdAt !== 'string' || !Number.isFinite(Date.parse(parsed.createdAt)) || typeof parsed.id !== 'string' || !UUID.test(parsed.id)) return null;
		return { paidDate, createdAt: parsed.createdAt, id: parsed.id };
	} catch {
		return null;
	}
}
```

Using `Date.parse` here validates an audit timestamp, not a billing date; all civil dates still avoid `Date`.

- [ ] **Step 7: Run validation, cursor, domain, and type checks**

Run:

```bash
npm test -- src/lib/subscriptions src/lib/server/subscriptions/validation.test.ts src/lib/server/subscriptions/cursor.test.ts
npm run check
```

Expected: all focused tests PASS and no type errors.

---

### Task 5: Implement Owned Reads, Related Series, Pagination, and Summaries

**Files:**
- Create: `src/lib/server/subscriptions/queries.ts`
- Test: `src/lib/server/subscriptions/queries.test.ts`
- Create: `src/lib/server/subscriptions/summary-query.ts`
- Test: `src/lib/server/subscriptions/summary-query.test.ts`

**Interfaces:**
- Consumes: `Db`, schema exports, calendar/money/summary helpers, shared view types, and payment cursor helpers.
- Produces: `listPlatformOptions(db)`, `listSubscriptionBudgets(db, userId)`, `listSubscriptions(db, userId)`, `getSubscriptionDetail(db, userId, subscriptionId, cursor?)`, `listSubscriptionPayments(db, userId, subscriptionId, cursor?, limit?)`, and `getSubscriptionSummary(db, userId, today)`.

- [ ] **Step 1: Write query tests around ownership and mapping**

Create `src/lib/server/subscriptions/queries.test.ts` with a lightweight `execute` mock matching existing Moment query tests. Cover these exact observations:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '$lib/server/db/index.js';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { getSubscriptionDetail, listSubscriptionPayments, listSubscriptions } from './queries.js';
import { SubscriptionDomainError } from './errors.js';

const execute = vi.fn();
const db = { execute } as unknown as Db;
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const subscriptionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const subscriptionRow = {
	id: subscriptionId,
	platform_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
	platform_name: 'Stream GL',
	platform_logo_url: null,
	custom_platform_name: null,
	plan_name: 'Premium',
	account_label: 'Family',
	amount: '219.0000',
	currency: 'THB',
	billing_unit: 'MONTH',
	billing_interval: 1,
	current_period_start: '2026-07-25',
	current_period_end: '2026-08-24',
	renewal_anchor_date: '2026-08-25',
	renewal_sequence: 0,
	renews_automatically: true,
	status: 'ACTIVE',
	alert_days: [7, 3, 1],
	related_series: [{ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', titleTh: 'เรื่องหนึ่ง', titleEn: 'One', posterUrl: null }],
	related_series_count: 4
};

beforeEach(() => execute.mockReset());

describe('subscription owned queries', () => {
	it('maps exact decimals, the CAS schedule, next period, and related-series remainder', async () => {
		execute.mockResolvedValueOnce({ rows: [subscriptionRow] });
		const result = await listSubscriptions(db, userId);
		expect(result[0]).toMatchObject({
			amount: '219',
			scheduleVersion: { currentPeriodEnd: '2026-08-24', renewalSequence: 0 },
			nextPeriod: { start: '2026-08-25', end: '2026-09-24' },
			relatedSeriesRemaining: 3
		});
		expect(String(execute.mock.calls[0][0])).toContain('user_subscriptions');
	});

	it('returns the same not-found error when the owned row is absent', async () => {
		execute.mockResolvedValueOnce({ rows: [] });
		await expect(getSubscriptionDetail(db, userId, subscriptionId)).rejects.toMatchObject<Partial<SubscriptionDomainError>>({ code: 'SUBSCRIPTION_NOT_FOUND', status: 404 });
	});

	it('deduplicates central-platform series from schedule and episode links', async () => {
		execute
			.mockResolvedValueOnce({ rows: [{ ...subscriptionRow, related_series: [], related_series_count: 0 }] })
			.mockResolvedValueOnce({ rows: [
				{ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', title_th: 'เรื่องหนึ่ง', title_en: 'One', poster_url: null },
				{ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', title_th: 'เรื่องหนึ่ง', title_en: 'One', poster_url: null }
			] })
			.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] })
			.mockResolvedValueOnce({ rows: [] });
		const detail = await getSubscriptionDetail(db, userId, subscriptionId);
		expect(detail.relatedSeries).toHaveLength(1);
	});

	it('uses a 25-row cursor page and marks renewal rows immutable', async () => {
		execute
			.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] })
			.mockResolvedValueOnce({ rows: Array.from({ length: 26 }, (_, index) => ({
				id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
				kind: index === 0 ? 'RENEWAL' : 'MANUAL', amount: '10.0000', currency: 'USD',
				paid_date: '2026-07-21', service_period_start: '2026-07-01', service_period_end: '2026-07-31',
				created_at: `2026-07-21T10:00:${String(index).padStart(2, '0')}.000Z`, can_reverse: index === 0
			})) });
		const page = await listSubscriptionPayments(db, userId, subscriptionId, null, 25);
		expect(page.items).toHaveLength(25);
		expect(page.nextCursor).not.toBeNull();
		expect(page.items[0]).toMatchObject({ canEdit: false, canDelete: false, canReverse: true });
	});
});
```

When creating UUID fixtures for all 26 rows, keep each value valid under the cursor decoder; use hexadecimal digits for the final segment.

- [ ] **Step 2: Write summary query tests around exact boundaries**

Create `src/lib/server/subscriptions/summary-query.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '$lib/server/db/index.js';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { getSubscriptionSummary } from './summary-query.js';

const execute = vi.fn();
const db = { execute } as unknown as Db;

beforeEach(() => execute.mockReset());

describe('subscription summary query', () => {
	it('keeps actual, forecast, and budget amounts separate by currency', async () => {
		execute
			.mockResolvedValueOnce({ rows: [{ currency: 'USD', total: '30.1000' }, { currency: 'THB', total: '219.0000' }] })
			.mockResolvedValueOnce({ rows: [{ currency: 'USD', total: '19.9900' }] })
			.mockResolvedValueOnce({ rows: [{ currency: 'USD', monthly_limit: '100.0000', warning_percent: 80 }] })
			.mockResolvedValueOnce({ rows: [{ id: '11111111-1111-4111-8111-111111111111', current_period_end: '2026-07-24', alert_days: [7, 3, 1], renews_automatically: true, status: 'ACTIVE' }] });
		const summary = await getSubscriptionSummary(db, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', parseCalendarDate('2026-07-21')!);
		expect(summary.actualTotals).toEqual([{ currency: 'THB', total: '219' }, { currency: 'USD', total: '30.1' }]);
		expect(summary.forecastTotals).toEqual([{ currency: 'USD', total: '19.99' }]);
		expect(summary.budgets[0]).toMatchObject({ actual: '30.1', state: 'SAFE', usageBasisPoints: 3010 });
		expect(summary.urgencies[0]).toMatchObject({ daysRemaining: 3, matchedAlertDay: 3 });
	});

	it('uses current-month paid dates and the half-open day-30 forecast boundary', async () => {
		execute.mockResolvedValue({ rows: [] });
		await getSubscriptionSummary(db, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', parseCalendarDate('2026-07-21')!);
		const statements = execute.mock.calls.map(([statement]) => String(statement)).join('\n');
		expect(statements).toContain('2026-07-01');
		expect(statements).toContain('2026-08-01');
		expect(statements).toContain('2026-08-20');
		expect(statements).toMatch(/paid_date[\s\S]*>=/);
		expect(statements).toMatch(/current_period_end[\s\S]*</);
	});
});
```

If Drizzle's SQL object string does not inline parameters, inspect `statement.queryChunks` or mock `db.execute` with the repository's existing SQL-inspection helper. Preserve assertions for the three exact boundary values.

- [ ] **Step 3: Run query tests and verify RED**

Run: `npm test -- src/lib/server/subscriptions/queries.test.ts src/lib/server/subscriptions/summary-query.test.ts`

Expected: FAIL because the query modules do not exist.

- [ ] **Step 4: Implement result normalization and subscription row mapping**

Start `src/lib/server/subscriptions/queries.ts` with explicit row types and these helpers:

```ts
import { sql } from 'drizzle-orm';
import type { Db } from '$lib/server/db/index.js';
import { calculateNextPeriod, parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { fromScaleFour, toScaleFour } from '$lib/subscriptions/money.js';
import type { PaymentItem, PaymentPage, PlatformOption, RelatedSeries, SubscriptionDetail, SubscriptionListItem } from '$lib/subscriptions/types.js';
import { decodePaymentCursor, encodePaymentCursor, type PaymentCursor } from './cursor.js';
import { SubscriptionDomainError } from './errors.js';

export function resultRows<T>(result: unknown): T[] {
	if (Array.isArray(result)) return result as T[];
	if (result && typeof result === 'object' && Array.isArray((result as { rows?: unknown }).rows)) return (result as { rows: T[] }).rows;
	return [];
}

function canonicalDbMoney(value: string): string {
	return fromScaleFour(toScaleFour(value));
}

function mapRelatedSeries(value: unknown): RelatedSeries[] {
	if (!Array.isArray(value)) return [];
	const seen = new Set<string>();
	return value.flatMap((row) => {
		if (!row || typeof row !== 'object') return [];
		const item = row as Record<string, unknown>;
		if (typeof item.id !== 'string' || typeof item.titleEn !== 'string' || seen.has(item.id)) return [];
		seen.add(item.id);
		return [{ id: item.id, titleTh: typeof item.titleTh === 'string' ? item.titleTh : null, titleEn: item.titleEn, posterUrl: typeof item.posterUrl === 'string' ? item.posterUrl : null }];
	});
}

function requiredDate(value: string) {
	const parsed = parseCalendarDate(value);
	if (!parsed) throw new Error(`Database returned invalid civil date: ${value}`);
	return parsed;
}
```

Define a `SubscriptionDbRow` matching the aliases in Step 5. Its mapper must:

1. Canonicalize `amount` through `canonicalDbMoney`.
2. Build `platform` only when `platform_id` is non-null.
3. Build `scheduleVersion` from all six CAS fields.
4. Call `calculateNextPeriod` with the current renewal sequence.
5. Return only the first three related rows on list queries and `Math.max(0, related_series_count - relatedSeries.length)`.

- [ ] **Step 5: Implement scoped subscription, platform, and budget reads**

Use one parameterized list query. The SQL must include this related-series CTE so schedule-level and episode-level platform links are deduplicated and all soft-deleted domain rows are excluded:

```ts
const subscriptionListSql = (userId: string, subscriptionId?: string) => sql`
	WITH related AS (
		SELECT DISTINCT links.platform_id, s.id, s.title_th, s.title_en, s.poster_url
		FROM (
			SELECT ss.platform_id, ss.series_id
			FROM series_schedules ss
			WHERE ss.platform_id IS NOT NULL
			UNION
			SELECT es.platform_id, e.series_id
			FROM episode_schedules es
			INNER JOIN episodes e ON e.id = es.episode_id AND e.deleted_at IS NULL
			WHERE es.platform_id IS NOT NULL AND es.deleted_at IS NULL
		) links
		INNER JOIN series s ON s.id = links.series_id AND s.deleted_at IS NULL
	), ranked_related AS (
		SELECT related.*, ROW_NUMBER() OVER (PARTITION BY platform_id ORDER BY title_en, id) AS row_number,
			COUNT(*) OVER (PARTITION BY platform_id) AS related_count
		FROM related
	)
	SELECT us.id, us.platform_id, p.name AS platform_name, p.logo_url AS platform_logo_url,
		us.custom_platform_name, us.plan_name, us.account_label, us.amount::text, us.currency,
		us.billing_unit, us.billing_interval, us.current_period_start::text, us.current_period_end::text,
		us.renewal_anchor_date::text, us.renewal_sequence, us.renews_automatically, us.status, us.alert_days,
		COALESCE(
			jsonb_agg(jsonb_build_object('id', rr.id, 'titleTh', rr.title_th, 'titleEn', rr.title_en, 'posterUrl', rr.poster_url)
				ORDER BY rr.title_en, rr.id) FILTER (WHERE rr.row_number <= 3), '[]'::jsonb
		) AS related_series,
		COALESCE(MAX(rr.related_count), 0)::int AS related_series_count
	FROM user_subscriptions us
	LEFT JOIN platforms p ON p.id = us.platform_id
	LEFT JOIN ranked_related rr ON rr.platform_id = us.platform_id
	WHERE us.user_id = ${userId}::uuid
		AND us.deleted_at IS NULL
		${subscriptionId ? sql`AND us.id = ${subscriptionId}::uuid` : sql``}
	GROUP BY us.id, p.id
	ORDER BY us.current_period_end ASC, us.created_at ASC, us.id ASC
`;
```

Implement these exports around it:

```ts
export async function listPlatformOptions(db: Db): Promise<PlatformOption[]>;
export async function listSubscriptionBudgets(db: Db, userId: string): Promise<Array<{ currency: string; monthlyLimit: string; warningPercent: number }>>;
export async function listSubscriptions(db: Db, userId: string): Promise<SubscriptionListItem[]>;
```

`listPlatformOptions` filters `platforms.deleted_at IS NULL`; budget reads filter by `user_id` and sort by currency. All decimal outputs pass through `canonicalDbMoney`.

- [ ] **Step 6: Implement full related-series detail and cursor history**

Add a detail-only query whose CTE uses the same `UNION` and deletion predicates as Step 5 but returns all rows for the owned subscription's catalog platform. Custom-platform subscriptions return `[]` without querying links.

Implement payment pagination with deterministic tuple ordering:

```ts
export async function listSubscriptionPayments(
	db: Db,
	userId: string,
	subscriptionId: string,
	cursorValue: string | null = null,
	limit = 25
): Promise<PaymentPage> {
	const cursor = cursorValue ? decodePaymentCursor(cursorValue) : null;
	if (cursorValue && !cursor) throw new SubscriptionDomainError('INVALID_INPUT', { cursor: ['invalid'] });
	const owned = resultRows<{ id: string }>(await db.execute(sql`
		SELECT id FROM user_subscriptions
		WHERE id = ${subscriptionId}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NULL
		LIMIT 1
	`));
	if (!owned.length) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');

	const rows = resultRows<{
		id: string; kind: PaymentItem['kind']; amount: string; currency: string; paid_date: string;
		service_period_start: string; service_period_end: string; created_at: string; can_reverse: boolean;
	}>(await db.execute(sql`
		SELECT sp.id, sp.kind, sp.amount::text, sp.currency, sp.paid_date::text,
			sp.service_period_start::text, sp.service_period_end::text, sp.created_at::text,
			(
				sp.kind = 'RENEWAL'
				AND sp.id = (SELECT newest.id FROM subscription_payments newest
					WHERE newest.subscription_id = sp.subscription_id AND newest.kind = 'RENEWAL' AND newest.deleted_at IS NULL
					ORDER BY newest.created_at DESC, newest.id DESC LIMIT 1)
				AND us.current_period_start = sp.service_period_start
				AND us.current_period_end = sp.service_period_end
				AND us.renewal_sequence = sp.renewal_sequence_before + 1
				AND us.renewal_anchor_date = sp.renewal_anchor_before
				AND us.billing_unit = sp.billing_unit_snapshot
				AND us.billing_interval = sp.billing_interval_snapshot
			) AS can_reverse
		FROM subscription_payments sp
		INNER JOIN user_subscriptions us ON us.id = sp.subscription_id AND us.user_id = sp.user_id
		WHERE sp.user_id = ${userId}::uuid AND sp.subscription_id = ${subscriptionId}::uuid
			AND sp.deleted_at IS NULL
			${cursor ? sql`AND (sp.paid_date, sp.created_at, sp.id) < (${cursor.paidDate}::date, ${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)` : sql``}
		ORDER BY sp.paid_date DESC, sp.created_at DESC, sp.id DESC
		LIMIT ${limit + 1}
	`));
	const visible = rows.slice(0, limit);
	const items = visible.map((row) => ({
		id: row.id,
		kind: row.kind,
		amount: canonicalDbMoney(row.amount),
		currency: row.currency,
		paidDate: requiredDate(row.paid_date),
		servicePeriodStart: requiredDate(row.service_period_start),
		servicePeriodEnd: requiredDate(row.service_period_end),
		createdAt: row.created_at,
		canEdit: row.kind !== 'RENEWAL',
		canDelete: row.kind !== 'RENEWAL',
		canReverse: row.can_reverse
	}));
	const last = visible.at(-1);
	return {
		items,
		nextCursor: rows.length > limit && last ? encodePaymentCursor({ paidDate: last.paidDate, createdAt: last.createdAt, id: last.id }) : null
	};
}
```

Implement `getSubscriptionDetail(db, userId, subscriptionId, cursor = null)` by reading exactly one owned subscription via `subscriptionListSql`, throwing `SUBSCRIPTION_NOT_FOUND` on zero rows, then loading all related series and the 25-row payment page. Preserve ledger reads even if old payment rows belong to a soft-deleted subscription; the detail route itself still 404s after subscription deletion.

- [ ] **Step 7: Implement exact summary aggregation**

Create `src/lib/server/subscriptions/summary-query.ts`:

```ts
import { sql } from 'drizzle-orm';
import type { Db } from '$lib/server/db/index.js';
import { addCalendarDays, getCalendarMonthRange, parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { fromScaleFour, toScaleFour } from '$lib/subscriptions/money.js';
import { classifyUrgency, evaluateBudget } from '$lib/subscriptions/summary.js';
import type { CalendarDate, CurrencyTotal, SubscriptionSummary } from '$lib/subscriptions/types.js';
import { resultRows } from './queries.js';

function totals(rows: Array<{ currency: string; total: string }>): CurrencyTotal[] {
	return rows
		.map((row) => ({ currency: row.currency, total: fromScaleFour(toScaleFour(row.total)) }))
		.sort((left, right) => left.currency.localeCompare(right.currency));
}

export async function getSubscriptionSummary(db: Db, userId: string, today: CalendarDate): Promise<SubscriptionSummary> {
	const { start: monthStart, endExclusive: monthEndExclusive } = getCalendarMonthRange(today);
	const forecastEndExclusive = addCalendarDays(today, 30);
	const actualTotals = totals(resultRows(await db.execute(sql`
		SELECT currency, COALESCE(SUM(amount), 0)::text AS total
		FROM subscription_payments
		WHERE user_id = ${userId}::uuid AND deleted_at IS NULL
			AND paid_date >= ${monthStart}::date AND paid_date < ${monthEndExclusive}::date
		GROUP BY currency ORDER BY currency
	`)));
	const forecastTotals = totals(resultRows(await db.execute(sql`
		SELECT currency, COALESCE(SUM(amount), 0)::text AS total
		FROM user_subscriptions
		WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND status = 'ACTIVE'
			AND current_period_end >= ${today}::date AND current_period_end < ${forecastEndExclusive}::date
		GROUP BY currency ORDER BY currency
	`)));
	const budgetRows = resultRows<{ currency: string; monthly_limit: string; warning_percent: number }>(await db.execute(sql`
		SELECT currency, monthly_limit::text, warning_percent FROM subscription_budgets
		WHERE user_id = ${userId}::uuid ORDER BY currency
	`));
	const urgencyRows = resultRows<{ id: string; current_period_end: string; alert_days: number[]; renews_automatically: boolean; status: 'ACTIVE' | 'CANCELED' }>(await db.execute(sql`
		SELECT id, current_period_end::text, alert_days, renews_automatically, status
		FROM user_subscriptions
		WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND status = 'ACTIVE'
		ORDER BY current_period_end, id
	`));
	const actualByCurrency = new Map(actualTotals.map((item) => [item.currency, item.total]));
	const budgets = budgetRows.map((row) => {
		const actual = actualByCurrency.get(row.currency) ?? '0';
		const monthlyLimit = fromScaleFour(toScaleFour(row.monthly_limit));
		return { currency: row.currency, actual, monthlyLimit, warningPercent: row.warning_percent, ...evaluateBudget(actual, monthlyLimit, row.warning_percent) };
	});
	const urgencies = urgencyRows.map((row) => {
		const currentPeriodEnd = parseCalendarDate(row.current_period_end);
		if (!currentPeriodEnd) throw new Error('Invalid current_period_end returned by subscription summary query');
		return {
			subscriptionId: row.id,
			...classifyUrgency(currentPeriodEnd, today, row.alert_days, row.renews_automatically, row.status)
		};
	});
	return {
		today, monthStart, monthEndExclusive, forecastEndExclusive, actualTotals, forecastTotals, budgets, urgencies,
		counts: {
			expired: urgencies.filter((item) => item.state === 'EXPIRED').length,
			dueToday: urgencies.filter((item) => item.state === 'DUE_TODAY').length,
			awaitingConfirmation: urgencies.filter((item) => item.awaitingConfirmation).length
		}
	};
}
```

- [ ] **Step 8: Run all read-path tests and type checks**

Run:

```bash
npm test -- src/lib/server/subscriptions/queries.test.ts src/lib/server/subscriptions/summary-query.test.ts
npm run check
```

Expected: both suites PASS and no type errors.

---

### Task 6: Implement Subscription CRUD, Manual Ledger Entries, and Budgets

**Files:**
- Create: `src/lib/server/subscriptions/mutations.ts`
- Test: `src/lib/server/subscriptions/mutations.test.ts`

**Interfaces:**
- Consumes: validated request types, `Db`, exact date helpers, and subscription schema semantics.
- Produces: `createSubscription`, `updateSubscription`, `softDeleteSubscription`, `createManualPayment`, `updateEditablePayment`, `softDeleteEditablePayment`, `upsertSubscriptionBudget`, and `deleteSubscriptionBudget`. Task 7 extends the same module with renewal functions.

- [ ] **Step 1: Write mutation tests for atomic creation and immutable history**

Create `src/lib/server/subscriptions/mutations.test.ts` using the repository's Neon HTTP mock convention: `Object.assign(vi.fn(), { transaction: vi.fn() })` when needed and an `execute` mock for each single CTE. Include these tests:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '$lib/server/db/index.js';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import type { CreateSubscriptionRequest, PaymentWriteRequest, UpdateSubscriptionRequest } from '$lib/subscriptions/types.js';
import {
	createManualPayment,
	createSubscription,
	softDeleteEditablePayment,
	softDeleteSubscription,
	updateEditablePayment,
	updateSubscription,
	upsertSubscriptionBudget
} from './mutations.js';

const execute = vi.fn();
const db = { execute } as unknown as Db;
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const subscriptionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const createInput: CreateSubscriptionRequest = {
	platformId: null,
	customPlatformName: 'Custom GL',
	planName: 'Premium',
	accountLabel: null,
	amount: '19.99',
	currency: 'USD',
	billingUnit: 'MONTH',
	billingInterval: 1,
	currentPeriodStart: parseCalendarDate('2026-07-25')!,
	currentPeriodEnd: parseCalendarDate('2026-08-24')!,
	renewsAutomatically: true,
	status: 'ACTIVE',
	alertDays: [7, 3, 1],
	recordInitialPayment: true,
	initialPaidDate: parseCalendarDate('2026-07-25')!
};

beforeEach(() => execute.mockReset());

describe('subscription mutations', () => {
	it('creates a subscription and optional initial payment in one CTE', async () => {
		execute.mockResolvedValueOnce({ rows: [{ id: subscriptionId, initial_payment_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }] });
		await expect(createSubscription(db, userId, createInput)).resolves.toEqual({ id: subscriptionId });
		const statement = String(execute.mock.calls[0][0]);
		expect(statement).toContain('WITH inserted_subscription AS');
		expect(statement).toContain('inserted_payment AS');
		expect(statement).toContain('INITIAL');
	});

	it('sets the recurrence anchor to the day after the current period and sequence zero', async () => {
		execute.mockResolvedValueOnce({ rows: [{ id: subscriptionId, initial_payment_id: null }] });
		await createSubscription(db, userId, { ...createInput, recordInitialPayment: false, initialPaidDate: null });
		const statement = execute.mock.calls[0][0];
		expect(JSON.stringify(statement.queryChunks ?? statement)).toContain('2026-08-25');
	});

	it('resets recurrence only when period or cycle fields changed under full schedule CAS', async () => {
		execute.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] });
		const { recordInitialPayment: _recordInitialPayment, initialPaidDate: _initialPaidDate, ...subscriptionWrite } = createInput;
		const update: UpdateSubscriptionRequest = {
			...subscriptionWrite,
			expectedSchedule: {
				currentPeriodStart: parseCalendarDate('2026-07-25')!, currentPeriodEnd: parseCalendarDate('2026-08-24')!,
				renewalAnchorDate: parseCalendarDate('2026-08-25')!, renewalSequence: 0, billingUnit: 'MONTH', billingInterval: 1
			}
		};
		await updateSubscription(db, userId, subscriptionId, { ...update, currentPeriodEnd: parseCalendarDate('2026-08-31')! });
		const statement = String(execute.mock.calls[0][0]);
		expect(statement).toContain('renewal_sequence');
		expect(statement).toContain('current_period_end');
	});

	it('soft-deletes a subscription without modifying its ledger', async () => {
		execute.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] });
		await softDeleteSubscription(db, userId, subscriptionId);
		const statement = String(execute.mock.calls[0][0]);
		expect(statement).toContain('UPDATE user_subscriptions');
		expect(statement).not.toContain('UPDATE subscription_payments');
		expect(statement).not.toContain('DELETE FROM');
	});

	it('allows initial/manual correction but never renewal correction', async () => {
		execute.mockResolvedValueOnce({ rows: [] });
		const input: PaymentWriteRequest = { amount: '10', currency: 'USD', paidDate: parseCalendarDate('2026-07-21')!, servicePeriodStart: parseCalendarDate('2026-07-01')!, servicePeriodEnd: parseCalendarDate('2026-07-31')! };
		await expect(updateEditablePayment(db, userId, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', input)).rejects.toMatchObject({ code: 'PAYMENT_NOT_FOUND' });
		expect(String(execute.mock.calls[0][0])).toContain("kind IN ('INITIAL', 'MANUAL')");
	});

	it('scopes manual payments and budgets to the authenticated user', async () => {
		execute.mockResolvedValueOnce({ rows: [{ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }] });
		await createManualPayment(db, userId, subscriptionId, { amount: '10', currency: 'USD', paidDate: parseCalendarDate('2026-07-21')!, servicePeriodStart: parseCalendarDate('2026-07-01')!, servicePeriodEnd: parseCalendarDate('2026-07-31')! });
		expect(String(execute.mock.calls[0][0])).toContain('user_id');
		execute.mockResolvedValueOnce({ rows: [{ currency: 'USD' }] });
		await upsertSubscriptionBudget(db, userId, 'USD', { monthlyLimit: '100', warningPercent: 80 });
		expect(String(execute.mock.calls[1][0])).toContain('ON CONFLICT');
	});
});
```

- [ ] **Step 2: Run mutation tests and verify RED**

Run: `npm test -- src/lib/server/subscriptions/mutations.test.ts`

Expected: FAIL because `mutations.ts` does not exist.

- [ ] **Step 3: Add common mutation helpers and platform validation**

Create `src/lib/server/subscriptions/mutations.ts` with these foundations:

```ts
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { Db } from '$lib/server/db/index.js';
import { addCalendarDays } from '$lib/subscriptions/calendar.js';
import type {
	BudgetWriteRequest,
	CreateSubscriptionRequest,
	PaymentWriteRequest,
	UpdateSubscriptionRequest
} from '$lib/subscriptions/types.js';
import { SubscriptionDomainError } from './errors.js';
import { resultRows } from './queries.js';

async function assertLivePlatform(db: Db, platformId: string | null): Promise<void> {
	if (!platformId) return;
	const rows = resultRows<{ id: string }>(await db.execute(sql`
		SELECT id FROM platforms WHERE id = ${platformId}::uuid AND deleted_at IS NULL LIMIT 1
	`));
	if (!rows.length) throw new SubscriptionDomainError('PLATFORM_NOT_FOUND');
}

async function assertOwnedLiveSubscription(db: Db, userId: string, subscriptionId: string): Promise<void> {
	const owned = resultRows<{ id: string }>(await db.execute(sql`
		SELECT id FROM user_subscriptions
		WHERE id = ${subscriptionId}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NULL LIMIT 1
	`));
	if (!owned.length) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');
}

async function classifySubscriptionCasFailure(db: Db, userId: string, subscriptionId: string): Promise<never> {
	await assertOwnedLiveSubscription(db, userId, subscriptionId);
	throw new SubscriptionDomainError('RENEWAL_CONFLICT');
}

function integerArraySql(values: number[]) {
	if (!values.length) return sql`ARRAY[]::integer[]`;
	return sql`ARRAY[${sql.join(values.map((value) => sql`${value}`), sql`, `)}]::integer[]`;
}
```

Do not log payloads, money, labels, or dates. If operational logging is added later, log only code, route, user ID, and record ID.

- [ ] **Step 4: Implement atomic create with optional initial payment**

Implement creation as one PostgreSQL statement; never execute a separate subscription insert followed by a payment insert:

```ts
export async function createSubscription(db: Db, userId: string, input: CreateSubscriptionRequest): Promise<{ id: string }> {
	await assertLivePlatform(db, input.platformId);
	const subscriptionId = randomUUID();
	const paymentId = randomUUID();
	const renewalAnchorDate = addCalendarDays(input.currentPeriodEnd, 1);
	const canceledAt = input.status === 'CANCELED' ? sql`NOW()` : sql`NULL`;
	const alertDays = integerArraySql(input.alertDays);
	const rows = resultRows<{ id: string; initial_payment_id: string | null }>(await db.execute(sql`
		WITH inserted_subscription AS (
			INSERT INTO user_subscriptions (
				id, user_id, platform_id, custom_platform_name, plan_name, account_label,
				amount, currency, billing_unit, billing_interval, current_period_start,
				current_period_end, renewal_anchor_date, renewal_sequence,
				renews_automatically, status, alert_days, canceled_at
			) VALUES (
				${subscriptionId}::uuid, ${userId}::uuid, CAST(${input.platformId} AS uuid),
				${input.customPlatformName}, ${input.planName}, ${input.accountLabel}, ${input.amount}::numeric,
				${input.currency}, ${input.billingUnit}, ${input.billingInterval}, ${input.currentPeriodStart}::date,
				${input.currentPeriodEnd}::date, ${renewalAnchorDate}::date, 0,
				${input.renewsAutomatically}, ${input.status}, ${alertDays}, ${canceledAt}
			) RETURNING id, user_id, amount, currency, current_period_start, current_period_end
		), inserted_payment AS (
			INSERT INTO subscription_payments (
				id, user_id, subscription_id, kind, amount, currency, paid_date,
				service_period_start, service_period_end
			)
			SELECT ${paymentId}::uuid, user_id, id, 'INITIAL', amount, currency,
				CAST(${input.initialPaidDate} AS date), current_period_start, current_period_end
			FROM inserted_subscription
			WHERE ${input.recordInitialPayment}
			RETURNING id
		)
		SELECT inserted_subscription.id,
			(SELECT id FROM inserted_payment LIMIT 1) AS initial_payment_id
		FROM inserted_subscription
	`));
	if (!rows[0]) throw new Error('Subscription insert returned no row');
	return { id: rows[0].id };
}
```

- [ ] **Step 5: Implement compare-and-swap editing**

`updateSubscription` must call `assertLivePlatform`, compare all six previously loaded schedule fields, and reset recurrence only when the current period, billing unit, or interval changed:

```ts
export async function updateSubscription(db: Db, userId: string, subscriptionId: string, input: UpdateSubscriptionRequest): Promise<{ id: string }> {
	await assertLivePlatform(db, input.platformId);
	const scheduleChanged =
		input.currentPeriodStart !== input.expectedSchedule.currentPeriodStart ||
		input.currentPeriodEnd !== input.expectedSchedule.currentPeriodEnd ||
		input.billingUnit !== input.expectedSchedule.billingUnit ||
		input.billingInterval !== input.expectedSchedule.billingInterval;
	const nextAnchor = scheduleChanged ? addCalendarDays(input.currentPeriodEnd, 1) : input.expectedSchedule.renewalAnchorDate;
	const nextSequence = scheduleChanged ? 0 : input.expectedSchedule.renewalSequence;
	const alertDays = integerArraySql(input.alertDays);
	const rows = resultRows<{ id: string }>(await db.execute(sql`
		UPDATE user_subscriptions SET
			platform_id = CAST(${input.platformId} AS uuid),
			custom_platform_name = ${input.customPlatformName}, plan_name = ${input.planName}, account_label = ${input.accountLabel},
			amount = ${input.amount}::numeric, currency = ${input.currency}, billing_unit = ${input.billingUnit},
			billing_interval = ${input.billingInterval}, current_period_start = ${input.currentPeriodStart}::date,
			current_period_end = ${input.currentPeriodEnd}::date, renewal_anchor_date = ${nextAnchor}::date,
			renewal_sequence = ${nextSequence}, renews_automatically = ${input.renewsAutomatically}, status = ${input.status},
			alert_days = ${alertDays}, canceled_at = CASE WHEN ${input.status} = 'CANCELED' THEN COALESCE(canceled_at, NOW()) ELSE NULL END,
			updated_at = NOW()
		WHERE id = ${subscriptionId}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NULL
			AND current_period_start = ${input.expectedSchedule.currentPeriodStart}::date
			AND current_period_end = ${input.expectedSchedule.currentPeriodEnd}::date
			AND renewal_anchor_date = ${input.expectedSchedule.renewalAnchorDate}::date
			AND renewal_sequence = ${input.expectedSchedule.renewalSequence}
			AND billing_unit = ${input.expectedSchedule.billingUnit}
			AND billing_interval = ${input.expectedSchedule.billingInterval}
		RETURNING id
	`));
	if (!rows[0]) return classifySubscriptionCasFailure(db, userId, subscriptionId);
	return rows[0];
}
```

- [ ] **Step 6: Implement soft deletion and manual payment writes**

Add these exact contracts:

```ts
export async function softDeleteSubscription(db: Db, userId: string, subscriptionId: string): Promise<void>;
export async function createManualPayment(db: Db, userId: string, subscriptionId: string, input: PaymentWriteRequest): Promise<{ id: string }>;
export async function updateEditablePayment(db: Db, userId: string, paymentId: string, input: PaymentWriteRequest): Promise<{ id: string }>;
export async function softDeleteEditablePayment(db: Db, userId: string, paymentId: string): Promise<void>;
```

Implement them with these predicates:

```sql
-- Subscription deletion; do not touch subscription_payments.
UPDATE user_subscriptions
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = $subscription_id AND user_id = $user_id AND deleted_at IS NULL
RETURNING id;

-- Manual insertion proves ownership in the same statement.
INSERT INTO subscription_payments (id, user_id, subscription_id, kind, amount, currency, paid_date, service_period_start, service_period_end)
SELECT $payment_id, user_id, id, 'MANUAL', $amount, $currency, $paid_date, $service_start, $service_end
FROM user_subscriptions
WHERE id = $subscription_id AND user_id = $user_id AND deleted_at IS NULL
RETURNING id;

-- Direct correction/deletion never matches a renewal row.
UPDATE subscription_payments
SET amount = $amount, currency = $currency, paid_date = $paid_date,
    service_period_start = $service_start, service_period_end = $service_end, updated_at = NOW()
WHERE id = $payment_id AND user_id = $user_id AND deleted_at IS NULL
  AND kind IN ('INITIAL', 'MANUAL')
RETURNING id;
```

The delete variant sets `deleted_at = NOW(), updated_at = NOW()` under the same `kind IN ('INITIAL', 'MANUAL')` predicate. After a zero-row manual insert, call `assertOwnedLiveSubscription`; if ownership still exists, throw a generic internal error because the insert violated its expected invariant rather than mislabeling it as a renewal conflict. A zero-row correction/deletion throws `PAYMENT_NOT_FOUND`, deliberately hiding foreign ownership and renewal-row existence.

- [ ] **Step 7: Implement per-currency budget upsert/delete**

Add:

```ts
export async function upsertSubscriptionBudget(db: Db, userId: string, currency: string, input: BudgetWriteRequest): Promise<{ currency: string }> {
	const rows = resultRows<{ currency: string }>(await db.execute(sql`
		INSERT INTO subscription_budgets (id, user_id, currency, monthly_limit, warning_percent)
		VALUES (${randomUUID()}::uuid, ${userId}::uuid, ${currency}, ${input.monthlyLimit}::numeric, ${input.warningPercent})
		ON CONFLICT (user_id, currency) DO UPDATE SET
			monthly_limit = EXCLUDED.monthly_limit,
			warning_percent = EXCLUDED.warning_percent,
			updated_at = NOW()
		RETURNING currency
	`));
	if (!rows[0]) throw new Error('Budget upsert returned no row');
	return rows[0];
}

export async function deleteSubscriptionBudget(db: Db, userId: string, currency: string): Promise<void> {
	await db.execute(sql`DELETE FROM subscription_budgets WHERE user_id = ${userId}::uuid AND currency = ${currency}`);
}
```

Budget hard deletion is intentional: unlike payments, it has no ledger/audit role.

- [ ] **Step 8: Run mutation and domain checks**

Run:

```bash
npm test -- src/lib/server/subscriptions/mutations.test.ts
npm run check
```

Expected: CRUD/payment/budget tests PASS and no type errors.

---

### Task 7: Implement Atomic Renewal and Latest-Renewal Reversal

**Files:**
- Modify: `src/lib/server/subscriptions/mutations.ts`
- Modify: `src/lib/server/subscriptions/mutations.test.ts`

**Interfaces:**
- Consumes: `RenewSubscriptionRequest`, `ReverseRenewalRequest`, `RenewalResult`, `ReversalResult`, stable-anchor calendar arithmetic, and the partial unique renewal key.
- Produces: `renewSubscription(db, userId, subscriptionId, input)` and `reverseLatestRenewal(db, userId, subscriptionId, input)`.

- [ ] **Step 1: Add renewal race, atomicity, and ownership tests**

Append to `src/lib/server/subscriptions/mutations.test.ts`:

```ts
import { renewSubscription, reverseLatestRenewal } from './mutations.js';

const activeSchedule = {
	id: subscriptionId,
	current_period_start: '2026-07-25',
	current_period_end: '2026-08-24',
	renewal_anchor_date: '2026-08-25',
	renewal_sequence: 0,
	billing_unit: 'MONTH' as const,
	billing_interval: 1,
	status: 'ACTIVE' as const
};

describe('confirmed renewal', () => {
	it('advances exactly one period and inserts one payment in one atomic CTE', async () => {
		execute
			.mockResolvedValueOnce({ rows: [activeSchedule] })
			.mockResolvedValueOnce({ rows: [{ payment_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', current_period_start: '2026-08-25', current_period_end: '2026-09-24', renewal_sequence: 1 }] });
		const result = await renewSubscription(db, userId, subscriptionId, {
			expectedPeriodEnd: parseCalendarDate('2026-08-24')!, paidDate: parseCalendarDate('2026-08-20')!, amount: '21.5', currency: 'USD'
		});
		expect(result).toMatchObject({ currentPeriodStart: '2026-08-25', currentPeriodEnd: '2026-09-24', renewalSequence: 1 });
		const statement = String(execute.mock.calls[1][0]);
		expect(statement).toContain('WITH advanced_subscription AS');
		expect(statement).toContain('inserted_payment AS');
		expect(statement).toContain('renewal_from_period_end');
		expect(statement).toContain('renewal_sequence');
	});

	it('does not bulk-fill missed cycles', async () => {
		execute
			.mockResolvedValueOnce({ rows: [activeSchedule] })
			.mockResolvedValueOnce({ rows: [{ payment_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', current_period_start: '2026-08-25', current_period_end: '2026-09-24', renewal_sequence: 1 }] });
		await renewSubscription(db, userId, subscriptionId, {
			expectedPeriodEnd: parseCalendarDate('2026-08-24')!, paidDate: parseCalendarDate('2026-12-01')!, amount: '21.5', currency: 'USD'
		});
		expect(String(execute.mock.calls[1][0]).match(/INSERT INTO subscription_payments/g)).toHaveLength(1);
	});

	it('maps a repeated original period to the stable duplicate code', async () => {
		execute
			.mockResolvedValueOnce({ rows: [{ ...activeSchedule, current_period_start: '2026-08-25', current_period_end: '2026-09-24', renewal_sequence: 1 }] })
			.mockResolvedValueOnce({ rows: [{ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }] });
		await expect(renewSubscription(db, userId, subscriptionId, {
			expectedPeriodEnd: parseCalendarDate('2026-08-24')!, paidDate: parseCalendarDate('2026-08-20')!, amount: '21.5', currency: 'USD'
		})).rejects.toMatchObject({ code: 'RENEWAL_ALREADY_RECORDED', status: 409 });
	});

	it('returns 404 for missing or foreign-owned subscriptions', async () => {
		execute.mockResolvedValueOnce({ rows: [] });
		await expect(renewSubscription(db, userId, subscriptionId, {
			expectedPeriodEnd: parseCalendarDate('2026-08-24')!, paidDate: parseCalendarDate('2026-08-20')!, amount: '21.5', currency: 'USD'
		})).rejects.toMatchObject({ code: 'SUBSCRIPTION_NOT_FOUND', status: 404 });
	});

	it('returns conflict when recurrence no longer forms a contiguous next period', async () => {
		execute.mockResolvedValueOnce({ rows: [{ ...activeSchedule, renewal_anchor_date: '2026-09-01' }] });
		await expect(renewSubscription(db, userId, subscriptionId, {
			expectedPeriodEnd: parseCalendarDate('2026-08-24')!, paidDate: parseCalendarDate('2026-08-20')!, amount: '21.5', currency: 'USD'
		})).rejects.toMatchObject({ code: 'RENEWAL_CONFLICT' });
	});
});
```

The “missed cycles” fixture's paid date is intentionally late. Call `renewSubscription` directly because route validation separately enforces its accepted paid-date bound; this domain test proves the recurrence operation advances one cycle regardless of elapsed wall time.

- [ ] **Step 2: Add reversal eligibility and rollback-structure tests**

Append:

```ts
describe('latest renewal reversal', () => {
	it('soft-deletes only the eligible latest renewal and restores snapshots in one CTE', async () => {
		execute.mockResolvedValueOnce({ rows: [{
			payment_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
			current_period_start: '2026-07-25', current_period_end: '2026-08-24', renewal_sequence: 0
		}] });
		const result = await reverseLatestRenewal(db, userId, subscriptionId, { paymentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' });
		expect(result).toMatchObject({ currentPeriodStart: '2026-07-25', currentPeriodEnd: '2026-08-24', renewalSequence: 0 });
		const statement = String(execute.mock.calls[0][0]);
		expect(statement).toContain('WITH candidate AS');
		expect(statement).toContain('restored_subscription AS');
		expect(statement).toContain('soft_deleted_payment AS');
		expect(statement).not.toContain('DELETE FROM subscription_payments');
	});

	it('rejects a non-latest renewal or a schedule edited afterward', async () => {
		execute
			.mockResolvedValueOnce({ rows: [] })
			.mockResolvedValueOnce({ rows: [{ id: subscriptionId }] });
		await expect(reverseLatestRenewal(db, userId, subscriptionId, { paymentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }))
			.rejects.toMatchObject({ code: 'RENEWAL_REVERSAL_NOT_ALLOWED', status: 409 });
	});

	it('hides foreign subscription existence during reversal', async () => {
		execute
			.mockResolvedValueOnce({ rows: [] })
			.mockResolvedValueOnce({ rows: [] });
		await expect(reverseLatestRenewal(db, userId, subscriptionId, { paymentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }))
			.rejects.toMatchObject({ code: 'SUBSCRIPTION_NOT_FOUND', status: 404 });
	});
});
```

- [ ] **Step 3: Run renewal tests and verify RED**

Run: `npm test -- src/lib/server/subscriptions/mutations.test.ts`

Expected: new renewal/reversal tests FAIL because exports are absent.

- [ ] **Step 4: Implement owned schedule loading and duplicate classification**

Add to `mutations.ts`:

```ts
import { addCalendarDays, calculateNextPeriod, parseCalendarDate } from '$lib/subscriptions/calendar.js';
import type { CalendarDate, RenewalResult, RenewSubscriptionRequest, ReversalResult, ReverseRenewalRequest } from '$lib/subscriptions/types.js';

type OwnedScheduleRow = {
	id: string;
	current_period_start: string;
	current_period_end: string;
	renewal_anchor_date: string;
	renewal_sequence: number;
	billing_unit: 'DAY' | 'MONTH' | 'YEAR';
	billing_interval: number;
	status: 'ACTIVE' | 'CANCELED';
};

function dbDate(value: string): CalendarDate {
	const parsed = parseCalendarDate(value);
	if (!parsed) throw new Error(`Database returned invalid civil date: ${value}`);
	return parsed;
}

async function getOwnedActiveSchedule(db: Db, userId: string, subscriptionId: string): Promise<OwnedScheduleRow> {
	const rows = resultRows<OwnedScheduleRow>(await db.execute(sql`
		SELECT id, current_period_start::text, current_period_end::text, renewal_anchor_date::text,
			renewal_sequence, billing_unit, billing_interval, status
		FROM user_subscriptions
		WHERE id = ${subscriptionId}::uuid AND user_id = ${userId}::uuid
			AND deleted_at IS NULL AND status = 'ACTIVE'
		LIMIT 1
	`));
	if (!rows[0]) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');
	return rows[0];
}

async function hasLiveRenewalFrom(db: Db, userId: string, subscriptionId: string, periodEnd: CalendarDate): Promise<boolean> {
	const rows = resultRows<{ id: string }>(await db.execute(sql`
		SELECT id FROM subscription_payments
		WHERE user_id = ${userId}::uuid AND subscription_id = ${subscriptionId}::uuid
			AND kind = 'RENEWAL' AND renewal_from_period_end = ${periodEnd}::date AND deleted_at IS NULL
		LIMIT 1
	`));
	return rows.length > 0;
}

function isRenewalUniqueViolation(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const value = error as { code?: string; constraint?: string; message?: string };
	return value.code === '23505' && (value.constraint === 'subscription_payments_live_renewal_unique' || value.message?.includes('subscription_payments_live_renewal_unique') === true);
}
```

An inactive owned subscription intentionally produces the same 404 as a missing record in this operation. Users must reactivate it through editing before renewal.

- [ ] **Step 5: Implement one-cycle renewal as one atomic CTE**

```ts
export async function renewSubscription(
	db: Db,
	userId: string,
	subscriptionId: string,
	input: RenewSubscriptionRequest
): Promise<RenewalResult> {
	const current = await getOwnedActiveSchedule(db, userId, subscriptionId);
	const currentStart = dbDate(current.current_period_start);
	const currentEnd = dbDate(current.current_period_end);
	const anchor = dbDate(current.renewal_anchor_date);
	if (currentEnd !== input.expectedPeriodEnd) {
		if (await hasLiveRenewalFrom(db, userId, subscriptionId, input.expectedPeriodEnd)) throw new SubscriptionDomainError('RENEWAL_ALREADY_RECORDED');
		throw new SubscriptionDomainError('RENEWAL_CONFLICT');
	}
	const next = calculateNextPeriod({
		anchorDate: anchor,
		sequence: current.renewal_sequence,
		billingUnit: current.billing_unit,
		billingInterval: current.billing_interval
	});
	if (next.start !== addCalendarDays(currentEnd, 1)) throw new SubscriptionDomainError('RENEWAL_CONFLICT');
	const paymentId = randomUUID();
	try {
		const rows = resultRows<{
			payment_id: string; current_period_start: string; current_period_end: string; renewal_sequence: number;
		}>(await db.execute(sql`
			WITH advanced_subscription AS (
				UPDATE user_subscriptions SET
					current_period_start = ${next.start}::date,
					current_period_end = ${next.end}::date,
					renewal_sequence = ${next.nextSequence},
					updated_at = NOW()
				WHERE id = ${subscriptionId}::uuid AND user_id = ${userId}::uuid
					AND deleted_at IS NULL AND status = 'ACTIVE'
					AND current_period_start = ${currentStart}::date
					AND current_period_end = ${currentEnd}::date
					AND renewal_anchor_date = ${anchor}::date
					AND renewal_sequence = ${current.renewal_sequence}
					AND billing_unit = ${current.billing_unit}
					AND billing_interval = ${current.billing_interval}
				RETURNING id, user_id, current_period_start, current_period_end, renewal_sequence
			), inserted_payment AS (
				INSERT INTO subscription_payments (
					id, user_id, subscription_id, kind, amount, currency, paid_date,
					service_period_start, service_period_end,
					renewal_from_period_start, renewal_from_period_end, renewal_anchor_before,
					renewal_sequence_before, billing_unit_snapshot, billing_interval_snapshot
				)
				SELECT ${paymentId}::uuid, user_id, id, 'RENEWAL', ${input.amount}::numeric, ${input.currency}, ${input.paidDate}::date,
					${next.start}::date, ${next.end}::date,
					${currentStart}::date, ${currentEnd}::date, ${anchor}::date,
					${current.renewal_sequence}, ${current.billing_unit}, ${current.billing_interval}
				FROM advanced_subscription
				RETURNING id
			)
			SELECT inserted_payment.id AS payment_id,
				advanced_subscription.current_period_start::text,
				advanced_subscription.current_period_end::text,
				advanced_subscription.renewal_sequence
			FROM advanced_subscription CROSS JOIN inserted_payment
		`));
		if (!rows[0]) {
			if (await hasLiveRenewalFrom(db, userId, subscriptionId, currentEnd)) throw new SubscriptionDomainError('RENEWAL_ALREADY_RECORDED');
			throw new SubscriptionDomainError('RENEWAL_CONFLICT');
		}
		return {
			paymentId: rows[0].payment_id,
			currentPeriodStart: dbDate(rows[0].current_period_start),
			currentPeriodEnd: dbDate(rows[0].current_period_end),
			renewalSequence: rows[0].renewal_sequence
		};
	} catch (error) {
		if (error instanceof SubscriptionDomainError) throw error;
		if (isRenewalUniqueViolation(error)) throw new SubscriptionDomainError('RENEWAL_ALREADY_RECORDED');
		throw error;
	}
}
```

The update happens before the insert in the CTE, but PostgreSQL treats the statement atomically: a unique/index/insert failure rolls the period update back. No interactive transaction or driver change is needed.

- [ ] **Step 6: Implement eligible latest-renewal reversal as one atomic CTE**

```ts
export async function reverseLatestRenewal(
	db: Db,
	userId: string,
	subscriptionId: string,
	input: ReverseRenewalRequest
): Promise<ReversalResult> {
	const rows = resultRows<{
		payment_id: string; current_period_start: string; current_period_end: string; renewal_sequence: number;
	}>(await db.execute(sql`
		WITH candidate AS (
			SELECT sp.id AS payment_id, sp.subscription_id,
				sp.renewal_from_period_start, sp.renewal_from_period_end,
				sp.renewal_anchor_before, sp.renewal_sequence_before,
				sp.billing_unit_snapshot, sp.billing_interval_snapshot
			FROM subscription_payments sp
			INNER JOIN user_subscriptions us ON us.id = sp.subscription_id AND us.user_id = sp.user_id
			WHERE sp.id = ${input.paymentId}::uuid
				AND sp.subscription_id = ${subscriptionId}::uuid
				AND sp.user_id = ${userId}::uuid
				AND sp.kind = 'RENEWAL' AND sp.deleted_at IS NULL
				AND us.user_id = ${userId}::uuid AND us.deleted_at IS NULL
				AND sp.id = (
					SELECT newest.id FROM subscription_payments newest
					WHERE newest.subscription_id = sp.subscription_id AND newest.kind = 'RENEWAL' AND newest.deleted_at IS NULL
					ORDER BY newest.created_at DESC, newest.id DESC LIMIT 1
				)
				AND us.current_period_start = sp.service_period_start
				AND us.current_period_end = sp.service_period_end
				AND us.renewal_anchor_date = sp.renewal_anchor_before
				AND us.renewal_sequence = sp.renewal_sequence_before + 1
				AND us.billing_unit = sp.billing_unit_snapshot
				AND us.billing_interval = sp.billing_interval_snapshot
			FOR UPDATE OF sp, us
		), restored_subscription AS (
			UPDATE user_subscriptions us SET
				current_period_start = candidate.renewal_from_period_start,
				current_period_end = candidate.renewal_from_period_end,
				renewal_anchor_date = candidate.renewal_anchor_before,
				renewal_sequence = candidate.renewal_sequence_before,
				billing_unit = candidate.billing_unit_snapshot,
				billing_interval = candidate.billing_interval_snapshot,
				updated_at = NOW()
			FROM candidate
			WHERE us.id = candidate.subscription_id AND us.user_id = ${userId}::uuid
				AND us.deleted_at IS NULL
			RETURNING us.current_period_start, us.current_period_end, us.renewal_sequence, candidate.payment_id
		), soft_deleted_payment AS (
			UPDATE subscription_payments sp SET deleted_at = NOW(), updated_at = NOW()
			FROM restored_subscription restored
			WHERE sp.id = restored.payment_id AND sp.user_id = ${userId}::uuid AND sp.deleted_at IS NULL
			RETURNING sp.id
		)
		SELECT restored.payment_id, restored.current_period_start::text,
			restored.current_period_end::text, restored.renewal_sequence
		FROM restored_subscription restored
		INNER JOIN soft_deleted_payment deleted ON deleted.id = restored.payment_id
	`));
	if (!rows[0]) {
		const owned = resultRows<{ id: string }>(await db.execute(sql`
			SELECT id FROM user_subscriptions
			WHERE id = ${subscriptionId}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NULL LIMIT 1
		`));
		if (!owned.length) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');
		throw new SubscriptionDomainError('RENEWAL_REVERSAL_NOT_ALLOWED');
	}
	return {
		paymentId: rows[0].payment_id,
		currentPeriodStart: dbDate(rows[0].current_period_start),
		currentPeriodEnd: dbDate(rows[0].current_period_end),
		renewalSequence: rows[0].renewal_sequence
	};
}
```

- [ ] **Step 7: Add explicit simulated failure and concurrent-result tests**

Mock the CTE `execute` call to throw a `23505` error with constraint `subscription_payments_live_renewal_unique`; assert `RENEWAL_ALREADY_RECORDED`. Mock a zero-row CTE followed by a live-renewal lookup; assert the same code. Assert each success path performs exactly one mutating `execute` call after its read(s), proving there is no separately committed payment/period write in application code.

Use this concrete error fixture:

```ts
const duplicate = Object.assign(new Error('duplicate key'), {
	code: '23505',
	constraint: 'subscription_payments_live_renewal_unique'
});
```

- [ ] **Step 8: Run mutation tests and full domain checks**

Run:

```bash
npm test -- src/lib/subscriptions src/lib/server/subscriptions
npm run check
```

Expected: calendar, money, summary, validation, query, CRUD, renewal, reversal, and race tests PASS.

---

### Task 8: Add the Private API Contract and Core Subscription Endpoints

**Files:**
- Create: `src/lib/server/subscriptions/api.ts`
- Test: `src/lib/server/subscriptions/api.test.ts`
- Create: `src/routes/api/subscriptions/+server.ts`
- Test: `src/routes/api/subscriptions/server.test.ts`
- Create: `src/routes/api/subscriptions/summary/+server.ts`
- Test: `src/routes/api/subscriptions/summary/server.test.ts`
- Create: `src/routes/api/subscriptions/[id]/+server.ts`
- Test: `src/routes/api/subscriptions/[id]/server.test.ts`
- Create: `src/routes/api/subscriptions/[id]/renew/+server.ts`
- Test: `src/routes/api/subscriptions/[id]/renew/server.test.ts`
- Create: `src/routes/api/subscriptions/[id]/reverse-latest-renewal/+server.ts`
- Test: `src/routes/api/subscriptions/[id]/reverse-latest-renewal/server.test.ts`

**Interfaces:**
- Consumes: authenticated `locals.user`, `getDb()`, Task 4 validators, Task 5 reads, and Tasks 6–7 mutations.
- Produces: stable private JSON responses for list/create/detail/edit/delete/summary/renew/reverse. Route modules remain thin and contain no domain calculations.

- [ ] **Step 1: Write transport helper tests**

Create `src/lib/server/subscriptions/api.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { SubscriptionDomainError } from './errors.js';
import {
	apiSuccess,
	handleSubscriptionApi,
	readJsonObject,
	requireApiUser,
	requireMutationOrigin,
	serverValidationToday
} from './api.js';

describe('subscription API transport', () => {
	it('returns private no-store success responses', async () => {
		const response = apiSuccess({ id: 'one' }, 201);
		expect(response.status).toBe(201);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(await response.json()).toEqual({ ok: true, data: { id: 'one' } });
	});

	it('maps stable domain failures without exposing internal messages', async () => {
		const response = await handleSubscriptionApi(async () => { throw new SubscriptionDomainError('RENEWAL_CONFLICT'); });
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ ok: false, code: 'RENEWAL_CONFLICT' });
	});

	it('maps malformed JSON to 400 and unknown errors to a generic 500', async () => {
		const malformed = new Request('https://example.test/api/subscriptions', { method: 'POST', body: '{' });
		await expect(readJsonObject(malformed)).rejects.toMatchObject({ status: 400 });
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const response = await handleSubscriptionApi(async () => { throw new Error('secret database detail'); });
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ ok: false, code: 'INTERNAL_ERROR' });
	});

	it('requires auth and an exact mutation origin', () => {
		expect(() => requireApiUser(null)).toThrowError(expect.objectContaining({ code: 'AUTH_REQUIRED' }));
		expect(() => requireMutationOrigin(new Request('https://example.test/api', { method: 'POST', headers: { origin: 'https://evil.test' } }), new URL('https://example.test/api')))
			.toThrowError(expect.objectContaining({ status: 400 }));
	});

	it('constructs the server tolerance date without ISO conversion', () => {
		expect(serverValidationToday(new Date('2026-07-21T23:30:00.000Z'))).toBe('2026-07-21');
	});
});
```

- [ ] **Step 2: Run helper tests and verify RED**

Run: `npm test -- src/lib/server/subscriptions/api.test.ts`

Expected: FAIL because `api.ts` is absent.

- [ ] **Step 3: Implement private response, auth, origin, JSON, and error helpers**

Create `src/lib/server/subscriptions/api.ts`:

```ts
import { json } from '@sveltejs/kit';
import { formatCalendarDate } from '$lib/subscriptions/calendar.js';
import type { ApiSuccess, CalendarDate, SubscriptionApiError } from '$lib/subscriptions/types.js';
import { SubscriptionDomainError } from './errors.js';

const PRIVATE_HEADERS = { 'cache-control': 'private, no-store' };

class SubscriptionTransportError extends Error {
	constructor(readonly status: 400 | 500) {
		super(`Subscription transport error ${status}`);
	}
}

export function apiSuccess<T>(data: T, status = 200): Response {
	return json({ ok: true, data } satisfies ApiSuccess<T>, { status, headers: PRIVATE_HEADERS });
}

export function requireApiUser(user: App.Locals['user']): NonNullable<App.Locals['user']> {
	if (!user) throw new SubscriptionDomainError('AUTH_REQUIRED');
	return user;
}

export function requireMutationOrigin(request: Request, url: URL): void {
	if (request.headers.get('origin') !== url.origin) throw new SubscriptionTransportError(400);
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
	try {
		const value = await request.json();
		if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SubscriptionTransportError(400);
		return value as Record<string, unknown>;
	} catch (error) {
		if (error instanceof SubscriptionTransportError) throw error;
		throw new SubscriptionTransportError(400);
	}
}

export function serverValidationToday(now = new Date()): CalendarDate {
	return formatCalendarDate({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate() });
}

export function requireResourceUuid(value: string | undefined, code: 'SUBSCRIPTION_NOT_FOUND' | 'PAYMENT_NOT_FOUND'): string {
	if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new SubscriptionDomainError(code);
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
			return json({ ok: false, code: 'INVALID_INPUT' } satisfies SubscriptionApiError, { status: error.status, headers: PRIVATE_HEADERS });
		}
		console.error('Subscription API failed', error instanceof Error ? error.name : 'UnknownError');
		return json({ ok: false, code: 'INTERNAL_ERROR' } satisfies SubscriptionApiError, { status: 500, headers: PRIVATE_HEADERS });
	}
}
```

Task 1 exports `CalendarParts`, so `serverValidationToday` can use `formatCalendarDate` without duplicating the civil-date structure.

- [ ] **Step 4: Write route tests with hoisted mocks**

For each route test, follow the existing dynamic-import pattern used by `src/routes/api/profile/server.test.ts`: define `vi.hoisted` mocks, `vi.mock('$lib/server/db/index.js', ...)`, mock only the called domain function, and import the handler after mocks.

The five test files must cover this exact matrix:

| Route test | Request | Mock result | Expected |
|---|---|---|---|
| `api/subscriptions/server.test.ts` | authenticated GET | list fixture | `200`, `listSubscriptions(db,userId)` |
| `api/subscriptions/server.test.ts` | unauthenticated POST | no DB call | `401 AUTH_REQUIRED` |
| same | malformed JSON with valid Origin | no mutation call | `400 INVALID_INPUT` |
| same | valid create | `{ id }` | `201`, private cache header |
| `summary/server.test.ts` | missing/invalid `today` | no query call | `422 INVALID_INPUT` |
| same | `?today=2026-07-21` | summary fixture | `200`, query receives branded date |
| `[id]/server.test.ts` | foreign GET | domain 404 | `404 SUBSCRIPTION_NOT_FOUND` |
| same | valid PATCH with Origin | `{ id }` | `200`, validator/mutation called |
| same | valid DELETE with Origin | `void` | `200 { id }` |
| `renew/server.test.ts` | duplicate | domain conflict | `409 RENEWAL_ALREADY_RECORDED` |
| same | valid confirmation | renewal fixture | `200`, no response before mutation resolves |
| `reverse-latest-renewal/server.test.ts` | ineligible | domain conflict | `409 RENEWAL_REVERSAL_NOT_ALLOWED` |
| same | eligible | reversal fixture | `200` |

Use this complete create-route test as the template, replacing only imports, request bodies, and mocked functions in the other files:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	parseCreate: vi.fn(),
	create: vi.fn(),
	list: vi.fn()
}));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/validation.js', async (importOriginal) => ({
	...(await importOriginal()),
	parseCreateSubscriptionRequest: mocks.parseCreate
}));
vi.mock('$lib/server/subscriptions/mutations.js', () => ({ createSubscription: mocks.create }));
vi.mock('$lib/server/subscriptions/queries.js', () => ({ listSubscriptions: mocks.list }));

const { GET, POST } = await import('./+server.js');

function event(
	body: string | undefined,
	user: App.Locals['user'] = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role: 'USER' } as App.Locals['user'],
	method: 'GET' | 'POST' = 'POST'
) {
	const url = new URL('https://example.test/api/subscriptions');
	return {
		request: new Request(url, {
			method,
			headers: { origin: url.origin, 'content-type': 'application/json' },
			...(body === undefined ? {} : { body })
		}),
		url,
		locals: { user },
		params: {}
	} as never;
}

beforeEach(() => vi.clearAllMocks());

describe('/api/subscriptions', () => {
	it('lists only the authenticated user subscriptions', async () => {
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.list.mockResolvedValue([{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }]);
		const response = await GET(event(undefined, undefined, 'GET'));
		expect(response.status).toBe(200);
		expect(mocks.list).toHaveBeenCalledWith(
			{ marker: 'db' },
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
		);
	});

	it('requires authentication', async () => {
		const response = await POST(event('{}', null));
		expect(response.status).toBe(401);
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('rejects malformed JSON', async () => {
		const response = await POST(event('{'));
		expect(response.status).toBe(400);
		expect(mocks.create).not.toHaveBeenCalled();
	});

	it('creates only after validation', async () => {
		const parsed = { marker: 'validated' };
		mocks.parseCreate.mockReturnValue(parsed);
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.create.mockResolvedValue({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' });
		const response = await POST(event('{}'));
		expect(response.status).toBe(201);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(mocks.create).toHaveBeenCalledWith({ marker: 'db' }, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', parsed);
	});
});
```

- [ ] **Step 5: Run route tests and verify RED**

Run:

```bash
npm test -- src/routes/api/subscriptions src/lib/server/subscriptions/api.test.ts
```

Expected: route suites FAIL because handlers do not exist; helper suite PASS after Step 3.

- [ ] **Step 6: Implement list, create, and summary handlers**

Create `src/routes/api/subscriptions/+server.ts`:

```ts
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import { apiSuccess, handleSubscriptionApi, readJsonObject, requireApiUser, requireMutationOrigin, serverValidationToday } from '$lib/server/subscriptions/api.js';
import { createSubscription } from '$lib/server/subscriptions/mutations.js';
import { listSubscriptions } from '$lib/server/subscriptions/queries.js';
import { parseCreateSubscriptionRequest } from '$lib/server/subscriptions/validation.js';

export const GET: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	return apiSuccess(await listSubscriptions(await getDb(), user.id));
});

export const POST: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const input = parseCreateSubscriptionRequest(await readJsonObject(event.request), serverValidationToday());
	return apiSuccess(await createSubscription(await getDb(), user.id, input), 201);
});
```

Create `src/routes/api/subscriptions/summary/+server.ts`:

```ts
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { apiSuccess, handleSubscriptionApi, requireApiUser } from '$lib/server/subscriptions/api.js';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';
import { getSubscriptionSummary } from '$lib/server/subscriptions/summary-query.js';

export const GET: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	const today = parseCalendarDate(event.url.searchParams.get('today'));
	if (!today) throw new SubscriptionDomainError('INVALID_INPUT', { today: ['invalid'] });
	return apiSuccess(await getSubscriptionSummary(await getDb(), user.id, today));
});
```

- [ ] **Step 7: Implement detail/edit/delete handler**

Create `src/routes/api/subscriptions/[id]/+server.ts` with three thin handlers:

```ts
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import { apiSuccess, handleSubscriptionApi, readJsonObject, requireApiUser, requireMutationOrigin, requireResourceUuid, serverValidationToday } from '$lib/server/subscriptions/api.js';
import { softDeleteSubscription, updateSubscription } from '$lib/server/subscriptions/mutations.js';
import { getSubscriptionDetail } from '$lib/server/subscriptions/queries.js';
import { parseUpdateSubscriptionRequest } from '$lib/server/subscriptions/validation.js';

export const GET: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
	return apiSuccess(await getSubscriptionDetail(await getDb(), user.id, id, event.url.searchParams.get('cursor')));
});

export const PATCH: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
	const input = parseUpdateSubscriptionRequest(await readJsonObject(event.request), serverValidationToday());
	return apiSuccess(await updateSubscription(await getDb(), user.id, id, input));
});

export const DELETE: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
	await softDeleteSubscription(await getDb(), user.id, id);
	return apiSuccess({ id });
});
```

- [ ] **Step 8: Implement renewal and reversal handlers**

Create `src/routes/api/subscriptions/[id]/renew/+server.ts`:

```ts
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import { apiSuccess, handleSubscriptionApi, readJsonObject, requireApiUser, requireMutationOrigin, requireResourceUuid, serverValidationToday } from '$lib/server/subscriptions/api.js';
import { renewSubscription } from '$lib/server/subscriptions/mutations.js';
import { parseRenewSubscriptionRequest } from '$lib/server/subscriptions/validation.js';

export const POST: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
	const input = parseRenewSubscriptionRequest(await readJsonObject(event.request), serverValidationToday());
	return apiSuccess(await renewSubscription(await getDb(), user.id, id, input));
});
```

Create `src/routes/api/subscriptions/[id]/reverse-latest-renewal/+server.ts`:

```ts
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import {
	apiSuccess, handleSubscriptionApi, readJsonObject, requireApiUser,
	requireMutationOrigin, requireResourceUuid
} from '$lib/server/subscriptions/api.js';
import { reverseLatestRenewal } from '$lib/server/subscriptions/mutations.js';
import { parseReverseRenewalRequest } from '$lib/server/subscriptions/validation.js';

export const POST: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const id = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
	const input = parseReverseRenewalRequest(await readJsonObject(event.request));
	return apiSuccess(await reverseLatestRenewal(await getDb(), user.id, id, input));
});
```

- [ ] **Step 9: Run core API suites**

Run:

```bash
npm test -- src/lib/server/subscriptions/api.test.ts src/routes/api/subscriptions
npm run check
```

Expected: transport and five core route suites PASS with exact 400/401/404/409/422 statuses and private cache headers.

---

### Task 9: Add Manual-Payment and Budget API Endpoints

**Files:**
- Create: `src/routes/api/subscriptions/[id]/payments/+server.ts`
- Test: `src/routes/api/subscriptions/[id]/payments/server.test.ts`
- Create: `src/routes/api/subscription-payments/[paymentId]/+server.ts`
- Test: `src/routes/api/subscription-payments/[paymentId]/server.test.ts`
- Create: `src/routes/api/subscription-budgets/[currency]/+server.ts`
- Test: `src/routes/api/subscription-budgets/[currency]/server.test.ts`

**Interfaces:**
- Consumes: Task 4 request parsers, Task 6 payment/budget mutations, and Task 8 transport helpers.
- Produces: authenticated, same-origin `POST`, `PATCH`, `PUT`, and `DELETE` endpoints. None of these handlers mutates a subscription billing period.

- [ ] **Step 1: Write focused route tests**

Use the hoisted-mock and dynamic-import pattern from Task 8. Create all three test files and cover this exact matrix:

| Route | Case | Expected |
|---|---|---|
| `POST /api/subscriptions/[id]/payments` | missing user | `401`, no DB call |
| same | foreign/deleted subscription | `404 SUBSCRIPTION_NOT_FOUND` |
| same | valid manual payment | `201`, `createManualPayment(db,userId,id,parsed)` |
| `PATCH /api/subscription-payments/[paymentId]` | renewal payment | `404 PAYMENT_NOT_FOUND` |
| same | initial/manual payment | `200`, period mutation never called |
| `DELETE /api/subscription-payments/[paymentId]` | initial/manual payment | `200 { paymentId }` |
| `PUT /api/subscription-budgets/[currency]` | invalid currency or limit | `422` stable field errors |
| same | valid budget | `200 { currency }` |
| `DELETE /api/subscription-budgets/[currency]` | valid currency | `200 { currency }` |

The manual-payment success test must assert the full call contract:

```ts
it('creates one validated manual payment without changing a period', async () => {
	const parsed = {
		amount: '219', currency: 'THB', paidDate: '2026-07-21',
		servicePeriodStart: '2026-07-01', servicePeriodEnd: '2026-07-31'
	};
	mocks.parsePayment.mockReturnValue(parsed);
	mocks.getDb.mockResolvedValue({ marker: 'db' });
	mocks.createPayment.mockResolvedValue({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' });
	const response = await POST(event('{}'));
	expect(response.status).toBe(201);
	expect(mocks.createPayment).toHaveBeenCalledWith(
		{ marker: 'db' },
		'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
		'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
		parsed
	);
	expect(mocks.updateSubscription).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the endpoint tests and verify RED**

Run:

```bash
npm test -- src/routes/api/subscriptions/\[id\]/payments src/routes/api/subscription-payments src/routes/api/subscription-budgets
```

Expected: FAIL because the three handlers are absent.

- [ ] **Step 3: Implement manual-payment creation**

Create `src/routes/api/subscriptions/[id]/payments/+server.ts`:

```ts
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import {
	apiSuccess, handleSubscriptionApi, readJsonObject, requireApiUser,
	requireMutationOrigin, requireResourceUuid, serverValidationToday
} from '$lib/server/subscriptions/api.js';
import { createManualPayment } from '$lib/server/subscriptions/mutations.js';
import { parsePaymentWriteRequest } from '$lib/server/subscriptions/validation.js';

export const POST: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const subscriptionId = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
	const input = parsePaymentWriteRequest(await readJsonObject(event.request), serverValidationToday());
	return apiSuccess(await createManualPayment(await getDb(), user.id, subscriptionId, input), 201);
});
```

- [ ] **Step 4: Implement editable-payment correction and deletion**

Create `src/routes/api/subscription-payments/[paymentId]/+server.ts`:

```ts
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import {
	apiSuccess, handleSubscriptionApi, readJsonObject, requireApiUser,
	requireMutationOrigin, requireResourceUuid, serverValidationToday
} from '$lib/server/subscriptions/api.js';
import { softDeleteEditablePayment, updateEditablePayment } from '$lib/server/subscriptions/mutations.js';
import { parsePaymentWriteRequest } from '$lib/server/subscriptions/validation.js';

export const PATCH: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const paymentId = requireResourceUuid(event.params.paymentId, 'PAYMENT_NOT_FOUND');
	const input = parsePaymentWriteRequest(await readJsonObject(event.request), serverValidationToday());
	return apiSuccess(await updateEditablePayment(await getDb(), user.id, paymentId, input));
});

export const DELETE: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const paymentId = requireResourceUuid(event.params.paymentId, 'PAYMENT_NOT_FOUND');
	await softDeleteEditablePayment(await getDb(), user.id, paymentId);
	return apiSuccess({ paymentId });
});
```

- [ ] **Step 5: Implement per-currency budget upsert and deletion**

Create `src/routes/api/subscription-budgets/[currency]/+server.ts`:

```ts
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import {
	apiSuccess, handleSubscriptionApi, readJsonObject, requireApiUser,
	requireMutationOrigin
} from '$lib/server/subscriptions/api.js';
import { deleteSubscriptionBudget, upsertSubscriptionBudget } from '$lib/server/subscriptions/mutations.js';
import { parseBudgetCurrency, parseBudgetWriteRequest } from '$lib/server/subscriptions/validation.js';

export const PUT: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const currency = parseBudgetCurrency(event.params.currency);
	const input = parseBudgetWriteRequest(await readJsonObject(event.request), currency);
	return apiSuccess(await upsertSubscriptionBudget(await getDb(), user.id, currency, input));
});

export const DELETE: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	requireMutationOrigin(event.request, event.url);
	const currency = parseBudgetCurrency(event.params.currency);
	await deleteSubscriptionBudget(await getDb(), user.id, currency);
	return apiSuccess({ currency });
});
```

`parseBudgetWriteRequest` already calls `parseBudgetCurrency`; the route also parses the path value once so both mutation methods receive the same canonical currency and DELETE never fabricates a budget body.

- [ ] **Step 6: Run payment/budget API suites and type-check**

Run:

```bash
npm test -- src/routes/api/subscriptions/\[id\]/payments src/routes/api/subscription-payments src/routes/api/subscription-budgets src/lib/server/subscriptions
npm run check
```

Expected: all suites PASS; all write responses are private/no-store; renewal rows remain uneditable through the generic payment endpoint.

---

### Task 10: Add Browser Client Helpers and Authenticated Page Loads

**Files:**
- Create: `src/lib/subscriptions/client.ts`
- Test: `src/lib/subscriptions/client.test.ts`
- Create: `src/routes/[lang=lang]/(app)/subscriptions/+page.server.ts`
- Test: `src/routes/[lang=lang]/(app)/subscriptions/page.server.test.ts`
- Create: `src/routes/[lang=lang]/(app)/subscriptions/new/+page.server.ts`
- Test: `src/routes/[lang=lang]/(app)/subscriptions/new/page.server.test.ts`
- Create: `src/routes/[lang=lang]/(app)/subscriptions/[id]/+page.server.ts`
- Test: `src/routes/[lang=lang]/(app)/subscriptions/[id]/page.server.test.ts`
- Create: `src/routes/[lang=lang]/(app)/subscriptions/[id]/edit/+page.server.ts`
- Test: `src/routes/[lang=lang]/(app)/subscriptions/[id]/edit/page.server.test.ts`

**Interfaces:**
- Consumes: Task 1 calendar helpers, shared API types, Task 5 reads, and `getDb()`.
- Produces: `deviceLocalToday`, `SubscriptionApiRequestError`, `subscriptionFetch`, and private SSR payloads for the four localized pages. SSR does not calculate date-sensitive totals.

- [ ] **Step 1: Write browser-helper tests**

Create `src/lib/subscriptions/client.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { deviceLocalToday, SubscriptionApiRequestError, subscriptionFetch } from './client.js';

describe('subscription browser helpers', () => {
	it('builds today from local fields rather than toISOString', () => {
		const value = { getFullYear: () => 2026, getMonth: () => 6, getDate: () => 21 } as Date;
		expect(deviceLocalToday(value)).toBe('2026-07-21');
	});

	it('returns successful wrapped data and always requests private JSON', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, data: { id: 'one' } }), {
			status: 200, headers: { 'content-type': 'application/json' }
		}));
		await expect(subscriptionFetch('/api/subscriptions', { method: 'POST', body: '{}' }, fetcher)).resolves.toEqual({ id: 'one' });
		expect(fetcher).toHaveBeenCalledWith('/api/subscriptions', expect.objectContaining({ credentials: 'same-origin', cache: 'no-store' }));
	});

	it('throws the stable API body without treating failure as success', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, code: 'RENEWAL_CONFLICT' }), {
			status: 409, headers: { 'content-type': 'application/json' }
		}));
		await expect(subscriptionFetch('/api/subscriptions/x/renew', { method: 'POST' }, fetcher))
			.rejects.toMatchObject<Partial<SubscriptionApiRequestError>>({ status: 409, code: 'RENEWAL_CONFLICT' });
	});

	it('treats a malformed successful response as an internal failure', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response('not-json', { status: 200 }));
		await expect(subscriptionFetch('/api/subscriptions', {}, fetcher))
			.rejects.toMatchObject<Partial<SubscriptionApiRequestError>>({ status: 500, code: 'INTERNAL_ERROR' });
	});
});
```

- [ ] **Step 2: Run helper tests and verify RED**

Run: `npm test -- src/lib/subscriptions/client.test.ts`

Expected: FAIL because `client.ts` is absent.

- [ ] **Step 3: Implement local-date and pessimistic fetch helpers**

Create `src/lib/subscriptions/client.ts`:

```ts
import { formatCalendarDate } from './calendar.js';
import type { ApiResult, CalendarDate, FieldErrorCode, SubscriptionErrorCode } from './types.js';

export class SubscriptionApiRequestError extends Error {
	constructor(
		readonly status: number,
		readonly code: SubscriptionErrorCode,
		readonly fieldErrors: Record<string, FieldErrorCode[]> = {}
	) {
		super(code);
	}
}

export function deviceLocalToday(now = new Date()): CalendarDate {
	return formatCalendarDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}

export async function subscriptionFetch<T>(
	input: RequestInfo | URL,
	init: RequestInit = {},
	fetcher: typeof fetch = fetch
): Promise<T> {
	const headers = new Headers(init.headers);
	if (init.body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');
	const response = await fetcher(input, {
		...init,
		headers,
		credentials: 'same-origin',
		cache: 'no-store'
	});
	let payload: ApiResult<T> | null = null;
	try { payload = await response.json() as ApiResult<T>; } catch { /* handled below */ }
	if (!response.ok) {
		const error = payload && !payload.ok ? payload : null;
		throw new SubscriptionApiRequestError(response.status, error?.code ?? 'INTERNAL_ERROR', error?.fieldErrors);
	}
	if (!payload?.ok) throw new SubscriptionApiRequestError(500, 'INTERNAL_ERROR');
	return payload.data;
}
```

UI components map `error.code` and each `fieldErrors[field]` through Paraglide keys added in Task 11. This helper never invents success state after a failed network or malformed response.

- [ ] **Step 4: Write page-load tests**

Create the four `page.server.test.ts` files using hoisted mocks. Test these exact contracts:

```ts
// Dashboard: reject anonymous users before DB access; load stable private data in parallel.
await expect(load({ locals: { user: null } } as never)).rejects.toMatchObject({ status: 303, location: '/login' });
expect(mocks.getDb).not.toHaveBeenCalled();

mocks.getDb.mockResolvedValue(db);
mocks.listSubscriptions.mockResolvedValue([{ id: 'sub' }]);
mocks.listBudgets.mockResolvedValue([{ currency: 'THB', monthlyLimit: '1000', warningPercent: 80 }]);
mocks.listPlatforms.mockResolvedValue([{ id: 'platform', name: 'Stream GL', logoUrl: null }]);
await expect(load({ locals: { user: { id: 'user' } } } as never)).resolves.toEqual({
	subscriptions: [{ id: 'sub' }], budgets: [{ currency: 'THB', monthlyLimit: '1000', warningPercent: 80 }],
	platforms: [{ id: 'platform', name: 'Stream GL', logoUrl: null }]
});
```

The new-page test expects only platform options. Detail and edit tests pass `params.id` to `getSubscriptionDetail(db,user.id,id)` and propagate its `404`; edit returns `{ subscription, platforms }`. Assert no load imports or calls the date-sensitive summary query.

- [ ] **Step 5: Run load tests and verify RED**

Run:

```bash
npm test -- "src/routes/[lang=lang]/(app)/subscriptions"
```

Expected: FAIL because the page-server modules are absent.

- [ ] **Step 6: Implement the four authenticated page loads**

Create dashboard `+page.server.ts`:

```ts
import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { listPlatformOptions, listSubscriptionBudgets, listSubscriptions } from '$lib/server/subscriptions/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const db = await getDb();
	const [subscriptions, budgets, platforms] = await Promise.all([
		listSubscriptions(db, locals.user.id),
		listSubscriptionBudgets(db, locals.user.id),
		listPlatformOptions(db)
	]);
	return { subscriptions, budgets, platforms };
};
```

Create new-page `+page.server.ts` with the same guard and `{ platforms: await listPlatformOptions(db) }`.

Create detail `+page.server.ts`:

```ts
import { error, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';
import { getSubscriptionDetail } from '$lib/server/subscriptions/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(303, '/login');
	try {
		return { subscription: await getSubscriptionDetail(await getDb(), locals.user.id, params.id) };
	} catch (cause) {
		if (cause instanceof SubscriptionDomainError && cause.status === 404) throw error(404, 'Not found');
		throw cause;
	}
};
```

Create edit `+page.server.ts` using the same `404` mapping and return both the owned subscription and `listPlatformOptions(db)`. Do not expose domain error details in SvelteKit error text.

- [ ] **Step 7: Run client/load suites and check**

Run:

```bash
npm test -- src/lib/subscriptions/client.test.ts "src/routes/[lang=lang]/(app)/subscriptions"
npm run check
```

Expected: all helper and page-load suites PASS; SSR payloads contain no date-sensitive actual/forecast warning calculation.

---

### Task 11: Add Localized Copy and Focused Component-Test Support

**Files:**
- Modify: `messages/th.json`
- Modify: `messages/en.json`
- Modify: `src/lib/subscriptions/client.ts`
- Modify: `src/lib/subscriptions/client.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: stable error codes from the shared contract.
- Produces: compiled `m.subscriptions_*` functions, `subscriptionErrorMessage(error)`, `subscriptionFieldErrorMessage(code)`, and a per-file jsdom component-test environment. No global Vitest environment changes.

- [ ] **Step 1: Install only the focused UI-test dependencies**

Run:

```bash
npm install --save-dev @testing-library/svelte@^5 @testing-library/user-event@^14 jsdom@^26
```

Expected: `package.json` and `package-lock.json` add only these three direct dev dependencies and their transitive packages. Do not add a production dependency or global test setup.

- [ ] **Step 2: Add matching Thai and English message keys**

Add every key below to both catalogs. Keep the catalogs structurally identical; values are exact user-facing copy:

| Key suffix after `subscriptions_` | Thai | English |
|---|---|---|
| `nav` | การสมัครสตรีมมิง | Subscriptions |
| `title` | การสมัครสตรีมมิง | Streaming subscriptions |
| `subtitle` | ติดตามรอบบริการ ค่าใช้จ่ายจริง และซีรีส์ GL ในที่เดียว | Track service periods, actual spend, and related GL series |
| `add` | เพิ่มการสมัคร | Add subscription |
| `actual_title` | จ่ายจริงเดือนนี้ | Paid this month |
| `forecast_title` | คาดการณ์ 30 วันข้างหน้า | Next 30 days forecast |
| `forecast_note` | เป็นการคาดการณ์ ยังไม่บันทึกเป็นค่าใช้จ่าย | Forecast only; not recorded as an expense |
| `budget_title` | งบรายเดือน | Monthly budgets |
| `budget_add` | ตั้งงบ | Set budget |
| `budget_limit` | วงเงินรายเดือน | Monthly limit |
| `budget_warning_percent` | เตือนเมื่อใช้ถึง (%) | Warn at (%) |
| `budget_save` | บันทึกงบ | Save budget |
| `budget_delete` | ลบงบ | Delete budget |
| `budget_safe` | ยังอยู่ในงบ | Within budget |
| `budget_near` | ใกล้ถึงงบ | Near budget |
| `budget_over` | เกินงบแล้ว | Over budget |
| `alerts_title` | รายการที่ควรตรวจสอบ | Items needing attention |
| `expired` | หมดอายุแล้ว | Expired |
| `due_today` | หมดอายุวันนี้ | Expires today |
| `days_remaining` | เหลือ {days} วัน | {days} days remaining |
| `awaiting_confirmation` | รอยืนยันการต่ออายุ | Awaiting renewal confirmation |
| `filter_all` | ทั้งหมด | All |
| `filter_active` | ใช้งาน | Active |
| `filter_canceled` | ยกเลิก | Canceled |
| `search_label` | ค้นหาการสมัคร | Search subscriptions |
| `empty` | ยังไม่มีการสมัครที่ติดตาม | No tracked subscriptions yet |
| `renew` | ต่ออายุแล้ว | Mark renewed |
| `manage` | จัดการ | Manage |
| `edit` | แก้ไข | Edit |
| `delete` | ลบการสมัคร | Delete subscription |
| `delete_confirm` | ยืนยันลบการสมัคร | Confirm subscription deletion |
| `cancel` | ยกเลิก | Cancel |
| `save` | บันทึก | Save |
| `saving` | กำลังบันทึก… | Saving… |
| `retry` | ลองอีกครั้ง | Try again |
| `loading` | กำลังโหลดข้อมูลล่าสุด… | Loading latest data… |
| `platform` | แพลตฟอร์ม | Platform |
| `platform_catalog` | เลือกจากรายการ | Choose from catalog |
| `platform_custom` | ระบุชื่อเอง | Enter a custom name |
| `custom_platform_name` | ชื่อแพลตฟอร์ม | Platform name |
| `plan_name` | ชื่อแพ็กเกจ | Plan name |
| `account_label` | ป้ายกำกับบัญชี | Account label |
| `amount` | ราคา | Amount |
| `currency` | สกุลเงิน | Currency |
| `billing_cycle` | รอบเรียกเก็บ | Billing cycle |
| `billing_day` | วัน | Day |
| `billing_month` | เดือน | Month |
| `billing_year` | ปี | Year |
| `period_start` | วันเริ่มรอบปัจจุบัน | Current period start |
| `period_end` | วันสิ้นสุดรอบปัจจุบัน | Current period end |
| `auto_renew` | ตั้งใจต่ออายุอัตโนมัติ | Intends to auto-renew |
| `status` | สถานะ | Status |
| `status_active` | ใช้งาน | Active |
| `status_canceled` | ยกเลิก | Canceled |
| `alert_days` | แจ้งบนหน้านี้ล่วงหน้า (วัน) | Page warning lead days |
| `initial_payment` | บันทึกรอบปัจจุบันว่าจ่ายแล้ว | Record current period as paid |
| `paid_date` | วันที่จ่าย | Paid date |
| `payment_history` | ประวัติการจ่าย | Payment history |
| `payment_add` | เพิ่มรายการจ่าย | Add payment |
| `payment_initial` | รอบแรก | Initial |
| `payment_manual` | เพิ่มเอง | Manual |
| `payment_renewal` | ต่ออายุ | Renewal |
| `payment_edit` | แก้ไขรายการจ่าย | Edit payment |
| `payment_delete` | ลบรายการจ่าย | Delete payment |
| `payment_locked` | รายการต่ออายุแก้หรือลบโดยตรงไม่ได้ | Renewal payments cannot be edited or deleted directly |
| `related_series` | ซีรีส์ GL ที่เกี่ยวข้อง | Related GL series |
| `renew_title` | ยืนยันการต่ออายุ | Confirm renewal |
| `renew_effect` | ระบบจะบันทึกค่าใช้จ่ายจริง 1 รายการและเลื่อนไปรอบถัดไป 1 รอบ | This records one actual payment and advances exactly one period |
| `renew_confirm` | ยืนยันว่าต่ออายุแล้ว | Confirm renewed |
| `renew_conflict` | ข้อมูลรอบเปลี่ยนไปแล้ว โหลดข้อมูลล่าสุดก่อนลองใหม่ | The period changed; reload the latest data before retrying |
| `reverse_renewal` | ย้อนรายการต่ออายุล่าสุด | Reverse latest renewal |
| `reverse_effect` | ระบบจะลบรายการต่ออายุล่าสุดและคืนรอบบริการก่อนหน้า | The latest renewal payment will be removed and the prior period restored |
| `load_more` | โหลดเพิ่ม | Load more |
| `form_invalid` | ตรวจสอบข้อมูลที่ระบุ | Check the entered information |
| `error_auth_required` | กรุณาเข้าสู่ระบบ | Please sign in |
| `error_invalid_input` | ข้อมูลไม่ถูกต้อง | Invalid input |
| `error_internal` | เกิดข้อผิดพลาด กรุณาลองอีกครั้ง | Something went wrong; please try again |
| `error_unsupported_currency` | ไม่รองรับสกุลเงินนี้ | Unsupported currency |
| `error_platform_not_found` | ไม่พบแพลตฟอร์ม | Platform not found |
| `error_subscription_not_found` | ไม่พบการสมัคร | Subscription not found |
| `error_payment_not_found` | ไม่พบรายการจ่าย | Payment not found |
| `error_renewal_conflict` | ข้อมูลรอบเปลี่ยนไปแล้ว | The billing period changed |
| `error_renewal_already_recorded` | รอบนี้ถูกบันทึกการต่ออายุแล้ว | This period was already renewed |
| `error_renewal_reversal_not_allowed` | ย้อนรายการต่ออายุนี้ไม่ได้ | This renewal cannot be reversed |
| `field_required` | จำเป็นต้องระบุ | Required |
| `field_invalid` | รูปแบบไม่ถูกต้อง | Invalid value |
| `field_too_long` | ข้อความยาวเกินกำหนด | Value is too long |
| `field_out_of_range` | ค่าอยู่นอกช่วงที่รองรับ | Value is outside the allowed range |
| `field_future_date` | วันที่จ่ายอยู่ไกลเกินวันที่ปัจจุบัน | Paid date is too far in the future |
| `field_fraction_digits` | จำนวนทศนิยมไม่ตรงกับสกุลเงิน | Too many fractional digits for this currency |
| `field_source_xor` | เลือกแพลตฟอร์มหรือระบุชื่อเองเพียงอย่างเดียว | Choose a catalog platform or enter a custom name, not both |
| `field_date_order` | วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่ม | End date cannot precede start date |
| `field_duplicate` | มีรายการนี้แล้ว | Duplicate value |
| `seo_title` | จัดการการสมัครสตรีมมิง GL | Manage GL streaming subscriptions |
| `seo_description` | ติดตามวันหมดอายุ ค่าใช้จ่ายจริง งบ และซีรีส์ GL ของแต่ละแพลตฟอร์ม | Track expiry dates, actual spend, budgets, and GL series by platform |

- [ ] **Step 3: Compile messages and verify key parity**

Run:

```bash
npm run i18n:compile
```

Expected: Paraglide generation succeeds. Do not hand-edit generated output. Compare `subscriptions_` key counts in `messages/th.json` and `messages/en.json`; they must match.

- [ ] **Step 4: Add centralized stable-error localization**

Extend `client.ts`:

```ts
import { m } from '$lib/i18n/paraglide.js';

const apiMessages: Record<SubscriptionErrorCode, () => string> = {
	AUTH_REQUIRED: m.subscriptions_error_auth_required,
	INVALID_INPUT: m.subscriptions_error_invalid_input,
	INTERNAL_ERROR: m.subscriptions_error_internal,
	UNSUPPORTED_CURRENCY: m.subscriptions_error_unsupported_currency,
	PLATFORM_NOT_FOUND: m.subscriptions_error_platform_not_found,
	SUBSCRIPTION_NOT_FOUND: m.subscriptions_error_subscription_not_found,
	PAYMENT_NOT_FOUND: m.subscriptions_error_payment_not_found,
	RENEWAL_CONFLICT: m.subscriptions_error_renewal_conflict,
	RENEWAL_ALREADY_RECORDED: m.subscriptions_error_renewal_already_recorded,
	RENEWAL_REVERSAL_NOT_ALLOWED: m.subscriptions_error_renewal_reversal_not_allowed
};

const fieldMessages: Record<FieldErrorCode, () => string> = {
	required: m.subscriptions_field_required,
	invalid: m.subscriptions_field_invalid,
	too_long: m.subscriptions_field_too_long,
	out_of_range: m.subscriptions_field_out_of_range,
	future_date: m.subscriptions_field_future_date,
	fraction_digits: m.subscriptions_field_fraction_digits,
	source_xor: m.subscriptions_field_source_xor,
	date_order: m.subscriptions_field_date_order,
	duplicate: m.subscriptions_field_duplicate
};

export const subscriptionErrorMessage = (error: SubscriptionApiRequestError): string => apiMessages[error.code]();
export const subscriptionFieldErrorMessage = (code: FieldErrorCode): string => fieldMessages[code]();
```

Extend `client.test.ts` to instantiate every `SubscriptionErrorCode` and `FieldErrorCode`, asserting each mapper returns a non-empty string. This makes missing translation mappings a compile-time and runtime failure.

- [ ] **Step 5: Run localization/client tests and check**

Run:

```bash
npm test -- src/lib/subscriptions/client.test.ts
npm run check
```

Expected: helper tests PASS, Paraglide keys type-check, and no existing non-jsdom test changes environment.

---

### Task 12: Build the Dashboard, Budgets, Filters, and Renewal Dialog

**Files:**
- Create: `src/lib/components/subscriptions/SubscriptionSummary.svelte`
- Test: `src/lib/components/subscriptions/SubscriptionSummary.test.ts`
- Create: `src/lib/components/subscriptions/SubscriptionList.svelte`
- Test: `src/lib/components/subscriptions/SubscriptionList.test.ts`
- Create: `src/lib/components/subscriptions/BudgetControls.svelte`
- Test: `src/lib/components/subscriptions/BudgetControls.test.ts`
- Create: `src/lib/components/subscriptions/RenewalDialog.svelte`
- Test: `src/lib/components/subscriptions/RenewalDialog.test.ts`
- Create: `src/routes/[lang=lang]/(app)/subscriptions/+page.svelte`

**Interfaces:**
- Consumes: stable dashboard data from Task 10, browser-local `today`, summary API, renewal API, and localization from Task 11.
- Produces: the approved dashboard-first UI. Actual, forecast, budgets, alerts, filters, and list rows remain separate. Renewal writes only after the dialog's final confirm.

- [ ] **Step 1: Write summary/list component tests**

Each Svelte component test starts with `// @vitest-environment jsdom`, imports `cleanup`/`render` from `@testing-library/svelte`, calls `afterEach(cleanup)`, and uses `userEvent.setup()` for interactions.

Create `SubscriptionSummary.test.ts` with a fixture containing THB actual `500`, THB forecast `219`, USD actual `10`, a near THB budget, and one expired urgency. Assert:

```ts
import { parseCalendarDate } from '$lib/subscriptions/calendar.js';
import type { SubscriptionListItem, SubscriptionSummary as Summary } from '$lib/subscriptions/types.js';

const subscriptions: SubscriptionListItem[] = [{
	id: '11111111-1111-4111-8111-111111111111',
	platformId: '22222222-2222-4222-8222-222222222222',
	customPlatformName: null,
	platform: { id: '22222222-2222-4222-8222-222222222222', name: 'Stream GL', logoUrl: null },
	planName: 'Premium',
	accountLabel: 'Main',
	amount: '219',
	currency: 'THB',
	billingUnit: 'MONTH',
	billingInterval: 1,
	currentPeriodStart: parseCalendarDate('2026-06-22')!,
	currentPeriodEnd: parseCalendarDate('2026-07-20')!,
	renewsAutomatically: true,
	status: 'ACTIVE',
	alertDays: [7, 3, 1],
	scheduleVersion: {
		currentPeriodStart: parseCalendarDate('2026-06-22')!,
		currentPeriodEnd: parseCalendarDate('2026-07-20')!,
		renewalAnchorDate: parseCalendarDate('2026-07-21')!,
		renewalSequence: 0,
		billingUnit: 'MONTH',
		billingInterval: 1
	},
	nextPeriod: { start: parseCalendarDate('2026-07-21')!, end: parseCalendarDate('2026-08-20')! },
	relatedSeries: [],
	relatedSeriesRemaining: 0
}];
const summary: Summary = {
	today: parseCalendarDate('2026-07-21')!,
	monthStart: parseCalendarDate('2026-07-01')!,
	monthEndExclusive: parseCalendarDate('2026-08-01')!,
	forecastEndExclusive: parseCalendarDate('2026-08-20')!,
	actualTotals: [{ currency: 'THB', total: '500' }, { currency: 'USD', total: '10' }],
	forecastTotals: [{ currency: 'THB', total: '219' }],
	budgets: [{ currency: 'THB', actual: '500', monthlyLimit: '600', warningPercent: 80, state: 'NEAR', usageBasisPoints: 8333 }],
	urgencies: [{ subscriptionId: subscriptions[0].id, daysRemaining: -1, state: 'EXPIRED', matchedAlertDay: null, awaitingConfirmation: true }],
	counts: { expired: 1, dueToday: 0, awaitingConfirmation: 1 }
};
const { container } = render(SubscriptionSummary, { props: { summary, subscriptions, loading: false, error: null, onRetry: vi.fn() } });
expect(screen.getByRole('heading', { name: /จ่ายจริงเดือนนี้|Paid this month/ })).toBeTruthy();
expect(screen.getByRole('heading', { name: /คาดการณ์ 30 วัน|30 days forecast/ })).toBeTruthy();
expect(container.querySelector('[data-section="actual"]')?.textContent).toContain('500');
expect(container.querySelector('[data-section="forecast"]')?.textContent).toContain('219');
expect(container.querySelector('[data-currency="THB"]')).toBeTruthy();
expect(container.querySelector('[data-budget-state="NEAR"]')).toBeTruthy();
expect(container.querySelector('[data-section="alerts"]')?.textContent).toContain('Stream GL');
expect(container.querySelector('[aria-busy="true"]')).toBeNull();
```

Also test loading renders a page-local `aria-busy="true"` skeleton, and an error renders a retry button without stale totals.

Create `SubscriptionList.test.ts` with catalog/custom, active/canceled, and duplicate-platform fixtures. Assert search matches platform/plan/account labels, status filtering preserves multiple plans for one platform, custom subscriptions show no inferred related-series block, related-series remainder renders, and every renew/manage control is at least `min-h-11 min-w-11` or `.touch-target`.

- [ ] **Step 2: Write budget and renewal-dialog tests**

`BudgetControls.test.ts` must hold the mutation promise unresolved and assert visible budget data does not change until success:

```ts
let resolveWrite!: (value: { currency: string }) => void;
const request = vi.fn(() => new Promise<{ currency: string }>((resolve) => { resolveWrite = resolve; }));
const changed = vi.fn();
render(BudgetControls, { props: { budgets, currencies: ['THB'], request, onChanged: changed } });
await user.clear(screen.getByLabelText(/monthly|รายเดือน/i));
await user.type(screen.getByLabelText(/monthly|รายเดือน/i), '1200');
await user.click(screen.getByRole('button', { name: /save|บันทึก/i }));
expect(changed).not.toHaveBeenCalled();
expect(screen.getByRole('button', { name: /saving|กำลังบันทึก/i })).toBeDisabled();
resolveWrite({ currency: 'THB' });
await waitFor(() => expect(changed).toHaveBeenCalledOnce());
```

Add a separate first-budget test with `budgets: []` and `currencies: []`. Enter `usd` in the currency field, enter `100` and `80`, submit, and assert the request is exactly:

```ts
expect(request).toHaveBeenCalledWith('/api/subscription-budgets/USD', {
	method: 'PUT',
	body: JSON.stringify({ monthlyLimit: '100', warningPercent: 80 })
});
```

This proves a user can create a budget for any server-supported currency before creating a subscription in that currency.

`RenewalDialog.test.ts` must assert: initial focus lands on paid date; Escape closes before submission; the effect summary and computed next period are visible; controls disable while pending; only one request fires after double click; conflict text appears and calls `onConflict`; failed requests keep the dialog and entered values; success calls `onRenewed`; close restores focus to the trigger supplied as `returnFocusTo`.

- [ ] **Step 3: Run component tests and verify RED**

Run:

```bash
npm test -- src/lib/components/subscriptions/SubscriptionSummary.test.ts src/lib/components/subscriptions/SubscriptionList.test.ts src/lib/components/subscriptions/BudgetControls.test.ts src/lib/components/subscriptions/RenewalDialog.test.ts
```

Expected: FAIL because the components do not exist.

- [ ] **Step 4: Implement the summary surface**

Create `SubscriptionSummary.svelte` with this public contract and state ordering:

```svelte
<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import type { SubscriptionListItem, SubscriptionSummary as Summary } from '$lib/subscriptions/types.js';

	let { summary, subscriptions, loading, error, onRetry }: {
		summary: Summary | null;
		subscriptions: SubscriptionListItem[];
		loading: boolean;
		error: string | null;
		onRetry: () => void;
	} = $props();

	const money = (amount: string, currency: string) => `${currency} ${amount}`;
	const subscriptionLabel = (id: string) => {
		const item = subscriptions.find((subscription) => subscription.id === id);
		return item?.platform?.name ?? item?.customPlatformName ?? item?.planName ?? id;
	};
</script>

<section class="grid gap-px border border-[var(--orbit-line)] bg-[var(--orbit-line)] lg:grid-cols-2" aria-live="polite">
	{#if loading}
		<div class="col-span-full grid min-h-40 animate-pulse place-items-center bg-white p-6" aria-busy="true">
			<span>{m.subscriptions_loading()}</span>
		</div>
	{:else if error}
		<div class="col-span-full bg-white p-6" role="alert">
			<p>{error}</p><button class="touch-target mt-4 border px-4" onclick={onRetry}>{m.subscriptions_retry()}</button>
		</div>
	{:else if summary}
		<article data-section="actual" class="bg-white p-5 sm:p-6">
			<h2 class="font-display text-xl text-plum">{m.subscriptions_actual_title()}</h2>
			{#each summary.actualTotals as item (item.currency)}
				<p data-currency={item.currency} class="mt-3 flex justify-between"><span>{item.currency}</span><strong>{money(item.total, item.currency)}</strong></p>
			{/each}
		</article>
		<article data-section="forecast" class="bg-lavender/10 p-5 sm:p-6">
			<h2 class="font-display text-xl text-plum">{m.subscriptions_forecast_title()}</h2>
			<p class="mt-1 text-sm text-plum/65">{m.subscriptions_forecast_note()}</p>
			{#each summary.forecastTotals as item (item.currency)}
				<p class="mt-3 flex justify-between"><span>{item.currency}</span><strong>{money(item.total, item.currency)}</strong></p>
			{/each}
		</article>
		<article class="bg-white p-5 sm:p-6 lg:col-span-2">
			<h2 class="font-display text-xl text-plum">{m.subscriptions_budget_title()}</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				{#each summary.budgets as budget (budget.currency)}
					<div data-currency={budget.currency} data-budget-state={budget.state} class="border border-[var(--orbit-line)] p-4">
						<div class="flex justify-between"><strong>{budget.currency}</strong><span>{money(budget.actual, budget.currency)} / {money(budget.monthlyLimit, budget.currency)}</span></div>
						<div class="mt-3 h-2 bg-plum/10"><div class="h-full bg-coral" style:width={`${Math.min(100, budget.usageBasisPoints / 100)}%`}></div></div>
						<p class="mt-2 text-sm">{budget.state === 'OVER' ? m.subscriptions_budget_over() : budget.state === 'NEAR' ? m.subscriptions_budget_near() : m.subscriptions_budget_safe()}</p>
					</div>
				{/each}
			</div>
		</article>
		{#if summary.urgencies.some((item) => item.state !== 'SAFE')}
			<article data-section="alerts" class="bg-coral/8 p-5 sm:p-6 lg:col-span-2">
				<h2 class="font-display text-xl text-plum">{m.subscriptions_alerts_title()}</h2>
				<ul class="mt-3 grid gap-2">
					{#each summary.urgencies.filter((item) => item.state !== 'SAFE') as item (item.subscriptionId)}
						<li><a class="touch-target flex items-center border border-coral/40 px-3" href={localizedHref(`/subscriptions/${item.subscriptionId}`)}><strong>{subscriptionLabel(item.subscriptionId)}</strong><span class="ml-2">· {item.state === 'EXPIRED' ? m.subscriptions_expired() : item.state === 'DUE_TODAY' ? m.subscriptions_due_today() : m.subscriptions_days_remaining({ days: item.daysRemaining })}{item.awaitingConfirmation ? ` · ${m.subscriptions_awaiting_confirmation()}` : ''}</span></a></li>
					{/each}
				</ul>
			</article>
		{/if}
	{/if}
</section>
```

Keep actual and forecast on different rectangular surfaces and retain the forecast disclaimer. Exact decimal strings are rendered directly with their currency code; do not convert them to `number` for display.

- [ ] **Step 5: Implement responsive subscription filtering and rows**

Create `SubscriptionList.svelte`. Its props are:

```ts
let { subscriptions, today, onRenew }: {
	subscriptions: SubscriptionListItem[];
	today: CalendarDate;
	onRenew: (item: SubscriptionListItem, trigger: HTMLElement) => void;
} = $props();
let query = $state('');
let status = $state<'ALL' | SubscriptionStatus>('ALL');
let filtered = $derived(subscriptions.filter((item) => {
	const haystack = [item.platform?.name, item.customPlatformName, item.planName, item.accountLabel].filter(Boolean).join(' ').toLocaleLowerCase();
	return (status === 'ALL' || item.status === status) && haystack.includes(query.trim().toLocaleLowerCase());
}));
```

Render: accessible search; three rectangular status buttons with `aria-pressed`; one bordered row/card per subscription; logo or initials; platform/custom name; plan and account label; exact amount/currency/cycle; period end plus `classifyUrgency(item.currentPeriodEnd, today, item.alertDays, item.renewsAutomatically, item.status)` text; up to three related-series links plus `+N`; a `.touch-target` renew button only for active entries; and localized manage link. For custom platforms, omit the related-series region entirely. Desktop uses a column grid; mobile stacks the same information in this order: identity → amount/cycle → expiry → actions.

- [ ] **Step 6: Implement pessimistic budget controls**

Create `BudgetControls.svelte` with props:

```ts
let { budgets, currencies, request = subscriptionFetch, onChanged }: {
	budgets: Array<{ currency: string; monthlyLimit: string; warningPercent: number }>;
	currencies: string[];
	request?: typeof subscriptionFetch;
	onChanged: () => Promise<void> | void;
} = $props();
```

Use local draft fields, but never replace `budgets`. Existing rows initialize drafts from `budgets`. Also render one “set budget” row with an uppercase three-letter currency input; `currencies` supplies `<datalist>` suggestions but never restricts entry to currencies already in subscriptions. Normalize the new-row path segment with `trim().toUpperCase()` and leave authoritative ISO support validation to the server. PUT to `/api/subscription-budgets/{encodeURIComponent(currency)}` only on submit, disable that currency's controls while pending, await `request`, then await `onChanged`. Clear the new-row drafts only after `onChanged` succeeds. DELETE follows the same sequence. Render field errors from `SubscriptionApiRequestError`, a visible `role="alert"`, exact decimal text inputs with `inputmode="decimal"`, warning percent number input bounded `1..100`, and 44px rectangular actions. Label controls with `m.subscriptions_currency()`, `m.subscriptions_budget_limit()`, and `m.subscriptions_budget_warning_percent()`; use `m.subscriptions_budget_add()` for the new-row action.

- [ ] **Step 7: Implement the accessible renewal confirmation dialog**

Create `RenewalDialog.svelte` with props:

```ts
let { subscription, open, returnFocusTo, onClose, onRenewed, onConflict, request = subscriptionFetch }: {
	subscription: SubscriptionListItem | null;
	open: boolean;
	returnFocusTo: HTMLElement | null;
	onClose: () => void;
	onRenewed: () => Promise<void> | void;
	onConflict: () => Promise<void> | void;
	request?: typeof subscriptionFetch;
} = $props();
```

Use a native `<dialog>` bound to an element. An `$effect` calls `showModal()` only when `open && subscription`, seeds paid date with `deviceLocalToday()`, amount/currency with current values, and focuses paid date. `cancel` prevents default while pending. On close, call `returnFocusTo?.focus()`. Trap double submission with an immediate `if (pending) return; pending = true`. POST exactly:

```ts
{
	expectedPeriodEnd: subscription.currentPeriodEnd,
	paidDate,
	amount,
	currency
}
```

Display old period, `subscription.nextPeriod`, paid date, actual amount/currency, and `subscriptions_renew_effect`. On `RENEWAL_CONFLICT` or `RENEWAL_ALREADY_RECORDED`, show localized conflict copy and await `onConflict`; on other errors retain values for retry. Close only after `request` and `onRenewed` both succeed. Style backdrop and panel with square corners, no rounded utility, a clear title via `aria-labelledby`, and cancel/final-confirm buttons.

- [ ] **Step 8: Compose the dashboard page and date refresh**

Create the route page with this state flow:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import BudgetControls from '$lib/components/subscriptions/BudgetControls.svelte';
	import RenewalDialog from '$lib/components/subscriptions/RenewalDialog.svelte';
	import SubscriptionList from '$lib/components/subscriptions/SubscriptionList.svelte';
	import SubscriptionSummary from '$lib/components/subscriptions/SubscriptionSummary.svelte';
	import { deviceLocalToday, subscriptionErrorMessage, subscriptionFetch, SubscriptionApiRequestError } from '$lib/subscriptions/client.js';
	import type { CalendarDate, SubscriptionListItem, SubscriptionSummary as Summary } from '$lib/subscriptions/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let subscriptions = $state(data.subscriptions);
	let budgets = $state(data.budgets);
	let today = $state<CalendarDate | null>(null);
	let summary = $state<Summary | null>(null);
	let loading = $state(true);
	let summaryError = $state<string | null>(null);
	let renewalTarget = $state<SubscriptionListItem | null>(null);
	let renewalTrigger = $state<HTMLElement | null>(null);
	let budgetCurrencies = $derived([...new Set([
		...subscriptions.map((item) => item.currency),
		...budgets.map((item) => item.currency)
	])].sort());

	async function refreshStableData() {
		const refreshed = await subscriptionFetch<SubscriptionListItem[]>('/api/subscriptions');
		subscriptions = refreshed;
	}
	async function refreshSummary() {
		loading = true; summaryError = null;
		const localToday = deviceLocalToday();
		today = localToday;
		try {
			const nextSummary = await subscriptionFetch<Summary>(`/api/subscriptions/summary?today=${localToday}`);
			summary = nextSummary;
			budgets = nextSummary.budgets.map(({ currency, monthlyLimit, warningPercent }) => ({ currency, monthlyLimit, warningPercent }));
		}
		catch (error) { summary = null; summaryError = error instanceof SubscriptionApiRequestError ? subscriptionErrorMessage(error) : m.subscriptions_error_internal(); }
		finally { loading = false; }
	}
	async function refreshAll() {
		const targetId = renewalTarget?.id;
		await Promise.all([refreshStableData(), refreshSummary()]);
		if (targetId) renewalTarget = subscriptions.find((item) => item.id === targetId) ?? renewalTarget;
	}

	onMount(() => {
		void refreshSummary();
		const refreshIfDateChanged = () => { if (today === null || deviceLocalToday() !== today) void refreshSummary(); };
		document.addEventListener('visibilitychange', refreshIfDateChanged);
		const timer = window.setInterval(refreshIfDateChanged, 60_000);
		return () => { document.removeEventListener('visibilitychange', refreshIfDateChanged); clearInterval(timer); };
	});
</script>
```

Add `<svelte:head>` localized title/description. Render heading/add action, `<SubscriptionSummary {summary} {subscriptions} {loading} error={summaryError} onRetry={refreshSummary} />`, `<BudgetControls budgets={budgets} currencies={budgetCurrencies} onChanged={refreshSummary} />`, `SubscriptionList`, and one `RenewalDialog`. Render `SubscriptionList` only when `today !== null`; before browser-local initialization, show a rectangular page-local `aria-busy="true"` list skeleton instead of computing expiry from the server clock. `onRenew` stores both target and trigger. After successful renewal call `refreshAll`; on conflict call `refreshAll`, remap `renewalTarget` to the freshly loaded row, and keep the dialog error visible. Task 8's authenticated `GET /api/subscriptions` supplies `refreshStableData`. Successful budget writes call `refreshSummary`, whose authoritative response replaces both the displayed summary and editable budget props; failed writes leave both unchanged.

- [ ] **Step 9: Run dashboard suites and check**

Run:

```bash
npm test -- src/lib/components/subscriptions src/routes/api/subscriptions/server.test.ts
npm run check
```

Expected: dashboard component tests PASS; actual and forecast remain distinct; no financial state changes before API success; route-level pending-shell removal test remains green.

---

### Task 13: Build Dedicated Create and Edit Workflows

**Files:**
- Create: `src/lib/components/subscriptions/SubscriptionForm.svelte`
- Test: `src/lib/components/subscriptions/SubscriptionForm.test.ts`
- Create: `src/routes/[lang=lang]/(app)/subscriptions/new/+page.svelte`
- Create: `src/routes/[lang=lang]/(app)/subscriptions/[id]/edit/+page.svelte`

**Interfaces:**
- Consumes: Task 10 page data, Task 11 localized errors, and create/update/delete APIs.
- Produces: one reusable long-form component with create/edit modes; catalog/custom switching; optional initial payment defaulting off; full schedule CAS on edit; cancellation and soft deletion.

- [ ] **Step 1: Write form behavior tests**

Create `SubscriptionForm.test.ts` under jsdom. Define `platforms` with two items and an editable subscription fixture. Cover:

```ts
it('switches catalog/custom sources without submitting both', async () => {
	render(SubscriptionForm, { props: { mode: 'create', platforms, subscription: null, request, onSaved } });
	await user.click(screen.getByRole('radio', { name: /custom|ระบุชื่อเอง/i }));
	await user.type(screen.getByLabelText(/platform name|ชื่อแพลตฟอร์ม/i), 'Indie GL');
	await user.click(screen.getByRole('button', { name: /^save$|^บันทึก$/i }));
	expect(request).toHaveBeenCalledWith('/api/subscriptions', expect.objectContaining({
		method: 'POST',
		body: expect.stringContaining('"customPlatformName":"Indie GL"')
	}));
	expect(JSON.parse(request.mock.calls[0][1].body).platformId).toBeNull();
});

it('keeps the initial-payment option off and reveals paid date only when enabled', async () => {
	render(SubscriptionForm, { props: { mode: 'create', platforms, subscription: null, request, onSaved } });
	expect(screen.queryByLabelText(/paid date|วันที่จ่าย/i)).toBeNull();
	expect(screen.getByRole('checkbox', { name: /record current|บันทึกรอบปัจจุบัน/i })).not.toBeChecked();
	await user.click(screen.getByRole('checkbox', { name: /record current|บันทึกรอบปัจจุบัน/i }));
	expect(screen.getByLabelText(/paid date|วันที่จ่าย/i)).toBeTruthy();
});
```

Also assert: create payload carries exact amount text and normalized integer alert-day array; edit sends `PATCH /api/subscriptions/{id}` with the fixture's complete `expectedSchedule`; server field errors render beside matching controls; submit remains disabled while pending; failure retains all values; success alone calls `onSaved`; canceled status is available only in edit mode; delete requires a second explicit confirmation and calls `onDelete` once.

Add a malformed warning-day case so client parsing never silently drops bad tokens:

```ts
await user.clear(screen.getByLabelText(/warning days|วันเตือนล่วงหน้า/i));
await user.type(screen.getByLabelText(/warning days|วันเตือนล่วงหน้า/i), '7, soon, 1');
await user.click(screen.getByRole('button', { name: /^save$|^บันทึก$/i }));
expect(request).not.toHaveBeenCalled();
expect(screen.getByLabelText(/warning days|วันเตือนล่วงหน้า/i)).toHaveAttribute('aria-invalid', 'true');
```

- [ ] **Step 2: Run form test and verify RED**

Run: `npm test -- src/lib/components/subscriptions/SubscriptionForm.test.ts`

Expected: FAIL because the form component is absent.

- [ ] **Step 3: Implement shared form state and payload construction**

Create `SubscriptionForm.svelte` with this contract and initialization:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { deviceLocalToday, subscriptionErrorMessage, subscriptionFetch, subscriptionFieldErrorMessage, SubscriptionApiRequestError } from '$lib/subscriptions/client.js';
	import type { CalendarDate, FieldErrorCode, PlatformOption, SubscriptionDetail } from '$lib/subscriptions/types.js';

	let { mode, platforms, subscription, request = subscriptionFetch, onSaved, onDelete }: {
		mode: 'create' | 'edit';
		platforms: PlatformOption[];
		subscription: SubscriptionDetail | null;
		request?: typeof subscriptionFetch;
		onSaved: (id: string) => Promise<void> | void;
		onDelete?: () => Promise<void> | void;
	} = $props();

	let sourceMode = $state<'catalog' | 'custom'>(subscription ? (subscription.platform ? 'catalog' : 'custom') : 'catalog');
	let platformId = $state(subscription?.platform?.id ?? '');
	let customPlatformName = $state(subscription?.customPlatformName ?? '');
	let planName = $state(subscription?.planName ?? '');
	let accountLabel = $state(subscription?.accountLabel ?? '');
	let amount = $state(subscription?.amount ?? '');
	let currency = $state(subscription?.currency ?? 'THB');
	let billingUnit = $state(subscription?.billingUnit ?? 'MONTH');
	let billingInterval = $state(subscription?.billingInterval ?? 1);
	let currentPeriodStart = $state<CalendarDate | ''>(subscription?.currentPeriodStart ?? '');
	let currentPeriodEnd = $state<CalendarDate | ''>(subscription?.currentPeriodEnd ?? '');
	let renewsAutomatically = $state(subscription?.renewsAutomatically ?? true);
	let status = $state(subscription?.status ?? 'ACTIVE');
	let alertDaysText = $state((subscription?.alertDays ?? [7, 3, 1]).join(', '));
	let recordInitialPayment = $state(false);
	let initialPaidDate = $state<CalendarDate | ''>('');
	let pending = $state(false);
	let formError = $state<string | null>(null);
	let fieldErrors = $state<Record<string, FieldErrorCode[]>>({});
	let deleteArmed = $state(false);

	onMount(() => {
		if (mode !== 'create') return;
		const today = deviceLocalToday();
		if (!currentPeriodStart) currentPeriodStart = today;
		if (!currentPeriodEnd) currentPeriodEnd = today;
		if (!initialPaidDate) initialPaidDate = today;
	});

	function parseAlertDaysDraft(): number[] | null {
		const trimmed = alertDaysText.trim();
		if (!trimmed) return [];
		const tokens = trimmed.split(',').map((value) => value.trim());
		if (tokens.some((value) => !/^-?\d+$/.test(value))) return null;
		return [...new Set(tokens.map(Number))].sort((a, b) => b - a);
	}
	const payload = (alertDays: number[]) => ({
		platformId: sourceMode === 'catalog' ? platformId || null : null,
		customPlatformName: sourceMode === 'custom' ? customPlatformName : null,
		planName: planName || null, accountLabel: accountLabel || null, amount, currency: currency.toUpperCase(),
		billingUnit, billingInterval: Number(billingInterval), currentPeriodStart, currentPeriodEnd,
		renewsAutomatically, status, alertDays,
		...(mode === 'create'
			? { recordInitialPayment, initialPaidDate: recordInitialPayment ? initialPaidDate : null }
			: { expectedSchedule: subscription!.scheduleVersion })
	});
</script>
```

`submit` immediately returns when pending, clears displayed errors, and calls `parseAlertDaysDraft()`. When it returns `null`, set `fieldErrors = { alertDays: ['invalid'] }`, focus the warning-day input, and return without making a request. Otherwise send POST or PATCH with `JSON.stringify(payload(parsedAlertDays))`, and call `onSaved` only after response success. Catch `SubscriptionApiRequestError`, retain all field state, set `fieldErrors`, and render `subscriptionErrorMessage`; map unexpected failures to `m.subscriptions_error_internal()`. Render each field's first/all error codes directly below its control with `aria-describedby`; do not rely on color alone. Values such as `-1` remain integers and reach authoritative server range validation; malformed or fractional tokens are blocked locally rather than discarded. Disable create submission until `onMount` has seeded empty civil-date drafts from the browser's local calendar; edit-mode dates always come from the server record and are never rewritten on mount.

- [ ] **Step 4: Implement the complete rectangular form markup**

Use one `<form onsubmit>` divided into these bordered, square-corner sections:

1. **Source:** two radio controls; catalog `<select>` or custom text input. Changing source mode clears the hidden source value immediately.
2. **Identity:** optional plan and account label text inputs, each `maxlength="120"`.
3. **Price/cycle:** amount text input with `inputmode="decimal"`; uppercase three-letter currency input; interval number; DAY/MONTH/YEAR select.
4. **Current period:** two `type="date"` inputs. Never call `new Date(value)` or `toISOString()`.
5. **Behavior:** auto-renew checkbox, edit-only ACTIVE/CANCELED select, comma-separated warning-day input.
6. **Initial payment:** create-only checkbox default off; when checked, reveal paid-date input and an explicit note that this creates an actual expense.
7. **Actions:** localized cancel link and submit button. In edit mode, include a separate danger region where first click uses `m.subscriptions_delete()` and arms confirmation; the second uses `m.subscriptions_delete_confirm()` and calls `onDelete`. Both actions are disabled while pending.

Use `<fieldset>`/`<legend>`, associated labels, `aria-invalid`, `role="alert"`, `.touch-target`, `rounded-none`, and visible `focus-visible` rings. Do not use a modal for this long form.

Implement deletion pessimistically:

```ts
async function confirmDelete() {
	if (!deleteArmed) { deleteArmed = true; return; }
	if (pending || !onDelete) return;
	pending = true;
	try { await onDelete(); }
	catch (error) { formError = error instanceof SubscriptionApiRequestError ? subscriptionErrorMessage(error) : m.subscriptions_error_internal(); pending = false; }
}
```

- [ ] **Step 5: Compose the dedicated create page**

Create `subscriptions/new/+page.svelte`:

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import SubscriptionForm from '$lib/components/subscriptions/SubscriptionForm.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{m.subscriptions_add()} · GL Orbit</title></svelte:head>
<main class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
	<a class="touch-target inline-flex items-center" href={localizedHref('/subscriptions')}>← {m.subscriptions_cancel()}</a>
	<h1 class="mt-6 font-display text-3xl text-plum">{m.subscriptions_add()}</h1>
	<div class="mt-6 border border-[var(--orbit-line)] bg-white p-4 sm:p-8">
		<SubscriptionForm
			mode="create" platforms={data.platforms} subscription={null}
			onSaved={(id) => goto(localizedHref(`/subscriptions/${id}`))}
		/>
	</div>
</main>
```

- [ ] **Step 6: Compose the dedicated edit page**

Create `subscriptions/[id]/edit/+page.svelte` with the same shell, `mode="edit"`, `subscription={data.subscription}`, and:

```ts
const detailHref = localizedHref(`/subscriptions/${data.subscription.id}`);
const saved = () => goto(detailHref, { invalidateAll: true });
const deleted = async () => {
	await subscriptionFetch(`/api/subscriptions/${data.subscription.id}`, { method: 'DELETE' });
	await goto(localizedHref('/subscriptions'), { invalidateAll: true });
};
```

Pass `onSaved={saved}` and `onDelete={deleted}`. The component itself performs PATCH; delete remains an explicit second action. Do not modify payment history while editing expected price/cycle.

- [ ] **Step 7: Run form/page checks**

Run:

```bash
npm test -- src/lib/components/subscriptions/SubscriptionForm.test.ts "src/routes/[lang=lang]/(app)/subscriptions"
npm run check
```

Expected: form and page-load suites PASS; create defaults to no payment; edit carries complete CAS schedule; server field errors remain visible next to controls.

---

### Task 14: Build Subscription Detail, Ledger History, and Safe Reversal

**Files:**
- Modify: `src/routes/api/subscriptions/[id]/payments/+server.ts`
- Modify: `src/routes/api/subscriptions/[id]/payments/server.test.ts`
- Create: `src/lib/components/subscriptions/PaymentHistory.svelte`
- Test: `src/lib/components/subscriptions/PaymentHistory.test.ts`
- Create: `src/routes/[lang=lang]/(app)/subscriptions/[id]/+page.svelte`
- Modify: `messages/th.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: owned detail/payment reads, editable-payment APIs, reversal API, renewal dialog, and first payment page from SSR.
- Produces: paginated 25-row ledger UI, manual entry/correction/deletion, immutable renewal rows, latest-renewal reversal, full related-series display, and detail-page renewal.

- [ ] **Step 1: Add detail-only message keys in both locales**

Add matching keys:

| Key | Thai | English |
|---|---|---|
| `subscriptions_overview` | ภาพรวมการสมัคร | Subscription overview |
| `subscriptions_service_period` | รอบบริการ | Service period |
| `subscriptions_back` | กลับหน้าการสมัคร | Back to subscriptions |
| `subscriptions_no_payments` | ยังไม่มีรายการจ่ายจริง | No actual payments yet |
| `subscriptions_payment_save` | บันทึกรายการจ่าย | Save payment |
| `subscriptions_payment_confirm_delete` | ยืนยันลบรายการนี้ | Confirm payment deletion |
| `subscriptions_reverse_confirm` | ยืนยันย้อนรายการต่ออายุ | Confirm renewal reversal |
| `subscriptions_no_related_series` | ยังไม่พบซีรีส์ GL ที่เชื่อมกับแพลตฟอร์มนี้ | No related GL series found for this platform |

Run `npm run i18n:compile`; expected: both catalogs compile with equal `subscriptions_` key sets.

- [ ] **Step 2: Extend route tests for owned payment pagination**

In `subscriptions/[id]/payments/server.test.ts`, mock `listSubscriptionPayments` and add:

```ts
it('returns an owned 25-row payment page using the opaque cursor', async () => {
	mocks.getDb.mockResolvedValue({ marker: 'db' });
	mocks.listPayments.mockResolvedValue({ items: [{ id: 'payment' }], nextCursor: 'next' });
	const response = await GET(event(undefined, 'GET', '?cursor=opaque'));
	expect(response.status).toBe(200);
	expect(mocks.listPayments).toHaveBeenCalledWith(
		{ marker: 'db' }, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
		'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'opaque', 25
	);
});
```

Also assert a malformed cursor becomes `422 INVALID_INPUT` rather than silently returning page one. Make `listSubscriptionPayments` throw `SubscriptionDomainError('INVALID_INPUT', { cursor: ['invalid'] })` when a non-empty cursor fails decoding.

- [ ] **Step 3: Implement payment-page GET**

Add to `subscriptions/[id]/payments/+server.ts`:

```ts
import { listSubscriptionPayments } from '$lib/server/subscriptions/queries.js';

export const GET: RequestHandler = (event) => handleSubscriptionApi(async () => {
	const user = requireApiUser(event.locals.user);
	const subscriptionId = requireResourceUuid(event.params.id, 'SUBSCRIPTION_NOT_FOUND');
	return apiSuccess(await listSubscriptionPayments(
		await getDb(), user.id, subscriptionId, event.url.searchParams.get('cursor'), 25
	));
});
```

GET needs no Origin check. It still receives private/no-store headers through `apiSuccess`.

- [ ] **Step 4: Write ledger interaction tests**

Create `PaymentHistory.test.ts` under jsdom. Cover these cases with deferred request promises:

1. `load more` requests the exact encoded cursor and appends the returned authoritative page once.
2. Initial/manual rows expose edit/delete controls; renewal rows expose neither.
3. Editing sends `PATCH /api/subscription-payments/{id}` with exact decimal/date strings and never calls a subscription route.
4. Deletion requires a second explicit click, sends `DELETE`, and retains the row until success.
5. `canReverse: true` renewal shows reversal; other renewals show locked copy only.
6. Reversal sends `{ paymentId }` to `/api/subscriptions/{subscriptionId}/reverse-latest-renewal`, waits, then calls `onChanged`.
7. Network/domain failure preserves rows and editable values and renders a retryable localized error.
8. Replacing the incoming first-page prop after parent invalidation replaces stale local rows/cursor instead of retaining a prior load-more snapshot.

Use this invariant assertion for every financial write:

```ts
await user.click(screen.getByRole('button', { name: /save payment|บันทึกรายการจ่าย/i }));
expect(screen.getByTestId('payment-row-payment-1')).toBeTruthy();
expect(onChanged).not.toHaveBeenCalled();
resolveRequest({ id: 'payment-1' });
await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
```

Use a rerender assertion for incoming-page synchronization:

```ts
const view = render(PaymentHistory, { props: { subscriptionId, page: firstPage, request, onChanged } });
await view.rerender({ subscriptionId, page: refreshedFirstPage, request, onChanged });
expect(screen.queryByTestId('payment-row-stale')).toBeNull();
expect(screen.getByTestId('payment-row-refreshed')).toBeTruthy();
```

- [ ] **Step 5: Run ledger tests and verify RED**

Run:

```bash
npm test -- src/lib/components/subscriptions/PaymentHistory.test.ts src/routes/api/subscriptions/\[id\]/payments/server.test.ts
```

Expected: component test FAIL because `PaymentHistory.svelte` is absent; extended route test fails until GET and cursor rejection are implemented.

- [ ] **Step 6: Implement payment history state and pagination**

Create `PaymentHistory.svelte` with this contract:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { deviceLocalToday, subscriptionErrorMessage, subscriptionFetch, SubscriptionApiRequestError } from '$lib/subscriptions/client.js';
	import type { CalendarDate, PaymentItem, PaymentPage } from '$lib/subscriptions/types.js';

	let { subscriptionId, page, request = subscriptionFetch, onChanged }: {
		subscriptionId: string;
		page: PaymentPage;
		request?: typeof subscriptionFetch;
		onChanged: () => Promise<PaymentPage>;
	} = $props();
	let items = $state(page.items);
	let nextCursor = $state(page.nextCursor);
	let pendingKey = $state<string | null>(null);
	let errorText = $state<string | null>(null);
	let editingId = $state<string | null>(null);
	let deleteArmedId = $state<string | null>(null);
	let reverseArmedId = $state<string | null>(null);
	let draft = $state<{ amount: string; currency: string; paidDate: CalendarDate | ''; servicePeriodStart: CalendarDate | ''; servicePeriodEnd: CalendarDate | '' }>({
		amount: '', currency: 'THB', paidDate: '', servicePeriodStart: '', servicePeriodEnd: ''
	});
	let lastIncomingPage = page;

	onMount(() => {
		const today = deviceLocalToday();
		draft = { ...draft, paidDate: today, servicePeriodStart: today, servicePeriodEnd: today };
	});

	$effect(() => {
		const incoming = page;
		if (incoming === lastIncomingPage) return;
		lastIncomingPage = incoming;
		items = incoming.items;
		nextCursor = incoming.nextCursor;
	});

	async function replaceFromServer() {
		const fresh = await onChanged();
		items = fresh.items;
		nextCursor = fresh.nextCursor;
	}
	async function run(key: string, operation: () => Promise<unknown>) {
		if (pendingKey) return;
		pendingKey = key; errorText = null;
		try { await operation(); await replaceFromServer(); editingId = null; deleteArmedId = null; reverseArmedId = null; }
		catch (error) { errorText = error instanceof SubscriptionApiRequestError ? subscriptionErrorMessage(error) : m.subscriptions_error_internal(); }
		finally { pendingKey = null; }
	}
</script>
```

For load-more, request `PaymentPage` with `?cursor=${encodeURIComponent(nextCursor)}`, append only IDs not already present, then replace `nextCursor`; do not call `onChanged`, which intentionally reloads page one after writes.

- [ ] **Step 7: Implement manual add/edit/delete and reversal markup**

At top, render a collapsed/expanded manual-payment form with exact amount/currency, paid date, service start/end. POST to `/api/subscriptions/{subscriptionId}/payments`. For each row:

- Render kind, exact `currency amount`, paid date, and inclusive service period.
- If `canEdit`, an edit button copies row fields into `draft`; save PATCHes `/api/subscription-payments/{id}`.
- If `canDelete`, first click sets `deleteArmedId`; second DELETEs the same endpoint.
- If kind is `RENEWAL`, render `subscriptions_payment_locked`; if `canReverse`, show a separate two-click reversal action that POSTs `{ paymentId: item.id }` to the subscription reversal endpoint.
- Disable every financial action while any write is pending. Leave all rows in place until the request and authoritative refresh succeed.
- Render load-more only when `nextCursor`; mark its region `aria-busy` while loading.

All editor inputs use labels and server field errors. Keep add/save controls disabled until the browser-local date drafts are non-empty. Actions are rectangular 44px targets. The history is a desktop table-like grid and mobile ordered cards, without rounded containers.

- [ ] **Step 8: Build the owned detail page**

Create `subscriptions/[id]/+page.svelte`:

```svelte
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import PaymentHistory from '$lib/components/subscriptions/PaymentHistory.svelte';
	import RenewalDialog from '$lib/components/subscriptions/RenewalDialog.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import { deviceLocalToday, subscriptionFetch } from '$lib/subscriptions/client.js';
	import type { CalendarDate, PaymentPage } from '$lib/subscriptions/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let renewalOpen = $state(false);
	let renewalTrigger = $state<HTMLElement | null>(null);
	let today = $state<CalendarDate | null>(null);

	onMount(() => { today = deviceLocalToday(); });

	async function reloadPayments(): Promise<PaymentPage> {
		const page = await subscriptionFetch<PaymentPage>(`/api/subscriptions/${data.subscription.id}/payments`);
		await invalidateAll();
		return page;
	}
</script>
```

Render, in order: back link; platform/custom identity; plan/account; exact price/cycle/status; current inclusive service period and expiry state using `today`; edit and active-only renewal actions; full related-series grid for catalog entries (custom entries omit inference); payment history. Before `onMount` supplies browser-local `today`, render a page-local `aria-busy="true"` expiry skeleton and do not derive expiry from the SSR clock. Use localized series titles and localized series links. Pass `data.subscription.payments` to `PaymentHistory`; pass `data.subscription` to `RenewalDialog`. On renewal/reversal/payment success, call `invalidateAll` or `reloadPayments` only after the write succeeds. The renewal dialog receives the exact trigger for focus restoration.

- [ ] **Step 9: Run detail, ledger, API, and check suites**

Run:

```bash
npm test -- src/lib/components/subscriptions/PaymentHistory.test.ts src/lib/components/subscriptions/RenewalDialog.test.ts src/routes/api/subscriptions/\[id\]/payments/server.test.ts "src/routes/[lang=lang]/(app)/subscriptions/[id]"
npm run check
```

Expected: pagination, immutable renewal rows, and reversal eligibility tests PASS; detail routes type-check; no failed financial write changes visible ledger/period state.

---

### Task 15: Wire Navigation and Run Integrated Verification

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/menus/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/profile/+page.svelte`
- Create: `src/routes/[lang=lang]/(app)/subscriptions/navigation.test.ts`
- Verify: every file listed in the locked structure and generated migration artifacts.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: discoverable authenticated navigation and one integrated, release-ready feature slice. No deployment or database application occurs.

- [ ] **Step 1: Write navigation and forbidden-integration tests**

Create `subscriptions/navigation.test.ts` as a source-level Vitest test, matching existing repository tests that enforce structural conventions:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const menu = readFileSync('src/routes/[lang=lang]/(app)/menus/+page.svelte', 'utf8');
const profile = readFileSync('src/routes/[lang=lang]/(app)/profile/+page.svelte', 'utf8');
const schema = readFileSync('src/lib/server/db/schema.ts', 'utf8');

describe('subscription feature integration', () => {
	it('links authenticated menu and profile surfaces through localizedHref', () => {
		expect(menu).toContain("localizedHref('/subscriptions', page.data.lang)");
		expect(profile).toContain("localizedHref('/subscriptions'");
		expect(menu).toContain('m.subscriptions_nav()');
	});

	it('does not add notification, cron, timezone, or route pending-shell coupling', () => {
		expect(schema).toMatch(/pgTable\(['"]user_subscriptions['"]/);
		expect(schema).toMatch(/pgTable\(['"]subscription_payments['"]/);
		expect(schema).toMatch(/pgTable\(['"]subscription_budgets['"]/);
		expect(schema).not.toMatch(/subscription_(?:notifications?|reminders?|timezones?)|subscriptionTimezone/i);
		for (const source of [menu, profile]) expect(source).not.toContain('SubscriptionPendingShell');
	});
});
```

- [ ] **Step 2: Run the navigation test and verify RED**

Run: `npm test -- "src/routes/[lang=lang]/(app)/subscriptions/navigation.test.ts"`

Expected: FAIL because the links are not wired yet.

- [ ] **Step 3: Add the authenticated menu entry**

Inside the existing `{#if currentUser}` menu region, immediately after the profile link, add a separate square Orbit Editorial action:

```svelte
<a
	href={localizedHref('/subscriptions', page.data.lang)}
	class="group orbit-surface flex min-h-14 items-center gap-4 border border-[var(--orbit-line)] p-4 transition-colors hover:bg-cream touch-target sm:p-5"
>
	<div class="grid h-14 w-14 shrink-0 place-items-center bg-mint/20 text-plum">
		<svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h10M7 4v6m10-6v6" />
		</svg>
	</div>
	<div class="min-w-0 flex-1">
		<h2 class="font-[family-name:var(--font-display)] text-lg font-black text-plum">{m.subscriptions_nav()}</h2>
		<p class="mt-1 text-sm text-plum-light">{m.subscriptions_subtitle()}</p>
	</div>
	<span aria-hidden="true" class="text-xl text-coral-dark">→</span>
</a>
```

Do not restyle unrelated legacy menu cards in this task.

- [ ] **Step 4: Add the profile account-surface entry**

Inside `accountSection === 'account'`, after the read-only account information and before push settings, add:

```svelte
<a
	href={localizedHref('/subscriptions')}
	class="flex min-h-14 items-center justify-between gap-4 border border-[var(--orbit-line-strong)] bg-white p-4 text-plum transition-colors hover:bg-cream touch-target sm:p-5"
>
	<span>
		<strong class="block font-[family-name:var(--font-display)]">{m.subscriptions_nav()}</strong>
		<span class="mt-1 block text-sm text-plum-light">{m.subscriptions_subtitle()}</span>
	</span>
	<span aria-hidden="true" class="text-xl text-coral-dark">→</span>
</a>
```

`localizedHref` is already imported in the profile component; do not expand its existing tab/section union or refactor unrelated push/profile styles.

- [ ] **Step 5: Inspect migration and generated metadata without applying it**

Run:

```bash
git diff -- src/lib/server/db/schema.ts drizzle/0024_subscription_tracker.sql drizzle/meta/0024_snapshot.json drizzle/meta/_journal.json
```

Expected: additive creation of exactly three tables and three enums plus checks/indexes/FKs; no altered or dropped existing table/column; no data migration; no notification/timezone schema change. If Drizzle generated a different migration sequence number because the repository advanced, use that generated number consistently instead of renaming metadata manually.

Do **not** run `npm run db:push`.

- [ ] **Step 6: Run all focused subscription suites**

Run:

```bash
npm test -- \
  src/lib/subscriptions \
  src/lib/server/subscriptions \
  src/lib/server/db/schema.test.ts \
  src/routes/api/subscriptions \
  src/routes/api/subscription-payments \
  src/routes/api/subscription-budgets \
  src/lib/components/subscriptions \
  "src/routes/[lang=lang]/(app)/subscriptions"
```

Expected: every focused unit/domain/route/component/source test PASS. Specifically verify output includes month-end/leap recurrence, exact currency grouping, duplicate renewal, CAS conflict, rollback/zero-row CTE, ownership 404, soft-delete ledger preservation, immutable renewal, latest reversal, summary day-29/day-30, dialog focus, and non-optimistic UI cases.

- [ ] **Step 7: Run project-wide static and production checks**

Run:

```bash
npm run check
npm run build
npm test -- src/lib/components/pending-shell-removal.test.ts
git diff --check
```

Expected: Svelte/TypeScript check reports zero errors, production build succeeds, route-level pending shells remain absent, and the diff has no whitespace errors.

- [ ] **Step 8: Perform authenticated browser verification at desktop and mobile sizes**

Run `npm run dev`, sign in with a non-production test user, and verify at approximately `1440×900` and `390×844`:

1. Menu/profile links open the localized private dashboard; anonymous navigation redirects to login.
2. Dashboard order is actual → forecast → budgets → action alerts → filters/list; currencies never combine.
3. Create catalog and custom subscriptions; initial payment is off by default; multiple plans on one platform coexist.
4. Local day change/visibility refresh updates summary; forecast excludes exactly day 30; expiry messages stay page-local.
5. Budget near/over state changes only after successful save and actual payments only.
6. Renewal dialog shows one next period, disables while pending, restores focus, and a repeated submit creates one payment.
7. Edit expected price/cycle without changing old payment snapshots.
8. Add/edit/delete manual payment without moving the period.
9. Reverse only the latest eligible renewal and observe prior period restoration.
10. Catalog detail shows distinct related series; custom detail shows none inferred.
11. Keyboard traversal, Escape, visible focus, screen-reader names, reduced motion, and 44px actions remain usable.
12. Loading uses only local skeleton regions; no whole-route pending shell appears.

Record any browser-only defect as a focused failing test before fixing it, then rerun Steps 6–7.

- [ ] **Step 9: Inspect final scope and status**

Run:

```bash
git status --short
git diff --stat
git diff --check
```

Expected: only spec, plan, subscription feature files, catalogs, dependency manifests, schema, and generated migration metadata are changed. No `.env`, generated Paraglide source, notification files, cron config, unrelated refactor, commit, or push exists.

Stop here and report verification evidence. Commit or apply the migration only after a separate explicit user request.

---
