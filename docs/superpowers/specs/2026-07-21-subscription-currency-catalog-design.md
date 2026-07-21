# Subscription Currency Catalog Design

**Status:** Approved

## Goal

Replace free-text subscription currency entry with a small, database-backed catalog. Suggest a sensible initial currency from the browser environment, remain user-editable, remember the user's choice, and fall back to THB when no reliable match exists.

## Catalog

Add a `currencies` table with:

- `code`: three-letter uppercase primary key
- `name_th` and `name_en`
- `minor_unit`: supported decimal places
- `is_active`: whether new records may select it
- `sort_order`
- audit timestamps

Seed these active currencies in display order:

`THB, USD, EUR, GBP, JPY, KRW, CNY, TWD, HKD, SGD, MYR, PHP, IDR, VND, AUD`.

Existing subscription, payment, and budget currency columns remain three-letter codes and gain foreign keys to `currencies.code`. Before adding the foreign keys, the migration inserts any distinct pre-existing currency codes not in the seed as inactive legacy rows. Existing history therefore remains readable and migration-safe. An inactive currency cannot be selected for a new record, but an existing record using it remains displayable.

An existing subscription or editable payment using an inactive legacy currency may still save unrelated changes only while both its currency and amount remain unchanged. Changing either requires choosing an active currency. An inactive legacy budget remains visible and deletable but cannot receive a new limit. Renewals and new manual payments always require an active currency.

## Server Data and Validation

Authenticated subscription page loads return active currencies ordered by `sort_order`, then `code`. Each option includes code, localized name, and minor unit.

Request parsing continues to enforce an uppercase three-letter shape and exact decimal syntax. Mutation services additionally require the selected currency to be active in the catalog. Money validation uses the catalog's `minor_unit`; the browser runtime's full ISO list is no longer the authority for which currencies users may create.

Payment ledger rows keep their currency snapshots. Catalog names or activation changes never rewrite financial history. Currency deletion is not exposed; administrators may deactivate a currency instead.

## Automatic Selection

Selection runs only in the browser after mount:

1. Use the last user-selected active currency stored in local storage.
2. Map the browser locale region to an active currency.
3. If locale has no usable region, use a small timezone-to-currency mapping.
4. Fall back to `THB`.

Locale takes priority over timezone because a timezone can span multiple countries. No GPS permission, IP lookup, or location data storage is used. A suggestion never overrides an existing subscription/payment currency or a user's current form selection.

When the user changes a currency in the subscription form, manual payment form, renewal dialog, or budget controls, store that active code as the latest preference. Subsequent new forms use it. Edit forms always retain the record's currency.

## UI

Replace currency text inputs with accessible square-corner selects in:

- subscription creation/editing
- initial and manual payments
- renewal confirmation
- budget creation

Each option displays localized name and code, for example `บาทไทย (THB)`. Exact summaries and ledger rows continue to show code plus decimal amount. Loading and mutation behavior remains pessimistic.

## Errors and Privacy

- Missing or malformed code: existing field-level invalid error.
- Well-formed but inactive/missing catalog code: stable unsupported-currency error.
- A stale browser preference not present in the active list is ignored and replaced by the normal locale/timezone/THB fallback.
- Browser locale, timezone, and inferred currency remain client-side; only the chosen currency is sent with normal financial requests.

## Migration and Rollout

Create an additive migration after `0024_subscription_tracker`. It creates/seeds `currencies`, preserves distinct existing codes as inactive legacy rows, then adds foreign keys from subscriptions, payments, and budgets. It does not modify amounts, payment history, periods, notifications, users, or timezones.

The migration must be inspected and tested before application. Applying it to the configured database requires explicit user approval.

## Testing

- Schema/migration: table fields, seeds, legacy-code preservation, and all three foreign keys.
- Domain: active catalog acceptance, inactive/missing rejection, minor-unit enforcement.
- Suggestion helper: remembered preference, locale mapping, timezone fallback, THB fallback, and inactive preference rejection.
- Components: options are catalog-backed, localized labels render, edits retain current code, new forms use suggestion, and user selection is remembered.
- Routes: page loads return only active ordered options and mutations reject unsupported codes.
- Regression: exact money grouping, renewal snapshots, budgets, ownership, no notifications/cron/timezone persistence, full test/check/build suites.

## Acceptance Criteria

1. New financial records can select only an active catalog currency.
2. The initial active list contains exactly the 15 approved currencies.
3. Existing currency history survives migration without rewriting amounts or codes.
4. New-form suggestion order is remembered choice, locale, timezone, then THB.
5. No location permission or server-side location tracking is introduced.
6. All four currency entry surfaces use the shared catalog and remain user-editable.
7. Minor-unit validation remains exact and server-authoritative.
