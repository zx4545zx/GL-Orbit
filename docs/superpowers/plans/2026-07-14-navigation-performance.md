# Navigation Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce authenticated warm client navigation to under 500 ms while removing noisy loading feedback and preserving private user data boundaries.

**Architecture:** Keep only the nonblocking top navigation progress bar, remove one redundant authenticated-user query from every request, parallelize independent series queries, briefly cache only non-personalized Halo discovery data, and add calendar/join indexes through Drizzle schema plus migration. Personalized page data remains uncached.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Vitest, Drizzle ORM, PostgreSQL/Neon, Vite PWA.

---

## File Map

- `src/routes/+layout.svelte` — global route feedback; retain progress bar, remove toast state and markup.
- `src/routes/pwa-interaction.test.ts` — regression guard for nonblocking progress and absent toast/touch blocker.
- `src/hooks.server.ts` — derive locale preference from the already joined session user.
- `src/hooks.server.test.ts` — source-level guard preventing a second user query in the hook.
- `src/lib/server/series/listing.ts` — start independent count and listing queries together.
- `src/lib/server/series/listing.test.ts` — guard query concurrency structure.
- `src/lib/server/moments/queries.ts` — cache global Halo discovery results for 30 seconds.
- `src/lib/server/moments/queries.test.ts` — guard bounded, non-personalized discovery caching.
- `src/lib/server/db/schema.ts` — declare three calendar/join indexes.
- `tests/db/navigation-performance-indexes.test.ts` — verify schema and generated migration SQL.
- `drizzle/0021_navigation_performance_indexes.sql` — generated index migration.
- `drizzle/meta/0021_snapshot.json` and `drizzle/meta/_journal.json` — generated Drizzle metadata.

### Task 1: Remove the global loading toast

**Files:**
- Modify: `src/routes/+layout.svelte:1-85`
- Modify: `src/routes/pwa-interaction.test.ts:6-16`

- [ ] **Step 1: Write the failing regression assertion**

Replace the first test in `src/routes/pwa-interaction.test.ts` with:

```ts
it('keeps only the non-interactive top navigation progress bar', () => {
	expect(rootLayout).toContain('class="pointer-events-none fixed top-0 left-0 right-0 z-[60]"');
	expect(rootLayout).not.toContain('showRouteOverlay');
	expect(rootLayout).not.toContain('route_loading_title');
	expect(rootLayout).not.toContain('role="status"');
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- src/routes/pwa-interaction.test.ts
```

Expected: FAIL because `showRouteOverlay`, loading copy, and status toast still exist.

- [ ] **Step 3: Remove toast state, timer, markup, and unused translation import**

In `src/routes/+layout.svelte`:

- Change the Paraglide import to omit `m`.
- Delete `let showRouteOverlay = $state(false)`.
- Delete the `$effect` that starts the 180 ms timer.
- Delete the complete `{#if showRouteOverlay}` block.
- Keep `routeChanging` and the `z-[60]` progress bar unchanged.

The translation import must become:

```ts
import { availableLanguageTags, setLanguageTag, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';
```

- [ ] **Step 4: Run the test and verify GREEN**

Run:

```bash
npm test -- src/routes/pwa-interaction.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/routes/+layout.svelte src/routes/pwa-interaction.test.ts
git commit -m "fix(nav): remove noisy loading toast"
```

### Task 2: Remove the second authenticated-user query

**Files:**
- Create: `src/hooks.server.test.ts`
- Modify: `src/hooks.server.ts:1-35`

- [ ] **Step 1: Write the failing hook regression test**

Create `src/hooks.server.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./hooks.server.ts', import.meta.url), 'utf8');

describe('authenticated request locale lookup', () => {
	it('reuses preferredLanguage from the validated session user', () => {
		expect(source).toContain('const userLocale = event.locals.user?.preferredLanguage ?? undefined;');
		expect(source).not.toContain("import { getDb }");
		expect(source).not.toContain('.select({ preferredLanguage:');
	});
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- src/hooks.server.test.ts
```

Expected: FAIL because the hook still executes a second `users` lookup.

- [ ] **Step 3: Reuse the user returned by `validateSession`**

Delete these imports from `src/hooks.server.ts`:

```ts
import { getDb } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
```

Replace the mutable locale block with:

```ts
const userLocale = event.locals.user?.preferredLanguage ?? undefined;
```

Do not change locale precedence or session validation. `validateSession()` already selects the complete joined `users` row in `src/lib/server/auth/session.ts:50-55`.

- [ ] **Step 4: Run focused auth/locale checks**

Run:

```bash
npm test -- src/hooks.server.test.ts src/routes/api/auth/login/server.test.ts src/routes/api/auth/register/server.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/hooks.server.ts src/hooks.server.test.ts
git commit -m "perf(auth): reuse session user locale"
```

### Task 3: Parallelize independent series queries

**Files:**
- Create: `src/lib/server/series/listing.test.ts`
- Modify: `src/lib/server/series/listing.ts:124-176`

- [ ] **Step 1: Write the failing structural concurrency test**

Create `src/lib/server/series/listing.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./listing.ts', import.meta.url), 'utf8');

describe('series listing query scheduling', () => {
	it('runs independent count and page queries concurrently', () => {
		expect(source).toContain('const countQuery = db');
		expect(source).toContain('const rowsQuery = db');
		expect(source).toContain('await Promise.all([countQuery, rowsQuery])');
		expect(source).not.toMatch(/const \[countResult\] = await db/);
	});
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- src/lib/server/series/listing.test.ts
```

Expected: FAIL because count and page queries are currently awaited serially.

- [ ] **Step 3: Build both Drizzle queries before awaiting**

In `getSeriesList`, change the count and rows declarations to:

```ts
const countQuery = db
	.select({ count: sql<number>`count(*)::int` })
	.from(series)
	.leftJoin(studios, and(eq(series.studioId, studios.id), isNull(studios.deletedAt)))
	.where(where);

const rowsQuery = db
	.select({
		id: series.id,
		titleEn: series.titleEn,
		titleTh: series.titleTh,
		posterUrl: series.posterUrl,
		status: series.status,
		studioName: studios.name,
		firstAirDate: sql<Date | null>`MIN(${episodeSchedules.airDate})`
	})
	.from(series)
	.leftJoin(studios, and(eq(series.studioId, studios.id), isNull(studios.deletedAt)))
	.leftJoin(episodes, and(eq(series.id, episodes.seriesId), isNull(episodes.deletedAt)))
	.leftJoin(episodeSchedules, and(eq(episodes.id, episodeSchedules.episodeId), isNull(episodeSchedules.deletedAt)))
	.where(where)
	.groupBy(series.id, studios.name)
	.orderBy(
		sql`CASE
			WHEN ${series.status} = 'ONGOING' THEN 1
			WHEN ${series.status} = 'ENDED' THEN 2
			WHEN ${series.status} = 'UPCOMING' THEN 3
			ELSE 4
		END`,
		desc(sql`MIN(${episodeSchedules.airDate})`),
		asc(series.titleEn)
	)
	.limit(SERIES_PAGE_LIMIT)
	.offset(offset);

const [[countResult], rows] = await Promise.all([countQuery, rowsQuery]);
```

Keep the dependent genre query after `seriesIds` are available.

- [ ] **Step 4: Run listing and route tests**

Run:

```bash
npm test -- src/lib/server/series/listing.test.ts src/routes/[lang=lang]/\(app\)/series/series.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/lib/server/series/listing.ts src/lib/server/series/listing.test.ts
git commit -m "perf(series): parallelize listing queries"
```

### Task 4: Cache non-personalized Halo discovery

**Files:**
- Modify: `src/lib/server/moments/queries.ts:1-5,85-127`
- Modify: `src/lib/server/moments/queries.test.ts:1-11`

- [ ] **Step 1: Write the failing bounded-cache assertions**

Add this test to `src/lib/server/moments/queries.test.ts`:

```ts
it('caches only global Halo discovery results for 30 seconds', () => {
	const source = readFileSync(new URL('./queries.ts', import.meta.url), 'utf8');
	const feedSource = source.slice(
		source.indexOf('export async function getMoments'),
		source.indexOf('export async function getMoment(')
	);
	expect(source).toContain('const cacheKey = `halo-discovery:${safeLimit}`');
	expect(source).toContain('getCached<HaloDiscoveryItem[]>(cacheKey)');
	expect(source).toContain('setCached(cacheKey, result, 30_000)');
	expect(feedSource).not.toContain('getCached');
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- src/lib/server/moments/queries.test.ts
```

Expected: FAIL because discovery currently always queries PostgreSQL.

- [ ] **Step 3: Add a 30-second discovery cache**

Add the import:

```ts
import { getCached, setCached } from '../cache.js';
```

At the start of `getHaloDiscovery`, after `safeLimit`, add:

```ts
const cacheKey = `halo-discovery:${safeLimit}`;
const cached = getCached<HaloDiscoveryItem[]>(cacheKey);
if (cached) return cached;
```

Replace the direct return expression at the end with:

```ts
const result = [
	...seriesRows.map((item) => ({ ...item, kind: 'series' as const })),
	...artistRows.map((item) => ({ ...item, kind: 'artist' as const })),
	...shipRows.map((item) => ({ ...item, kind: 'ship' as const }))
].sort((a, b) => b.momentCount - a.momentCount).slice(0, safeLimit);

setCached(cacheKey, result, 30_000);
return result;
```

- [ ] **Step 4: Run Moment query tests**

Run:

```bash
npm test -- src/lib/server/moments/queries.test.ts src/lib/server/moments/types.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/lib/server/moments/queries.ts src/lib/server/moments/queries.test.ts
git commit -m "perf(halo): cache discovery queries"
```

### Task 5: Add calendar and join indexes

**Files:**
- Modify: `src/lib/server/db/schema.ts:177-195`
- Create: `tests/db/navigation-performance-indexes.test.ts`
- Create: `drizzle/0021_navigation_performance_indexes.sql`
- Create: `drizzle/meta/0021_snapshot.json`
- Modify: `drizzle/meta/_journal.json`

- [ ] **Step 1: Write the failing schema and migration test**

Create `tests/db/navigation-performance-indexes.test.ts`:

```ts
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const schemaPath = join(process.cwd(), 'src/lib/server/db/schema.ts');
const drizzleDirectory = join(process.cwd(), 'drizzle');

describe('navigation performance indexes', () => {
	it('declares and migrates calendar range and join indexes', async () => {
		const schema = await readFile(schemaPath, 'utf8');
		expect(schema).toContain("index('episodes_series_idx').on(table.seriesId)");
		expect(schema).toContain("index('episode_schedules_episode_idx').on(table.episodeId)");
		expect(schema).toContain("index('episode_schedules_air_date_idx').on(table.airDate).where(sql`");

		const files = await readdir(drizzleDirectory);
		const migration = files.find((file) => /^0021_.*\.sql$/.test(file));
		expect(migration).toBeDefined();
		const sql = await readFile(join(drizzleDirectory, migration!), 'utf8');
		expect(sql).toContain('"episodes_series_idx"');
		expect(sql).toContain('"episode_schedules_episode_idx"');
		expect(sql).toContain('"episode_schedules_air_date_idx"');
		expect(sql).toContain('WHERE "episode_schedules"."deleted_at" IS NULL');
	});
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- tests/db/navigation-performance-indexes.test.ts
```

Expected: FAIL because schema indexes and migration 0021 do not exist.

- [ ] **Step 3: Declare indexes in Drizzle schema**

Change the `episodes` definition to include:

```ts
}, (table) => ({
	seriesIndex: index('episodes_series_idx').on(table.seriesId)
}));
```

Change the `episodeSchedules` definition to include:

```ts
}, (table) => ({
	episodeIndex: index('episode_schedules_episode_idx').on(table.episodeId),
	airDateIndex: index('episode_schedules_air_date_idx')
		.on(table.airDate)
		.where(sql`${table.deletedAt} IS NULL`)
}));
```

- [ ] **Step 4: Generate migration and metadata**

Run:

```bash
npm run db:generate -- --name=navigation_performance_indexes
```

Expected: Drizzle creates `drizzle/0021_navigation_performance_indexes.sql`, `drizzle/meta/0021_snapshot.json`, and updates `drizzle/meta/_journal.json`.

- [ ] **Step 5: Inspect migration safety**

Confirm the migration contains only three `CREATE INDEX` statements and no table/column drops or rewrites:

```sql
CREATE INDEX "episodes_series_idx" ON "episodes" USING btree ("series_id");
CREATE INDEX "episode_schedules_episode_idx" ON "episode_schedules" USING btree ("episode_id");
CREATE INDEX "episode_schedules_air_date_idx" ON "episode_schedules" USING btree ("air_date") WHERE "episode_schedules"."deleted_at" IS NULL;
```

Do not run `npm run db:push`. Applying indexes to the live database requires separate user approval and a reviewed concurrent-index migration path.

- [ ] **Step 6: Run schema and migration tests**

Run:

```bash
npm test -- tests/db/navigation-performance-indexes.test.ts src/lib/server/db/schema.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 7: Commit Task 5**

```bash
git add src/lib/server/db/schema.ts tests/db/navigation-performance-indexes.test.ts drizzle/0021_navigation_performance_indexes.sql drizzle/meta/0021_snapshot.json drizzle/meta/_journal.json
git commit -m "perf(db): add navigation query indexes" -m "Index creation can lock writes when applied. Review and apply concurrently to the live database in a separately approved migration step."
```

### Task 6: Verify behavior and latency

**Files:**
- No production file changes expected.

- [ ] **Step 1: Run all targeted regression tests**

```bash
npm test -- src/routes/pwa-interaction.test.ts src/hooks.server.test.ts src/lib/server/series/listing.test.ts src/lib/server/moments/queries.test.ts tests/db/navigation-performance-indexes.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 2: Run project checks**

```bash
npm run check
npm run build
```

Expected: `svelte-check` reports 0 errors; production build and service-worker generation succeed. Existing unrelated Svelte warnings may remain.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: new performance tests pass. If the known stale login source assertion remains, report it separately; do not modify unrelated login behavior in this plan.

- [ ] **Step 4: Start production preview**

```bash
npm run preview -- --host 127.0.0.1
```

Expected: preview serves the production build and registers `service-worker.js`.

- [ ] **Step 5: Measure authenticated warm client navigation**

Using browser network timing, navigate twice through:

1. `/en/calendar`
2. `/en/explore/series`
3. `/en/halo/explore`
4. `/en/halo`

Record the second `__data.json` duration for each route. Expected target: representative warm durations below 500 ms. External Neon/network variance must be reported rather than hidden.

- [ ] **Step 6: Verify UX and privacy invariants**

Confirm:

- no loading toast appears;
- top progress bar appears and remains `pointer-events: none`;
- navigation controls work on mobile Halo and public app routes;
- authenticated user and locale remain correct;
- service worker remains active;
- no public cache response contains personalized parent page data.

- [ ] **Step 7: Request independent review**

Ask reviewer to inspect session correctness, cache privacy boundaries, query concurrency, migration safety, and measured evidence. Fix all Critical/Important findings before completion.
