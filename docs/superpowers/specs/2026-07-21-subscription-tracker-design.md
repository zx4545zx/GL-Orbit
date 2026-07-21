# Subscription Tracker and Expense Ledger Design

Date: 2026-07-21
Status: Approved

## Goal

Add a private, authenticated subscription workspace that helps GL-Orbit users track streaming-service periods, see when access expires, record only payments that actually happened, compare spending with monthly budgets, and discover GL series available on catalog platforms.

The feature must never create a payment merely because a renewal date passed. A user must explicitly confirm a renewal before the system advances the service period or adds an expense.

## Product Principles

1. **The ledger is factual.** Forecasts and expiry dates never become expenses automatically.
2. **Currencies stay separate.** There is no exchange-rate lookup or cross-currency grand total.
3. **Calendar dates stay calendar dates.** Billing and payment dates use date-only values and are not shifted through UTC.
4. **Warnings live on the page.** There are no scheduled jobs, notification rows, push messages, or email reminders.
5. **History is immutable by default.** Editing a subscription changes future expectations, not past payment snapshots.
6. **Every record is private.** Reads and writes are scoped to the authenticated user on the server.

## Scope

### Included

- Authenticated page at `/{lang}/subscriptions`
- Dedicated create and edit pages
- Subscription detail page with payment history and related GL series
- Catalog-platform selection or a custom platform name
- Multiple plans/accounts for the same platform, distinguished by labels
- Monthly, yearly, and custom day/month/year billing cycles
- Date-only current service periods
- Multiple page-warning lead times per subscription
- Actual-payment ledger with initial, renewal, and manual entries
- Explicit, transactional renewal confirmation
- Safe reversal of the latest renewal
- Monthly budgets and near/over-budget messages per currency
- Actual current-month totals and 30-day forecasts, grouped separately by currency
- Thai and English UI/error copy
- Menu and profile entry points
- Responsive Orbit Editorial UI and pending/loading states

### Excluded

- Cron jobs or any other scheduled/background worker
- Push, email, SMS, or existing in-app notification records
- Changes to the existing `notifications` or `push_subscriptions` features
- A persisted user timezone or new `users.timezone` field
- Automatic payment creation
- Exchange-rate conversion or mixed-currency totals
- Bank, card, store receipt, or streaming-provider integrations
- Refunds, credits, and negative ledger entries
- Shared subscriptions, household splitting, invoices, or tax accounting
- Admin access to users' subscription data
- Restoring soft-deleted subscriptions in the first release

## Terminology and Derived States

- **Subscription:** the current tracking configuration and expected future charge.
- **Payment:** a user-confirmed historical expense. Payments are the only source for actual-spend totals.
- **Current period:** the inclusive `currentPeriodStart` through `currentPeriodEnd` date range.
- **Local today:** a `YYYY-MM-DD` value constructed from the device's local calendar fields, not from `toISOString()`.
- **Expired:** an active subscription whose current period end is before local today. This is derived, not stored.
- **Due today:** an active subscription whose current period end equals local today.
- **Upcoming warning:** an active subscription whose positive days remaining falls within one configured alert threshold.
- **Awaiting confirmation:** an automatically renewing subscription whose end date is today or earlier but whose next payment has not been confirmed by the user.
- **Actual this month:** non-deleted payments whose `paidDate` falls in the device-local calendar month.
- **30-day forecast:** current subscription prices for all non-deleted, active subscriptions ending on or after local today and before local today plus 30 calendar days. This half-open range contains exactly 30 local dates. It is a potential renewal forecast, not proof of payment. Manual-renewal rows are labeled as such.

Canceled subscriptions are not expired and do not enter forecasts. Their historical payments still enter actual totals.

Expiry/due/warning is one urgency state. Awaiting confirmation is a separate action flag, so an automatically renewing row may be both expired and awaiting confirmation without creating two ledger entries or two list rows.

## Data Model

All monetary values use PostgreSQL `numeric(18,4)`. TypeScript treats database monetary values as decimal strings; application code must not sum them with binary floating-point numbers.

All billing, service-period, and payment dates use PostgreSQL `date`. Audit/deletion fields continue using timezone-aware timestamps.

### Enums

- `subscription_status`: `ACTIVE`, `CANCELED`
- `subscription_billing_unit`: `DAY`, `MONTH`, `YEAR`
- `subscription_payment_kind`: `INITIAL`, `RENEWAL`, `MANUAL`

Expiry is deliberately absent from `subscription_status` because it is derived from the current period and local today.

### `user_subscriptions`

Purpose: store one user's current tracking configuration.

Fields:

- `id`
- `user_id`
- `platform_id`, nullable catalog-platform reference
- `custom_platform_name`, nullable
- `plan_name`, nullable
- `account_label`, nullable
- `amount`
- `currency`
- `billing_unit`
- `billing_interval`
- `current_period_start`
- `current_period_end`
- `renewal_anchor_date`
- `renewal_sequence`
- `renews_automatically`
- `status`
- `alert_days`, integer array
- `canceled_at`
- `created_at`
- `updated_at`
- `deleted_at`

Rules:

- Exactly one of `platform_id` and a non-blank `custom_platform_name` must be present.
- Custom platform names are trimmed, internal whitespace is collapsed, and input is limited to 255 characters.
- Plan names and account labels are independently optional and limited to 120 characters each.
- Catalog choices must reference non-deleted platforms at creation/update time. Existing subscriptions remain valid if an admin later soft-deletes that platform.
- Multiple subscriptions may reference the same platform. Plan/account labels are descriptive and are not uniqueness keys.
- `amount` is zero or positive so a free trial can be represented.
- `currency` is an uppercase, supported ISO 4217 code.
- Fractional digits cannot exceed that currency's ISO 4217 minor-unit exponent.
- `billing_interval` is a positive integer: 1–365 for `DAY`, 1–120 for `MONTH`, or 1–20 for `YEAR`. `1 MONTH` and `1 YEAR` represent ordinary monthly and yearly plans; any other accepted value represents a custom cycle.
- `current_period_start <= current_period_end`.
- `alert_days` is normalized to at most ten unique integers from 1 through 365, sorted descending. An empty list disables upcoming warnings but not expired/due-today states.
- `status=CANCELED` requires `canceled_at`; returning to `ACTIVE` clears it.
- Normal queries exclude `deleted_at` rows.
- `user_id` cascades only if the user is hard-deleted. `platform_id` is restrictive because catalog platforms use soft deletion.

`renewal_anchor_date` and `renewal_sequence` prevent month-end drift. On creation or after a manual schedule edit, the anchor is the day after the current period end and the sequence resets to zero. They are domain-internal fields and are not independently editable in the UI.

### `subscription_payments`

Purpose: preserve actual historical expenses and the snapshots needed for safe renewal reversal.

Fields:

- `id`
- `user_id`
- `subscription_id`
- `kind`
- `amount`
- `currency`
- `paid_date`
- `service_period_start`
- `service_period_end`
- `renewal_from_period_start`, nullable
- `renewal_from_period_end`, nullable
- `renewal_anchor_before`, nullable
- `renewal_sequence_before`, nullable
- `billing_unit_snapshot`, nullable
- `billing_interval_snapshot`, nullable
- `created_at`
- `updated_at`
- `deleted_at`

Rules:

- The database relationship must guarantee that `user_id` owns `subscription_id`, using a composite ownership key rather than trusting request data.
- `amount` is zero or positive and obeys the selected currency's minor-unit exponent.
- The UI rejects a `paid_date` after local today. The server independently rejects dates more than one calendar day after its current UTC date, allowing the full civil-timezone range without accepting arbitrary future expenses.
- `service_period_start <= service_period_end`.
- Renewal snapshot fields are required for `RENEWAL` rows and absent for other kinds.
- A partial unique index on `(subscription_id, renewal_from_period_end)` for live renewal rows is the database idempotency barrier.
- `INITIAL` and `MANUAL` rows may be edited or soft-deleted. These operations never change the subscription period.
- Payment `kind` is immutable; an initial/manual row cannot be converted into a renewal row.
- `RENEWAL` rows cannot be edited or deleted directly. They can only be removed through the latest-renewal reversal transaction.
- Soft-deleting a subscription does not delete payment rows. Live payment rows continue to count toward historical/current-month actual totals.
- The composite subscription relationship cascades only after a hard deletion, which this feature never exposes. It supports account-erasure behavior if a user is later hard-deleted.

The amount and currency are snapshots. Later edits to a subscription's expected price or currency never rewrite past payment rows.

### `subscription_budgets`

Purpose: hold one optional monthly actual-spend budget for each user/currency pair.

Fields:

- `id`
- `user_id`
- `currency`
- `monthly_limit`
- `warning_percent`
- `created_at`
- `updated_at`

Rules:

- `(user_id, currency)` is unique.
- `monthly_limit > 0` and follows the currency's minor-unit exponent.
- `warning_percent` is an integer from 1 through 100, defaulting to 80.
- A budget is near its limit when actual spend is at least the warning percentage but below 100%.
- A budget is at/over its limit when actual spend is at least 100%.
- Forecast spending never triggers an actual-budget warning.

### Indexes

Add focused indexes for:

- Active subscriptions by user and current period end
- Subscription lookup by user and ID
- Live payments by user and paid date
- Payment history by subscription and paid date
- The live-renewal idempotency key
- Budget lookup by user and currency

## Calendar Arithmetic

All recurrence logic lives in one pure, shared server module and operates on parsed calendar components. It must not use UTC timestamp conversion.

### Renewal sequence

For a subscription with anchor `A`, interval `I`, and current sequence `N`:

1. New period start = `addCalendarInterval(A, N × I)`.
2. Next boundary = `addCalendarInterval(A, (N + 1) × I)`.
3. New period end = one calendar day before the next boundary.
4. Increase the stored sequence to `N + 1`.

Calculating every boundary from the stable anchor, rather than chaining from the previously clamped date, prevents permanent drift.

Month/year addition targets the requested year/month first, then clamps the original anchor day to that target month's final valid day. Therefore:

- A January 31 monthly anchor produces a February 28/29 boundary, then returns to March 31 when valid.
- A February 29 yearly anchor clamps to February 28 in non-leap years and returns to February 29 in a later leap year.
- Day cycles add exact calendar-day counts.

The ranges remain contiguous because each new start is the previous calculated boundary and each end is the day before the following boundary.

Editing the billing unit, interval, or current period dates resets the anchor to `currentPeriodEnd + 1 day` and the sequence to zero. Existing payment history remains unchanged.

## Domain Operations

Business logic lives in a focused subscription domain/service layer. Route files authenticate, parse transport input, invoke the service, and map domain results to HTTP responses.

### Create subscription

1. Authenticate and validate all fields.
2. Resolve either an active catalog platform or a normalized custom name.
3. Derive the recurrence anchor and initial sequence.
4. Insert the subscription.
5. If “record current period as paid” is enabled, require a paid date and create an `INITIAL` payment with the current amount, currency, and period snapshot in the same transaction.
6. If the option is disabled, create no payment.

The paid-date field appears only when the option is enabled and defaults to local today on the client. The server still validates it; it never silently invents a payment date.

### Edit subscription

- Allow platform/custom source, labels, expected amount/currency, billing cycle, current period, automatic-renewal preference, status, and alert thresholds to change.
- Amount/currency changes affect forecasts and future renewals only.
- Billing-cycle or period edits reset recurrence metadata as described above.
- No edit rewrites payment history.
- A schedule-changing update compares the previously loaded period, anchor, sequence, unit, and interval before writing. It uses the authenticated user's ID and returns `409` rather than overwriting a concurrent renewal/edit.

### Cancel or reactivate

- Canceling sets `status=CANCELED` and `canceled_at`.
- Reactivating sets `status=ACTIVE` and clears `canceled_at`.
- Neither action creates, edits, or removes a payment.

### Soft-delete subscription

- Set `deleted_at`; do not hard-delete the row or its payments.
- Remove it from normal lists, warnings, forecasts, and related-series surfaces.
- Keep live payments in actual-spend summaries.
- Explain this behavior in the confirmation UI. Restore is out of scope for the first release.

### Add/edit/delete payment

- Manual entries require an amount, currency, paid date, and service period.
- `INITIAL` and `MANUAL` entries can be corrected or soft-deleted from the detail page.
- These changes affect actual totals for the relevant paid-date month after summary refresh.
- They never advance or restore the subscription period.
- Renewal entries are read-only outside the reversal operation.

### Confirm renewal

The dialog receives:

- Subscription ID
- Expected original period end
- Paid date
- Actual amount and currency, defaulted from the current subscription

Before final confirmation, it displays the calculated next service period and explicitly states that it will add one actual payment and advance the subscription period. Nothing is written when the dialog merely opens.

The final server operation is one transaction:

1. Find a live, active subscription owned by the authenticated user.
2. Verify its current period end still equals the expected original period end.
3. Calculate the next period from stored recurrence metadata.
4. Insert a `RENEWAL` payment with amount/currency, service-period, previous-period, recurrence, and billing-cycle snapshots.
5. Advance the subscription's period and renewal sequence with a compare-and-swap condition on the full schedule tuple read in step 1: period, anchor, sequence, billing unit, and interval.
6. Commit both changes together.

The partial unique renewal key and conditional update make duplicate clicks and concurrent requests safe. A duplicate/stale request returns `409`; it does not create a second payment or advance twice.

A user may confirm a renewal before, on, or after expiry, but one confirmation always advances exactly one billing cycle. The feature never infers or bulk-fills missed cycles; each real payment requires its own confirmation.

### Reverse latest renewal

This operation is also transactional and is allowed only when:

- The selected payment is the latest live renewal for the subscription.
- The subscription is still owned by the current user and is not deleted.
- Its current period, recurrence state, and billing cycle still match the state produced by that renewal.
- No later renewal exists.

The transaction soft-deletes the renewal payment and restores the previous period, anchor, and sequence from its snapshots. Any later manual schedule/cycle edit causes a conflict instead of being overwritten. Reversal never removes initial/manual payments.

## Read Model and Data Flow

### Authenticated page load

`/{lang}/subscriptions/+page.server.ts` authenticates the user and loads stable page data:

- Non-deleted subscriptions with platform display data
- Budgets
- Filter metadata
- Enough relationship data to render the list shell

The detail page loads one owned subscription, live payment history, and related series. A missing, deleted, or foreign-owned record returns the same `404` response.

### Device-local summaries

The server cannot know the device's calendar date during SSR because this design intentionally stores no user timezone. Date-sensitive panels therefore use this explicit flow:

1. SSR renders the page structure and non-date-derived subscription data.
2. On hydration, the browser constructs local today from `getFullYear()`, `getMonth()`, and `getDate()`.
3. The browser requests the authenticated summary endpoint with that date.
4. The server validates the date and returns exact SQL/domain aggregates plus per-subscription warning states.
5. The client refreshes the summary after financial mutations and when the tab becomes active on a different local date.

The date parameter controls presentation only; it cannot create or mutate financial records. Date-sensitive cards show an accessible loading state until the first summary arrives. If it fails, the subscription list remains usable and the cards show a localized retry action rather than misleading stale totals.

### Summary calculations

Given local today, the server returns:

- Current-month live payment totals grouped by currency
- 30-day forecast totals grouped by currency
- Budget usage and near/over states grouped by currency
- Per-subscription exact days remaining and warning state
- Expired, due-today, and awaiting-confirmation counts

For alert thresholds such as `[7, 3, 1]`, five days remaining matches the 7-day tier and two days remaining matches the 3-day tier. The UI always displays the exact days remaining. Zero and negative values use due-today/expired wording instead of an alert tier.

No calculation converts one currency into another.

### Related GL series

For a catalog subscription, related series are the distinct union of:

- `series_schedules` rows matching the platform
- `episode_schedules` rows matching the platform, joined through `episodes`

Deleted series, episodes, and episode schedules are excluded. The dashboard shows the first three distinct series plus the remaining count; the detail page shows the full result. Custom platforms have no inferred series relationship.

## Routes and Endpoints

### Pages

- `/{lang}/subscriptions`
- `/{lang}/subscriptions/new`
- `/{lang}/subscriptions/{id}`
- `/{lang}/subscriptions/{id}/edit`

All pages require a signed-in user and use existing language-prefixed link helpers.

### Authenticated API surface

- `GET /api/subscriptions/summary?today=YYYY-MM-DD`
- `POST /api/subscriptions`
- `GET /api/subscriptions/[id]`
- `PATCH /api/subscriptions/[id]`
- `DELETE /api/subscriptions/[id]`
- `POST /api/subscriptions/[id]/renew`
- `POST /api/subscriptions/[id]/reverse-latest-renewal`
- `POST /api/subscriptions/[id]/payments`
- `PATCH /api/subscription-payments/[paymentId]`
- `DELETE /api/subscription-payments/[paymentId]`
- `PUT /api/subscription-budgets/[currency]`
- `DELETE /api/subscription-budgets/[currency]`

Endpoints are thin adapters over the domain layer. Every mutation uses same-origin authenticated requests and returns stable machine-readable error codes. Pages may use progressive enhancement around these endpoints, but financial UI must wait for a confirmed server response before changing authoritative values.

## UI and Interaction Design

### Dashboard hierarchy

The dashboard-first page uses this order:

1. Page heading and rectangular “add subscription” action
2. Current-month **actual paid** totals, one block per currency
3. Visually separate **next 30 days forecast**, one block per currency
4. Per-currency budget progress and near/over page messages
5. A page-local action panel for expired, due-today, near-expiry, and awaiting-confirmation items
6. Search plus urgency/status/currency filters
7. Subscription rows/cards

Each subscription row shows:

- Platform logo/name or custom platform name
- Plan and account label
- Expected price, currency, and billing cycle
- Current period end and exact countdown state
- Automatic/manual renewal label
- Related GL series preview for catalog platforms
- “Renewed” and manage actions where valid

Mobile keeps the same information priority in condensed rectangular cards. It does not hide actual spend, urgent expiry state, or the primary renewal action.

### Create/edit pages

Long forms use dedicated pages, not large dialogs. Fields are grouped into:

1. Catalog platform or custom platform source
2. Plan name and account label
3. Expected amount/currency and billing cycle
4. Current service-period dates and automatic-renewal setting
5. Page-warning lead days
6. Optional initial-payment recording on creation

Selecting a catalog platform clears custom-name input and vice versa. Field errors render beside the relevant controls.

### Renewal dialog

Renewal is a short review/confirmation dialog. It shows paid date, actual amount/currency, original period, calculated next period, and a concise effect summary. The final action is disabled while pending. Success closes the dialog, refreshes subscription/summary data, and returns focus to the trigger. A `409` keeps the dialog safe, reloads current data, and explains that the period was already changed.

### Detail page

The detail page separates:

- Current subscription overview and actions
- Payment history
- Manual payment controls
- Related GL series

Renewal payment rows explain why direct editing/deletion is unavailable and expose “reverse latest renewal” only when the server reports it as eligible.

Payment history is ordered by paid date and creation time descending, loads 25 rows initially, and uses cursor-based “load more” pagination. Dashboard budget blocks expose compact create/edit/delete budget controls without mixing forecast amounts into progress.

### Navigation, localization, and visual system

- Add localized Subscription links to the menu page and profile surface.
- Use page-local, accessible loading skeletons for date-sensitive and paginated regions. Do not reintroduce the route-level `*PendingShell.svelte` architecture, which the repository intentionally removed.
- Follow Orbit Editorial rules: sharp rectangular surfaces, structured grid, restrained borders, no decorative pills/rounded cards, no rainbow divider/gradient strip.
- Preserve visible focus, keyboard operation, screen-reader labels/status, reduced-motion behavior, and at least 44×44px touch targets.
- All user-facing copy and stable error mappings exist in Thai and English message catalogs.

## Validation and Error Contract

The server is authoritative. Client validation improves feedback but does not replace domain/database validation.

Error shape:

```ts
type SubscriptionApiError = {
	ok: false;
	code: string;
	fieldErrors?: Record<string, string[]>;
};
```

Representative codes:

- `AUTH_REQUIRED`
- `INVALID_INPUT`
- `UNSUPPORTED_CURRENCY`
- `PLATFORM_NOT_FOUND`
- `SUBSCRIPTION_NOT_FOUND`
- `PAYMENT_NOT_FOUND`
- `RENEWAL_CONFLICT`
- `RENEWAL_ALREADY_RECORDED`
- `RENEWAL_REVERSAL_NOT_ALLOWED`

The client maps codes/field keys to localized Thai or English copy. Internal database errors and constraint names are never returned.

HTTP behavior:

- `400` for malformed transport data
- `401` when unauthenticated
- `404` for missing, deleted, or foreign-owned resources
- `409` for stale periods, duplicate renewals, or invalid reversal state
- `422` for well-formed input that fails field/domain validation
- `500` for unexpected failures, with a generic localized client message

Network/write failures leave the visible authoritative state unchanged and allow a safe retry. No financial operation uses optimistic UI.

## Security and Privacy

- Every query and mutation starts from `locals.user.id`; request-supplied user IDs are ignored.
- Foreign-owned resource IDs deliberately produce `404`, not `403`.
- Composite payment ownership is enforced in the database as well as the service layer.
- State-changing routes accept same-origin authenticated requests only.
- Financial responses are private and must not be placed in shared/public caches.
- Logs omit raw request bodies and avoid recording amounts, account labels, or payment dates unless required for a narrowly scoped operational event.
- Database checks protect platform/custom XOR, non-negative amounts, valid date ranges, positive intervals, and renewal snapshot invariants.
- Renewal and reversal transactions fail atomically.

## Testing Strategy

### Unit tests

- Date parsing/formatting never shifts through UTC
- Day, month, and year interval calculations
- January 31 anchor behavior without permanent drift
- February 29 yearly behavior across leap/non-leap years
- Contiguous inclusive period boundaries
- Recurrence reset after manual schedule changes
- Alert normalization, tier selection, due-today, and expired states
- Exact decimal validation and grouping by currency
- ISO 4217 fractional-digit enforcement
- Budget near/at/over thresholds
- Actual versus forecast classification, including the day-29/day-30 boundary

### Domain/database tests

- Create with and without an initial payment
- Platform/custom XOR and ownership constraints
- Multiple subscriptions for one platform
- Renewal inserts one payment and advances one period atomically
- Duplicate and concurrent renewal requests produce one result
- A concurrent schedule edit and renewal cannot overwrite each other
- Any failure rolls back both payment and period changes
- Foreign ownership behaves as not found
- Editing expected price/currency does not alter history
- Soft-delete preserves payments and actual totals
- Initial/manual deletion leaves the subscription period unchanged
- Renewal rows reject direct edit/delete
- Latest-renewal reversal restores the prior state
- Reversal rejects a non-latest renewal or a period changed after renewal
- Budget uniqueness per user/currency

### Route tests

- Authentication requirements
- Stable status/error-code mapping
- Field errors for both platform modes, money, dates, cycle, and alert days
- Summary date validation and strict user scoping
- `404` equivalence for missing and foreign records
- Language-independent APIs with Thai/English UI mappings

### UI/component tests

- Dedicated create/edit form behavior
- Catalog/custom source switching
- Initial-payment option and paid-date reveal
- Actual and forecast panels remain visually distinct
- Currency groups never merge
- Expiry/alert and budget messages update from summary data
- Renewal review, pending, success, retry, and conflict states
- Focus restoration and keyboard dialog behavior
- Payment-history restrictions and reversal eligibility
- Mobile information priority and touch targets

### Verification commands

- Generate and inspect the additive Drizzle migration
- Run focused Vitest files for subscription domain/routes/components
- Run `npm run check`
- Run a production build if route/component integration changes expose build-only behavior

## Migration and Rollout

- Use an additive migration for the three tables, enums, checks, indexes, and foreign keys.
- No existing data requires backfill.
- No environment variables, scheduled endpoints, or deployment cron configuration are added.
- Navigation links should ship with the authenticated pages so users never land on an unfinished surface.
- If the feature must be staged, keep links hidden until schema, endpoints, pages, translations, and focused tests are deployed together.

## Acceptance Criteria

1. A signed-in user can create catalog or custom subscriptions, including several plans/accounts for one platform.
2. Monthly, yearly, and custom day/month/year cycles renew with deterministic date-only arithmetic.
3. Creation records no expense unless the user explicitly enables and completes the initial-payment option.
4. The dashboard clearly separates actual current-month payments from the next 30 days forecast and keeps every currency separate.
5. Budgets and near/over messages use actual payments only and are evaluated per currency.
6. Expiry and configured lead-day messages appear only on the Subscription page; no notification or background-job side effect occurs.
7. Renewal writes exactly one payment and one new period only after final confirmation, including under duplicate/concurrent submission.
8. Historical payment amount/currency snapshots survive subscription edits and soft deletion.
9. Initial/manual payments can be corrected without changing periods; renewal payments require safe latest-renewal reversal.
10. Catalog subscriptions show distinct related GL series; custom platforms do not infer series.
11. Foreign-owned IDs reveal nothing and all financial writes are transactional or leave state unchanged.
12. Thai/English, responsive, accessible UI follows the approved dashboard-first Orbit Editorial layout.

## Resolved Decisions

- Dedicated subscription domain plus an independent payment ledger, not a single-table tracker or event-sourced system
- User-confirmed renewals only
- Multiple currencies without FX conversion
- Multiple warning thresholds rendered only on the page
- Catalog platform or custom name
- Multiple subscriptions per platform with plan/account labels
- Monthly per-currency budgets
- Optional initial payment on creation, default off
- Dedicated long-form pages and a short renewal confirmation dialog
- Soft-delete subscriptions while retaining payment history
- Latest-renewal-only transactional reversal
- Device-local date summaries without persisting timezone
- No cron, push, email, or existing notification integration
