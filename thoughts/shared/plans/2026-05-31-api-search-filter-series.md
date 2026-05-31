# API Search and SEO Series Listing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move series search/filtering from frontend-only filtering to backend/API filtering while making filtered series pages SEO-friendly.

**Architecture:** `/series` will use server-side loading from URL query params (`search`, `status`) for crawlable SSR output. `/api/series` will accept the same params for Load More pagination. Shared server utilities will normalize filters, query the database, and build SEO metadata/JSON-LD.

**Tech Stack:** SvelteKit 2, Svelte 5 Runes, TypeScript 5.8, Drizzle ORM, Neon PostgreSQL, Tailwind CSS 4.

---

## File Structure

- Create: `src/lib/server/series/listing.ts`
  - Owns filter parsing, database queries, response mapping, SEO metadata, JSON-LD schema.
  - Server-only module. Import only from `+page.server.ts` and `+server.ts`.
- Create: `src/routes/(app)/series/+page.server.ts`
  - SSR entry point for `/series`; reads URL params and returns page data.
- Delete: `src/routes/(app)/series/+page.ts`
  - Replaced by server load for SEO.
- Modify: `src/routes/api/series/+server.ts`
  - Reuses shared listing utility and adds `search`/`status` params to API pagination.
- Modify: `src/routes/(app)/series/+page.svelte`
  - Removes frontend filtering; syncs search/status to URL; renders `<svelte:head>` SEO tags.

---

## Task 1: Create Shared Series Listing Utility

**Files:**
- Create: `src/lib/server/series/listing.ts`

- [ ] **Step 1: Create the server utility file**

Create `src/lib/server/series/listing.ts` with:

```ts
import { and, asc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { series, studios } from '$lib/server/db/schema.js';

export const SERIES_PAGE_LIMIT = 20;

export const SERIES_STATUSES = ['ALL', 'ONGOING', 'UPCOMING', 'ENDED'] as const;
export type SeriesStatusFilter = (typeof SERIES_STATUSES)[number];

export type SeriesListItem = {
	id: string;
	title: string;
	subtitle: string;
	poster: string;
	status: 'UPCOMING' | 'ONGOING' | 'ENDED';
	studio: string;
};

export type SeriesListResult = {
	items: SeriesListItem[];
	total: number;
	page: number;
	limit: number;
};

export type SeriesFilters = {
	search: string;
	status: SeriesStatusFilter;
};

export type SeriesSeoMeta = {
	title: string;
	description: string;
	robots: string;
	canonicalPath: string;
	ogTitle: string;
	ogDescription: string;
	jsonLd: string;
};

const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop';

const STATUS_FROM_URL: Record<string, SeriesStatusFilter> = {
	all: 'ALL',
	ongoing: 'ONGOING',
	upcoming: 'UPCOMING',
	ended: 'ENDED'
};

const STATUS_TO_URL: Record<SeriesStatusFilter, string> = {
	ALL: 'all',
	ONGOING: 'ongoing',
	UPCOMING: 'upcoming',
	ENDED: 'ended'
};

const STATUS_LABEL: Record<SeriesStatusFilter, string> = {
	ALL: 'ทั้งหมด',
	ONGOING: 'กำลังฉาย',
	UPCOMING: 'เร็วๆ นี้',
	ENDED: 'จบแล้ว'
};

function normalizeSearch(value: string | null): string {
	return (value ?? '').trim().slice(0, 100);
}

export function parseSeriesFilters(searchParams: URLSearchParams): SeriesFilters {
	const rawStatus = (searchParams.get('status') ?? 'all').trim().toLowerCase();

	return {
		search: normalizeSearch(searchParams.get('search')),
		status: STATUS_FROM_URL[rawStatus] ?? 'ALL'
	};
}

export function parseSeriesPage(searchParams: URLSearchParams): number {
	const value = Number.parseInt(searchParams.get('page') ?? '1', 10);
	return Number.isFinite(value) ? Math.max(1, value) : 1;
}

export function buildSeriesSearchParams(filters: SeriesFilters): URLSearchParams {
	const params = new URLSearchParams();
	if (filters.search) params.set('search', filters.search);
	if (filters.status !== 'ALL') params.set('status', STATUS_TO_URL[filters.status]);
	return params;
}

function buildSeriesConditions(filters: SeriesFilters) {
	const conditions = [isNull(series.deletedAt)];

	if (filters.status !== 'ALL') {
		conditions.push(eq(series.status, filters.status));
	}

	if (filters.search) {
		const pattern = `%${filters.search}%`;
		conditions.push(
			or(
				ilike(series.titleEn, pattern),
				ilike(series.titleTh, pattern),
				ilike(studios.name, pattern)
			)!
		);
	}

	return and(...conditions);
}

export async function getSeriesList(filters: SeriesFilters, page: number = 1): Promise<SeriesListResult> {
	const db = await getDb();
	const offset = (page - 1) * SERIES_PAGE_LIMIT;
	const where = buildSeriesConditions(filters);

	const [countResult] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(series)
		.leftJoin(studios, eq(series.studioId, studios.id))
		.where(where);

	const rows = await db
		.select({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			posterUrl: series.posterUrl,
			status: series.status,
			studioName: studios.name
		})
		.from(series)
		.leftJoin(studios, eq(series.studioId, studios.id))
		.where(where)
		.orderBy(asc(series.titleEn))
		.limit(SERIES_PAGE_LIMIT)
		.offset(offset);

	return {
		items: rows.map((item) => ({
			id: item.id,
			title: item.titleEn,
			subtitle: item.titleTh ?? '',
			poster: item.posterUrl ?? DEFAULT_POSTER,
			status: item.status,
			studio: item.studioName ?? 'ไม่ระบุสตูดิโอ'
		})),
		total: countResult?.count ?? 0,
		page,
		limit: SERIES_PAGE_LIMIT
	};
}

export function buildSeriesCacheKey(filters: SeriesFilters, page: number): string {
	return `api:series:search:${filters.search}:status:${filters.status}:page:${page}`;
}

export function buildSeriesSeoMeta(filters: SeriesFilters, items: SeriesListItem[], url: URL): SeriesSeoMeta {
	const params = buildSeriesSearchParams(filters);
	const query = params.toString();
	const canonicalPath = query ? `/series?${query}` : '/series';

	let title = 'ซีรีส์ GL ทั้งหมด | GL-Orbit';
	let description = 'รวมซีรีส์ Girls\' Love ทั้งหมดจากทั่วโลก พร้อมตารางฉายและข้อมูลครบถ้วน';

	if (filters.status !== 'ALL') {
		const label = STATUS_LABEL[filters.status];
		title = `ซีรีส์ GL ${label} | GL-Orbit`;
		description = `รวมซีรีส์ Girls' Love ${label} พร้อมตารางฉายและข้อมูลครบถ้วน`;
	}

	if (filters.search) {
		title = `ผลการค้นหา "${filters.search}" | GL-Orbit`;
		description = `ผลการค้นหาซีรีส์ Girls' Love สำหรับ "${filters.search}" บน GL-Orbit`;
	}

	const breadcrumb = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: `${url.origin}/` },
			{ '@type': 'ListItem', position: 2, name: 'ซีรีส์ทั้งหมด', item: `${url.origin}/series` }
		]
	};

	const schemas: unknown[] = [breadcrumb];

	if (!filters.search) {
		schemas.push({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			itemListElement: items.map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				item: {
					'@type': 'TVSeries',
					name: item.title,
					image: item.poster,
					url: `${url.origin}/series/${item.id}`,
					productionCompany: { '@type': 'Organization', name: item.studio }
				}
			}))
		});
	}

	return {
		title,
		description,
		robots: filters.search ? 'noindex, follow' : 'index, follow',
		canonicalPath,
		ogTitle: title,
		ogDescription: description,
		jsonLd: JSON.stringify(schemas)
	};
}
```

- [ ] **Step 2: Run type check**

Run:

```bash
npm run check
```

Expected: Existing project compiles or reports only unrelated pre-existing issues. If this task introduces errors in `src/lib/server/series/listing.ts`, fix them before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/series/listing.ts
git commit -m "feat(series): add server-side listing query utilities"
```

---

## Task 2: Replace Client Load with SEO Server Load

**Files:**
- Create: `src/routes/(app)/series/+page.server.ts`
- Delete: `src/routes/(app)/series/+page.ts`

- [ ] **Step 1: Create server load file**

Create `src/routes/(app)/series/+page.server.ts`:

```ts
import type { PageServerLoad } from './$types.js';
import { buildSeriesSeoMeta, getSeriesList, parseSeriesFilters } from '$lib/server/series/listing.js';

export const load: PageServerLoad = async ({ url }) => {
	const filters = parseSeriesFilters(url.searchParams);
	const series = await getSeriesList(filters, 1);
	const meta = buildSeriesSeoMeta(filters, series.items, url);

	return {
		series,
		filters,
		meta
	};
};
```

- [ ] **Step 2: Remove old universal load**

Delete `src/routes/(app)/series/+page.ts`.

- [ ] **Step 3: Run type check**

Run:

```bash
npm run check
```

Expected: Type errors may appear in `+page.svelte` because it still expects the old `data.series` shape. These will be fixed in Task 4. No errors should come from `+page.server.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/routes/(app)/series/+page.server.ts src/routes/(app)/series/+page.ts
git commit -m "feat(series): load listing through server for SEO"
```

---

## Task 3: Add Backend Filters to Series API

**Files:**
- Modify: `src/routes/api/series/+server.ts`

- [ ] **Step 1: Replace API endpoint implementation**

Replace `src/routes/api/series/+server.ts` with:

```ts
import { json } from '@sveltejs/kit';
import { buildSeriesCacheKey, getSeriesList, parseSeriesFilters, parseSeriesPage } from '$lib/server/series/listing.js';
import { getCached, setCached } from '$lib/server/cache.js';
import type { RequestHandler } from './$types.js';

const CACHE_TTL = 30_000;

export const GET: RequestHandler = async ({ url }) => {
	const filters = parseSeriesFilters(url.searchParams);
	const page = parseSeriesPage(url.searchParams);
	const cacheKey = buildSeriesCacheKey(filters, page);

	const cached = getCached(cacheKey, CACHE_TTL);
	if (cached) {
		return json(cached);
	}

	const result = await getSeriesList(filters, page);
	setCached(cacheKey, result, CACHE_TTL);

	return json(result);
};
```

- [ ] **Step 2: Run type check**

Run:

```bash
npm run check
```

Expected: API route compiles. Remaining errors should only involve `+page.svelte` old frontend filtering state.

- [ ] **Step 3: Manually verify API URLs in dev server**

Run:

```bash
npm run dev
```

Open these URLs:

```text
http://localhost:5173/api/series?page=1
http://localhost:5173/api/series?status=ongoing&page=1
http://localhost:5173/api/series?search=gap&page=1
http://localhost:5173/api/series?search=gap&status=ongoing&page=1
```

Expected response shape for each:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

The actual `items` and `total` values depend on database contents.

- [ ] **Step 4: Commit**

```bash
git add src/routes/api/series/+server.ts
git commit -m "feat(series): filter listing API on server"
```

---

## Task 4: Update Series Page UI to Use URL-backed Server Data

**Files:**
- Modify: `src/routes/(app)/series/+page.svelte`

- [ ] **Step 1: Update script imports and state**

In `src/routes/(app)/series/+page.svelte`, replace the current `<script lang="ts">` block with this implementation:

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let showSticky = $state(false);
	let titleRef: HTMLDivElement;
	let allSeries = $state(data.series.items);
	let total = $state(data.series.total);
	let currentPage = $state(data.series.page);
	let searchQuery = $state(data.filters.search);
	let filterStatus = $state(data.filters.status);
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: 'เร็วๆ นี้', class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }
	};

	const filterOptions = [
		{ key: 'ALL', label: 'ทั้งหมด' },
		{ key: 'ONGOING', label: 'กำลังฉาย' },
		{ key: 'UPCOMING', label: 'เร็วๆ นี้' },
		{ key: 'ENDED', label: 'จบแล้ว' }
	] as const;

	const hasMore = $derived(allSeries.length < total);

	$effect(() => {
		if (!titleRef) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				showSticky = !entry.isIntersecting;
			},
			{ threshold: 0, rootMargin: '0px 0px -1px 0px' }
		);
		observer.observe(titleRef);
		return () => observer.disconnect();
	});

	$effect(() => {
		allSeries = data.series.items;
		total = data.series.total;
		currentPage = data.series.page;
		searchQuery = data.filters.search;
		filterStatus = data.filters.status;
		loading = false;
		loadMoreError = '';
	});

	function buildUrl(search: string, status: typeof filterStatus) {
		const params = new URLSearchParams();
		const trimmedSearch = search.trim();
		if (trimmedSearch) params.set('search', trimmedSearch);
		if (status !== 'ALL') params.set('status', status.toLowerCase());
		const query = params.toString();
		return query ? `/series?${query}` : '/series';
	}

	function updateUrl(search: string, status: typeof filterStatus) {
		loading = true;
		void goto(buildUrl(search, status), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function scheduleSearchUpdate() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => updateUrl(searchQuery, filterStatus), 300);
	}

	function updateStatus(status: typeof filterStatus) {
		filterStatus = status;
		updateUrl(searchQuery, status);
	}

	function clearSearch() {
		searchQuery = '';
		updateUrl('', filterStatus);
	}

	async function loadMore() {
		if (loadMoreLoading) return;
		loadMoreLoading = true;
		loadMoreError = '';

		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('page', String(currentPage + 1));
			const res = await fetch(`/api/series?${params.toString()}`);

			if (!res.ok) {
				throw new Error('โหลดข้อมูลไม่สำเร็จ');
			}

			const result = await res.json();
			if (result && Array.isArray(result.items)) {
				allSeries = [...allSeries, ...result.items];
				currentPage = result.page;
				total = result.total;
			}
		} catch {
			loadMoreError = 'โหลดไม่สำเร็จ กรุณาลองใหม่';
		} finally {
			loadMoreLoading = false;
		}
	}
</script>
```

- [ ] **Step 2: Add SEO head block below script**

Immediately after the closing `</script>` tag, add:

```svelte
<svelte:head>
	<title>{data.meta.title}</title>
	<meta name="description" content={data.meta.description} />
	<meta name="robots" content={data.meta.robots} />
	<link rel="canonical" href={data.meta.canonicalPath} />
	<link rel="alternate" hreflang="th" href={data.meta.canonicalPath} />
	<link rel="alternate" hreflang="x-default" href={data.meta.canonicalPath} />
	<meta property="og:title" content={data.meta.ogTitle} />
	<meta property="og:description" content={data.meta.ogDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.meta.canonicalPath} />
	<meta name="twitter:card" content="summary_large_image" />
	<script type="application/ld+json">{data.meta.jsonLd}</script>
</svelte:head>
```

- [ ] **Step 3: Update search input handler**

In the search input, replace `bind:value={searchQuery}` with:

```svelte
bind:value={searchQuery}
oninput={scheduleSearchUpdate}
```

- [ ] **Step 4: Update status filter loop**

Replace the `{#each ... as filter}` expression in the status filter with:

```svelte
{#each filterOptions as filter}
	<button
		onclick={() => updateStatus(filter.key)}
		class="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 touch-target whitespace-nowrap {filterStatus === filter.key ? 'bg-gradient-to-r from-coral to-coral-dark text-white shadow-lg shadow-coral/25' : 'text-plum-light hover:bg-white/60'}"
	>
		{filter.label}
	</button>
{/each}
```

- [ ] **Step 5: Replace grid iteration**

Replace:

```svelte
{#each filteredSeries() as s (s.id)}
```

with:

```svelte
{#each allSeries as s (s.id)}
```

- [ ] **Step 6: Update empty state condition**

Replace:

```svelte
{#if !loading && filteredSeries().length === 0}
```

with:

```svelte
{#if !loading && allSeries.length === 0}
```

- [ ] **Step 7: Add Load More error message**

Inside the Load More block, below the button, add:

```svelte
{#if loadMoreError}
	<p class="mt-3 text-sm text-coral-dark">{loadMoreError}</p>
{/if}
```

- [ ] **Step 8: Run type check**

Run:

```bash
npm run check
```

Expected: PASS with no Svelte/TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add src/routes/(app)/series/+page.svelte
git commit -m "feat(series): sync filters through SEO-friendly URLs"
```

---

## Task 5: Final Verification

**Files:**
- Verify all files touched in prior tasks

- [ ] **Step 1: Run full project checks**

Run:

```bash
npm run check
npm run build
```

Expected: both commands exit successfully.

- [ ] **Step 2: Verify SSR SEO output manually**

Run dev server:

```bash
npm run dev
```

Open these pages and view source:

```text
http://localhost:5173/series
http://localhost:5173/series?status=ongoing
http://localhost:5173/series?search=gap
http://localhost:5173/series?search=gap&status=ongoing
```

Expected:
- `/series` has `<meta name="robots" content="index, follow">`
- `/series?status=ongoing` has `<meta name="robots" content="index, follow">`
- URLs with `search=` have `<meta name="robots" content="noindex, follow">`
- `<script type="application/ld+json">` is present
- Series cards appear in view source for SSR pages

- [ ] **Step 3: Verify UI behavior manually**

Expected:
- Typing in search updates the URL after 300ms.
- Status pill click updates the URL immediately.
- Browser back/forward restores search/status state.
- Load More fetches with the current `search` and `status` params.
- Empty state text stays Thai.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git status
git diff --stat
git diff
```

Expected: only intended files changed.

- [ ] **Step 5: Final commit if verification caused edits**

If Task 5 required fixes, commit them:

```bash
git add src/lib/server/series/listing.ts src/routes/(app)/series/+page.server.ts src/routes/(app)/series/+page.svelte src/routes/api/series/+server.ts
git commit -m "fix(series): finalize SEO filter behavior"
```

If no files changed during verification, skip this commit.

---

## Self-Review

### Spec Coverage

- Backend/API search and filter: Task 1 and Task 3.
- Server-side `/series` load for SEO: Task 2.
- URL query params (`search`, lowercase `status`): Task 1, Task 2, Task 4.
- Frontend no longer filters locally: Task 4 removes `filteredSeries()` usage.
- Load More passes API params: Task 4.
- Dynamic title/description/robots/canonical/OG/JSON-LD: Task 1 and Task 4.
- Search pages noindex: Task 1 and Task 5.
- Thai UI copy: Task 4 and Task 5.
- Verification: Task 5.

### Placeholder Scan

No placeholder implementation steps remain. Every file creation/replacement has concrete code, and every verification step has exact commands and expected outcomes.

### Type Consistency

- `SeriesStatusFilter` uses database enum uppercase values plus `ALL` for UI filter state.
- URL status values are lowercase and normalized in `parseSeriesFilters()`.
- Public API response shape remains `{ items, total, page, limit }`.
- `+page.svelte` reads `data.series`, `data.filters`, and `data.meta`, matching `+page.server.ts` return shape.
