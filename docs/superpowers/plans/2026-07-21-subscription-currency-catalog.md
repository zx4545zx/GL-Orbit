# Subscription Currency Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace free-text subscription currencies with a 15-currency database catalog and browser-local automatic selection that falls back to THB.

**Architecture:** Add an additive `currencies` lookup table and retain three-letter currency snapshots on subscription financial records through foreign keys. Server mutations validate active catalog membership and catalog minor units; shared browser helpers select from remembered preference, locale, timezone, then THB. A reusable native select supplies all subscription currency entry surfaces.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript 5.8, Drizzle ORM 0.43, Neon PostgreSQL, Vitest 4, Svelte Testing Library, Paraglide.

## Global Constraints

- Active seed list is exactly `THB, USD, EUR, GBP, JPY, KRW, CNY, TWD, HKD, SGD, MYR, PHP, IDR, VND, AUD`.
- Unknown pre-existing codes must survive migration as inactive legacy rows; never rewrite financial amounts or currency snapshots.
- Suggestion priority is remembered active choice, browser locale, timezone, then `THB`.
- No GPS permission, IP lookup, server-side location inference, timezone persistence, FX conversion, cron, or notification behavior.
- Edit forms retain the stored currency; automatic selection applies only to new records/drafts.
- Server catalog membership and `minor_unit` are authoritative. UI remains user-editable and pessimistic.
- Use PostgreSQL `numeric(18,4)` and exact decimal strings; never use binary floating point for money.
- Use `getDb()` in server files and `.js` suffixes for TypeScript imports.
- Follow Orbit Editorial square geometry, Svelte 5 runes, localized Thai/English labels, and 44×44px touch targets.
- Do not hand-edit generated Paraglide files.
- Do not run `npm run db:push`, apply migration `0025`, commit, or push without explicit user approval.

## Locked Interfaces and File Map

- Modify `src/lib/subscriptions/types.ts`: add `CurrencyOption`.
- Modify `src/lib/subscriptions/money.ts`: add catalog-minor-unit parser while preserving scale-four helpers.
- Create `src/lib/subscriptions/currency.ts` and `currency.test.ts`: deterministic suggestion and preference helpers.
- Modify `src/lib/server/db/schema.ts`, `schema.test.ts`; generate `drizzle/0025_subscription_currency_catalog.sql` and metadata.
- Modify `src/lib/server/subscriptions/queries.ts` and tests: `listCurrencyOptions` and active-currency lookup.
- Modify `src/lib/server/subscriptions/mutations.ts` and tests: authoritative currency checks for every financial write.
- Modify four subscription `+page.server.ts` files and tests to return `currencies`.
- Create `src/lib/components/subscriptions/CurrencySelect.svelte` and test.
- Modify `SubscriptionForm.svelte`, `PaymentHistory.svelte`, `RenewalDialog.svelte`, `BudgetControls.svelte` and their tests.
- Modify dashboard, detail, new, and edit `+page.svelte` files to pass catalog props.

Shared contract:

```ts
export type CurrencyOption = {
  code: string;
  nameTh: string;
  nameEn: string;
  minorUnit: number;
};

export function parseMoneyWithMinorUnit(
  value: unknown,
  minorUnit: number,
  options?: { positive?: boolean }
): { ok: true; value: string } | { ok: false; reason: MoneyParseFailure };

export function selectSuggestedCurrency(
  currencies: CurrencyOption[],
  environment: { stored: string | null; locale: string; timeZone: string }
): string;

export function readCurrencyPreference(): string | null;
export function rememberCurrencyPreference(code: string): void;
export function listCurrencyOptions(db: Db): Promise<CurrencyOption[]>;
```

---

### Task 1: Add Catalog Types, Exact Minor-Unit Parsing, and Browser Suggestion

**Files:**
- Modify: `src/lib/subscriptions/types.ts`
- Modify: `src/lib/subscriptions/money.ts`
- Modify: `src/lib/subscriptions/money.test.ts`
- Create: `src/lib/subscriptions/currency.ts`
- Create: `src/lib/subscriptions/currency.test.ts`

**Interfaces:** Produces `CurrencyOption`, `parseMoneyWithMinorUnit`, `selectSuggestedCurrency`, `readCurrencyPreference`, and `rememberCurrencyPreference`.

- [ ] **Step 1: Write failing money and suggestion tests**

Add cases proving catalog minor units are authoritative and suggestion order is deterministic:

```ts
const currencies: CurrencyOption[] = [
  { code: 'THB', nameTh: 'บาทไทย', nameEn: 'Thai Baht', minorUnit: 2 },
  { code: 'USD', nameTh: 'ดอลลาร์สหรัฐ', nameEn: 'US Dollar', minorUnit: 2 },
  { code: 'JPY', nameTh: 'เยนญี่ปุ่น', nameEn: 'Japanese Yen', minorUnit: 0 },
  { code: 'SGD', nameTh: 'ดอลลาร์สิงคโปร์', nameEn: 'Singapore Dollar', minorUnit: 2 }
];

expect(parseMoneyWithMinorUnit('10.25', 2)).toEqual({ ok: true, value: '10.25' });
expect(parseMoneyWithMinorUnit('10.1', 0)).toEqual({ ok: false, reason: 'fraction_digits' });
expect(selectSuggestedCurrency(currencies, {
  stored: 'USD', locale: 'th-TH', timeZone: 'Asia/Bangkok'
})).toBe('USD');
expect(selectSuggestedCurrency(currencies, {
  stored: 'EUR', locale: 'en-SG', timeZone: 'Asia/Singapore'
})).toBe('SGD');
expect(selectSuggestedCurrency(currencies, {
  stored: null, locale: 'zz', timeZone: 'Unknown/Zone'
})).toBe('THB');
```

Also test locale mappings for all 15 currencies, timezone fallback, inactive/unavailable stored values, malformed local-storage values, and storage write failure.

- [ ] **Step 2: Run RED tests**

Run: `npm test -- src/lib/subscriptions/money.test.ts src/lib/subscriptions/currency.test.ts`

Expected: FAIL because new exports/modules do not exist.

- [ ] **Step 3: Implement exact parser and suggestion module**

Refactor `parseMoney` to delegate decimal work to `parseMoneyWithMinorUnit`; preserve its current Intl wrapper for compatibility. Implement mappings in `currency.ts`:

```ts
const REGION_TO_CURRENCY: Record<string, string> = {
  TH: 'THB', US: 'USD', GB: 'GBP', JP: 'JPY', KR: 'KRW', CN: 'CNY',
  TW: 'TWD', HK: 'HKD', SG: 'SGD', MY: 'MYR', PH: 'PHP', ID: 'IDR',
  VN: 'VND', AU: 'AUD',
  AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR',
  FI: 'EUR', FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR',
  LT: 'EUR', LU: 'EUR', LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR',
  SI: 'EUR', SK: 'EUR'
};

const TIMEZONE_TO_CURRENCY: Record<string, string> = {
  'Asia/Bangkok': 'THB', 'Asia/Tokyo': 'JPY', 'Asia/Seoul': 'KRW',
  'Asia/Shanghai': 'CNY', 'Asia/Taipei': 'TWD', 'Asia/Hong_Kong': 'HKD',
  'Asia/Singapore': 'SGD', 'Asia/Kuala_Lumpur': 'MYR',
  'Asia/Manila': 'PHP', 'Asia/Jakarta': 'IDR', 'Asia/Ho_Chi_Minh': 'VND',
  'Australia/Sydney': 'AUD', 'Europe/London': 'GBP'
};

const PREFERENCE_KEY = 'gl-orbit-preferred-currency';
```

Resolve locale region with `new Intl.Locale(locale).maximize().region` inside `try/catch`. Accept only codes present in `currencies`. For US timezone aliases, map any `America/*` only when locale already resolves to US; otherwise do not guess. Storage helpers must guard `typeof localStorage === 'undefined'` and catch security/quota exceptions.

- [ ] **Step 4: Run GREEN tests and type check**

Run:

```bash
npm test -- src/lib/subscriptions/money.test.ts src/lib/subscriptions/currency.test.ts
npm run check
```

Expected: tests pass; check has 0 errors, with only known unrelated warnings.

---

### Task 2: Add and Generate the Currency Catalog Migration

**Files:**
- Modify: `src/lib/server/db/schema.ts`
- Modify: `src/lib/server/db/schema.test.ts`
- Create: `drizzle/0025_subscription_currency_catalog.sql`
- Create: `drizzle/meta/0025_snapshot.json`
- Modify: `drizzle/meta/_journal.json`

**Interfaces:** Produces Drizzle `currencies`; existing currency columns reference `currencies.code`.

- [ ] **Step 1: Write failing schema metadata tests**

Assert:

```ts
const currency = getTableConfig(schema.currencies);
expect(currency.columns.find((column) => column.name === 'code')?.primary).toBe(true);
expect(currency.columns.find((column) => column.name === 'minor_unit')?.notNull).toBe(true);
expect(currency.columns.find((column) => column.name === 'is_active')?.notNull).toBe(true);

for (const table of [schema.userSubscriptions, schema.subscriptionPayments, schema.subscriptionBudgets]) {
  expect(getTableConfig(table).foreignKeys.some((key) => key.reference().foreignTable === schema.currencies)).toBe(true);
}
```

- [ ] **Step 2: Run RED schema test**

Run: `npm test -- src/lib/server/db/schema.test.ts`

Expected: FAIL because `currencies` is absent.

- [ ] **Step 3: Implement schema**

Place `currencies` before subscription tables:

```ts
export const currencies = pgTable('currencies', {
  code: varchar('code', { length: 3 }).primaryKey(),
  nameTh: varchar('name_th', { length: 100 }).notNull(),
  nameEn: varchar('name_en', { length: 100 }).notNull(),
  minorUnit: integer('minor_unit').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  codeShape: check('currencies_code_shape', sql`${table.code} ~ '^[A-Z]{3}$'`),
  minorUnitRange: check('currencies_minor_unit_range', sql`${table.minorUnit} BETWEEN 0 AND 4`),
  sortOrderNonnegative: check('currencies_sort_order_nonnegative', sql`${table.sortOrder} >= 0`),
  activeOrderIndex: index('currencies_active_order_idx').on(table.isActive, table.sortOrder, table.code)
}));
```

Add `.references(() => currencies.code, { onDelete: 'restrict', onUpdate: 'cascade' })` to each subscription currency column.

- [ ] **Step 4: Generate migration and insert deterministic data migration**

Run: `npm run db:generate -- --name subscription_currency_catalog`

Expected: creates migration number `0025`.

Before generated FK statements, add SQL that:

1. Creates `currencies`.
2. Inserts the 15 approved rows with explicit names, minor units, and sort orders 10–150 using `ON CONFLICT (code) DO NOTHING`.
3. Inserts distinct codes from `user_subscriptions`, `subscription_payments`, and `subscription_budgets` not already present as inactive rows. Use the code for both names, derive minor unit with a conservative `2`, and sort from `1000 + row_number()`.
4. Adds the three foreign keys only after legacy rows exist.

Approved minor units: `JPY=0`, `KRW=0`, `VND=0`; all other seeded currencies use `2`.

- [ ] **Step 5: Inspect migration without applying it**

Verify SQL contains one new table, 15 active inserts, legacy union, three FKs, checks/index only. Verify it contains no amount update, currency-code update, notification, timezone, user, or payment-history mutation.

Run:

```bash
npm test -- src/lib/server/db/schema.test.ts
npm run check
git diff --check -- drizzle src/lib/server/db/schema.ts src/lib/server/db/schema.test.ts
```

Expected: PASS. Do not apply migration.

---

### Task 3: Add Catalog Queries and Server-Authoritative Financial Validation

**Files:**
- Modify: `src/lib/server/subscriptions/queries.ts`
- Modify: `src/lib/server/subscriptions/queries.test.ts`
- Modify: `src/lib/server/subscriptions/mutations.ts`
- Modify: `src/lib/server/subscriptions/mutations.test.ts`

**Interfaces:** Produces `listCurrencyOptions(db)` and a private active-currency assertion reused by every financial mutation.

- [ ] **Step 1: Write failing query and mutation tests**

Test `listCurrencyOptions` maps ordered active rows only. Add mutation fixtures proving:

- active THB with two decimals passes;
- JPY fractional amount throws `INVALID_INPUT` with `amount: ['fraction_digits']`;
- inactive/missing code throws `UNSUPPORTED_CURRENCY` with `currency: ['invalid']`;
- checks execute for create/update subscription, manual payment, renewal, and budget upsert;
- update subscription/payment permits an inactive legacy code only when both currency and amount are unchanged from the owned row;
- inactive legacy budgets remain deletable but cannot be upserted;
- payment deletion and renewal reversal do not need a new currency check.

- [ ] **Step 2: Run RED tests**

Run:

```bash
npm test -- src/lib/server/subscriptions/queries.test.ts src/lib/server/subscriptions/mutations.test.ts
```

Expected: FAIL because catalog query/assertion is absent.

- [ ] **Step 3: Implement active catalog query and assertion**

Query shape:

```sql
SELECT code, name_th, name_en, minor_unit
FROM currencies
WHERE is_active = true
ORDER BY sort_order ASC, code ASC
```

Implement a private mutation helper:

```ts
async function validateCatalogMoney(
  db: Db,
  currency: string,
  amount: string,
  options: { positive?: boolean } = {}
): Promise<string> {
  const rows = resultRows<{ minor_unit: number }>(await db.execute(sql`
    SELECT minor_unit FROM currencies
    WHERE code = ${currency} AND is_active = true
    LIMIT 1
  `));
  if (!rows[0]) throw new SubscriptionDomainError(
    'UNSUPPORTED_CURRENCY', { currency: ['invalid'] }
  );
  const parsed = parseMoneyWithMinorUnit(amount, rows[0].minor_unit, options);
  if (!parsed.ok) throw new SubscriptionDomainError(
    'INVALID_INPUT', { amount: [parsed.reason] }
  );
  return parsed.value;
}
```

Use the returned canonical amount in every write SQL. Subscription/payment amounts permit zero where existing behavior permits it; budget limits remain positive. Do not alter stored historical rows when a currency later becomes inactive.

For subscription and editable-payment updates, load the current owned row's `currency` and canonical `amount` before catalog validation. If the catalog row is inactive or absent, accept only an exact unchanged pair and preserve it; otherwise throw `UNSUPPORTED_CURRENCY`. For budget upsert, require active currency even when a legacy budget already exists; legacy budgets may only be deleted. Renewal and manual-payment creation always require active currency.

- [ ] **Step 4: Run GREEN tests**

Run:

```bash
npm test -- src/lib/server/subscriptions/queries.test.ts src/lib/server/subscriptions/mutations.test.ts
npm test -- src/lib/server/subscriptions
npm run check
```

Expected: all pass with no new warnings.

---

### Task 4: Return Active Currencies from Every Subscription Page Load

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/subscriptions/+page.server.ts`
- Modify: `src/routes/[lang=lang]/(app)/subscriptions/new/+page.server.ts`
- Modify: `src/routes/[lang=lang]/(app)/subscriptions/[id]/+page.server.ts`
- Modify: `src/routes/[lang=lang]/(app)/subscriptions/[id]/edit/+page.server.ts`
- Modify: corresponding `page.server.test.ts` files

**Interfaces:** All four page data objects expose `currencies: CurrencyOption[]`.

- [ ] **Step 1: Extend load tests first**

Mock `listCurrencyOptions` and assert authenticated loads call it once and return the same list. Keep existing assertions that unauthenticated requests redirect before `getDb()`.

- [ ] **Step 2: Run RED load tests**

Run: `npm test -- 'src/routes/[lang=lang]/(app)/subscriptions/**/page.server.test.ts'`

Expected: FAIL because loads omit currencies.

- [ ] **Step 3: Update loads**

Load currencies alongside existing stable data with `Promise.all`. Example dashboard result:

```ts
const [subscriptions, budgets, platforms, currencies] = await Promise.all([
  listSubscriptions(db, locals.user.id),
  listSubscriptionBudgets(db, locals.user.id),
  listPlatformOptions(db),
  listCurrencyOptions(db)
]);
return { subscriptions, budgets, platforms, currencies };
```

Detail loads currencies with owned detail; edit loads currencies, platforms, and owned detail; new loads platforms and currencies.

- [ ] **Step 4: Run GREEN load tests**

Run:

```bash
npm test -- 'src/routes/[lang=lang]/(app)/subscriptions/**/page.server.test.ts'
npm run check
```

Expected: PASS.

---

### Task 5: Build Shared Currency Select and Replace Free-Text Inputs

**Files:**
- Create: `src/lib/components/subscriptions/CurrencySelect.svelte`
- Create: `src/lib/components/subscriptions/CurrencySelect.test.ts`
- Modify: `SubscriptionForm.svelte` and `.test.ts`
- Modify: `PaymentHistory.svelte` and `.test.ts`
- Modify: `RenewalDialog.svelte` and `.test.ts`
- Modify: `BudgetControls.svelte` and `.test.ts`

**Interfaces:** `CurrencySelect` binds a code, displays localized catalog labels, and remembers explicit user changes.

- [ ] **Step 1: Write failing component tests**

Cover:

- options render as `บาทไทย (THB)` in Thai and `Thai Baht (THB)` in English;
- changing selection updates the bound code and stores the preference;
- disabled/invalid/described-by attributes reach the native select;
- create subscription suggests remembered, locale, timezone, then THB;
- edit subscription retains its current currency even if another preference exists;
- manual payment draft suggests currency after mount;
- renewal starts with the subscription currency and never auto-overrides it;
- budget creation suggests currency but remains changeable;
- inactive/legacy record currency remains visible on edit as a disabled legacy option when absent from active currencies.

- [ ] **Step 2: Run RED component tests**

Run: `npm test -- src/lib/components/subscriptions`

Expected: FAIL because `CurrencySelect` and catalog props are absent.

- [ ] **Step 3: Implement `CurrencySelect`**

Use Svelte 5 `$bindable()`:

```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { rememberCurrencyPreference } from '$lib/subscriptions/currency.js';
  import type { CurrencyOption } from '$lib/subscriptions/types.js';

  let {
    id, value = $bindable(), currencies, disabled = false,
    invalid = false, describedBy, legacyCode = null
  }: {
    id: string; value: string; currencies: CurrencyOption[]; disabled?: boolean;
    invalid?: boolean; describedBy?: string; legacyCode?: string | null;
  } = $props();

  const label = (item: CurrencyOption) =>
    `${page.data.lang === 'en' ? item.nameEn : item.nameTh} (${item.code})`;
</script>

<select
  {id} bind:value {disabled}
  aria-invalid={invalid ? 'true' : undefined}
  aria-describedby={describedBy}
  onchange={() => rememberCurrencyPreference(value)}
  class="min-h-11 w-full rounded-none border border-[var(--orbit-line-strong)] bg-white px-3"
>
  {#if legacyCode && !currencies.some((item) => item.code === legacyCode)}
    <option value={legacyCode} disabled>{legacyCode}</option>
  {/if}
  {#each currencies as item (item.code)}<option value={item.code}>{label(item)}</option>{/each}
</select>
```

- [ ] **Step 4: Integrate all four entry surfaces**

Add `currencies: CurrencyOption[]` props. For new drafts, call `selectSuggestedCurrency` only inside `onMount` with:

```ts
{
  stored: readCurrencyPreference(),
  locale: navigator.language,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
}
```

Rules:

- `SubscriptionForm`: create currency starts empty and is suggested after mount; edit keeps `subscription.currency`.
- `PaymentHistory`: new MANUAL draft gets suggestion; editing a row keeps row currency.
- `RenewalDialog`: always starts from `subscription.currency`; changing it is remembered.
- `BudgetControls`: new budget gets suggestion; existing budgets retain their currency; remove free-text uppercase handling and datalist.

When a subscription's current currency is inactive, render it as the selected legacy option but require the user to choose an active option before changing amount. When an existing budget currency is inactive, render it read-only with delete only. Renewal and manual-payment selectors may show the prior code for context, but submission requires an active option.

Preserve existing exact payloads, operation IDs, pending locks, field errors, future-date guards, and confirmed-write retry behavior.

- [ ] **Step 5: Run GREEN component tests**

Run:

```bash
npm test -- src/lib/components/subscriptions
npm run check
```

Expected: PASS with no new accessibility warnings.

---

### Task 6: Wire Pages, Verify Migration, and Run Full Regression

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/subscriptions/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/subscriptions/new/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/subscriptions/[id]/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/subscriptions/[id]/edit/+page.svelte`
- Modify: relevant page/component integration tests

**Interfaces:** Every subscription component receives authoritative `data.currencies`.

- [ ] **Step 1: Write failing source/integration assertions**

Assert dashboard passes currencies to BudgetControls and RenewalDialog; detail passes them to PaymentHistory and RenewalDialog; new/edit pass them to SubscriptionForm. Assert no subscription component renders `type="text"` for a currency field or uses a currency datalist.

- [ ] **Step 2: Wire page props**

Use exact bindings:

```svelte
<SubscriptionForm currencies={data.currencies} ... />
<BudgetControls currencies={data.currencies} ... />
<PaymentHistory currencies={data.currencies} ... />
<RenewalDialog currencies={data.currencies} ... />
```

If existing BudgetControls expects `string[]`, replace that prop type rather than adding a second catalog prop.

- [ ] **Step 3: Run focused regression**

Run:

```bash
npm test -- src/lib/subscriptions src/lib/server/subscriptions src/lib/components/subscriptions 'src/routes/[lang=lang]/(app)/subscriptions' src/routes/api/subscriptions src/routes/api/subscription-payments src/routes/api/subscription-budgets
npm run i18n:compile
npm run check
```

Expected: all focused tests pass; check has 0 errors and only known unrelated warnings.

- [ ] **Step 4: Inspect and test migration safely**

Verify `0025` ordering is create table → seed active rows → preserve legacy rows → add FKs. If a disposable database branch is available, apply and verify there only after user consent. Never apply to the configured database during this task without explicit approval.

- [ ] **Step 5: Run complete verification**

Run:

```bash
npm test
npm run check
npm run build
npm test -- src/lib/components/pending-shell-removal.test.ts
```

Expected: full suite/build pass, no new warning class, no route-level pending shell, no notification/timezone/FX coupling.

- [ ] **Step 6: Browser checklist after migration is explicitly approved and applied**

At 1440×900 and 390×844, verify authenticated creation defaults correctly for a controlled locale/timezone, all 15 options render localized, manual payment/renewal/budget selects work, edits retain stored codes, exact totals stay separated by currency, and there is no horizontal overflow. Also test unknown locale/timezone falls back to THB by overriding browser environment in an automated test rather than requesting location permission.

Stop before commit, push, or migration application and report exact validation results plus any environment limitation.
