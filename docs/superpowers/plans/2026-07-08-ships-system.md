# Ships System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete Ships system with database schema, public pages, Explore tab, admin management, and hard delete behavior.

**Architecture:** Add `ships` as a first-class entity with exactly two artists and a `ship_series` join table. Public pages read through server-side query helpers, while admin pages use protected `/api/admin/ships` endpoints. Routes, API names, schema names, and code names use `ships` consistently; Thai UI copy can say “คู่จิ้น”.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Drizzle ORM, PostgreSQL/Neon, Tailwind CSS 4, Paraglide messages.

---

## Scope Notes

- Automated tests are intentionally excluded by user request.
- Use `getDb()` in all server files.
- Use `.js` suffixes for TypeScript imports because the project uses `module: NodeNext`.
- Do not commit during implementation unless the user explicitly asks.
- Hard delete ships. Do not add `deletedAt` to `ships`.

## File Structure

### Database and migrations

- Modify: `src/lib/server/db/schema.ts`
  - Add `ships` table.
  - Add `shipSeries` table.
  - Export both tables.
- Generate: `drizzle/` migration file through `npm run db:generate` after schema changes.

### Public query layer

- Create: `src/lib/server/ships/listing.ts`
  - Parse search/page filters.
  - Fetch paginated published ships.
  - Build SEO metadata for `/ships`.
  - Provide cache key helpers.
- Create: `src/lib/server/ships/detail.ts`
  - Fetch one published ship by ID or slug.
  - Include two artists and related series.
  - Build detail SEO/JSON-LD values used by the page.

### Public routes

- Create: `src/routes/[lang=lang]/(app)/ships/+page.server.ts`
  - Load cached ship list data.
- Create: `src/routes/[lang=lang]/(app)/ships/+page.svelte`
  - Render the full public ships list page, matching Series visual patterns.
- Create: `src/routes/[lang=lang]/(app)/ships/[id]/+page.server.ts`
  - Load one ship detail by ID or slug.
- Create: `src/routes/[lang=lang]/(app)/ships/[id]/+page.svelte`
  - Render detail hero, artist pair, hashtags, and shared series.

### Explore routes

- Modify: `src/routes/[lang=lang]/(app)/explore/+layout.svelte`
  - Add Ships tab.
- Create: `src/routes/[lang=lang]/(app)/explore/ships/+page.server.ts`
  - Load cached ship list data for Explore.
- Create: `src/routes/[lang=lang]/(app)/explore/ships/+page.svelte`
  - Render compact Explore list matching Explore Series/Artists.

### Admin routes and APIs

- Create: `src/routes/api/admin/ships/+server.ts`
  - `GET` list/search.
  - `POST` create with validation.
- Create: `src/routes/api/admin/ships/[id]/+server.ts`
  - `GET` detail for edit.
  - `PATCH` update with validation.
  - `DELETE` hard delete.
- Create: `src/routes/[lang=lang]/admin/ships/+page.svelte`
  - Admin list/create/edit/delete UI.
- Modify: `src/routes/[lang=lang]/admin/+layout.svelte`
  - Add Ships nav item.

### API support routes

- Create: `src/routes/api/ships/+server.ts`
  - Public paginated load-more endpoint for `/ships`.
- Create: `src/routes/api/explore/ships/+server.ts`
  - Public paginated load-more endpoint for `/explore/ships`.

### Localization and shared layout

- Modify: `messages/th.json`
  - Add Thai ships labels, empty states, SEO strings, admin labels.
- Modify: `messages/en.json`
  - Add English ships labels, empty states, SEO strings, admin labels.
- Modify: `src/routes/[lang=lang]/(app)/+layout.svelte`
  - Include `/ships` in long-list/back-to-top logic if it currently checks explicit paths.

---

## Task 1: Add Ships Database Schema

**Files:**
- Modify: `src/lib/server/db/schema.ts`
- Generate: `drizzle/<generated-migration>.sql`

- [ ] **Step 1: Update schema imports**

Modify `src/lib/server/db/schema.ts:1` so the import still includes the existing builders and can define the new tables. Keep it as one import line:

```ts
import { pgTable, uuid, varchar, text, timestamp, boolean, integer, time, pgEnum, jsonb } from 'drizzle-orm/pg-core';
```

No new import is required if `slug` and `pairKey` use `.unique()` on `varchar`.

- [ ] **Step 2: Add `ships` after `artists`**

Insert after the `artists` table in `src/lib/server/db/schema.ts`:

```ts
export const ships = pgTable('ships', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	slug: varchar('slug', { length: 255 }).notNull().unique(),
	artist1Id: uuid('artist_1_id').notNull().references(() => artists.id, { onDelete: 'restrict' }),
	artist2Id: uuid('artist_2_id').notNull().references(() => artists.id, { onDelete: 'restrict' }),
	pairKey: varchar('pair_key', { length: 80 }).notNull().unique(),
	imageUrl: text('image_url'),
	description: text('description'),
	startedAt: timestamp('started_at', { withTimezone: true }),
	hashtags: jsonb('hashtags').$type<string[]>().notNull().default([]),
	isFeatured: boolean('is_featured').notNull().default(false),
	isPublished: boolean('is_published').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
```

- [ ] **Step 3: Add `shipSeries` after `series` or after `seriesArtists`**

Insert this table in `src/lib/server/db/schema.ts` after `seriesArtists` so relationship tables stay near each other:

```ts
export const shipSeries = pgTable('ship_series', {
	shipId: uuid('ship_id').notNull().references(() => ships.id, { onDelete: 'cascade' }),
	seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	pk: { columns: [table.shipId, table.seriesId] }
}));
```

- [ ] **Step 4: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: Drizzle creates one new migration under `drizzle/` that adds `ships` and `ship_series`.

- [ ] **Step 5: Inspect migration**

Open the generated SQL migration and confirm it creates:

```sql
CREATE TABLE "ships" (...);
CREATE TABLE "ship_series" (...);
```

Confirm it includes unique constraints for:

```sql
"ships_slug_unique"
"ships_pair_key_unique"
```

Do not run `npm run db:push` unless the user explicitly asks to apply schema changes.

---

## Task 2: Add Ships Query Helpers

**Files:**
- Create: `src/lib/server/ships/listing.ts`
- Create: `src/lib/server/ships/detail.ts`

- [ ] **Step 1: Create ships folder**

Create:

```text
src/lib/server/ships/
```

- [ ] **Step 2: Create `src/lib/server/ships/listing.ts`**

Add this implementation:

```ts
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { artists, series, shipSeries, ships } from '$lib/server/db/schema.js';

export const SHIPS_PAGE_LIMIT = 20;

export type ShipListItem = {
	id: string;
	slug: string;
	name: string;
	imageUrl: string;
	description: string;
	hashtags: string[];
	isFeatured: boolean;
	artist1: { id: string; name: string; imageUrl: string };
	artist2: { id: string; name: string; imageUrl: string };
	seriesCount: number;
};

export type ShipListResult = {
	items: ShipListItem[];
	total: number;
	page: number;
	limit: number;
};

export type ShipFilters = {
	search: string;
};

export type ShipSeoMeta = {
	title: string;
	description: string;
	robots: string;
	canonicalPath: string;
	jsonLd: string;
};

const DEFAULT_SHIP_IMAGE = '/placeholders/poster.svg';
const DEFAULT_ARTIST_IMAGE = '/placeholders/avatar.svg';

function safeJsonLd(data: unknown): string {
	return JSON.stringify(data)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}

function normalizeSearch(value: string | null): string {
	return (value ?? '').trim().slice(0, 100);
}

export function parseShipFilters(searchParams: URLSearchParams): ShipFilters {
	return { search: normalizeSearch(searchParams.get('search')) };
}

export function parseShipPage(searchParams: URLSearchParams): number {
	const value = Number.parseInt(searchParams.get('page') ?? '1', 10);
	return Number.isFinite(value) ? Math.max(1, value) : 1;
}

export function buildShipSearchParams(filters: ShipFilters): URLSearchParams {
	const params = new URLSearchParams();
	if (filters.search) params.set('search', filters.search);
	return params;
}

function buildShipConditions(filters: ShipFilters) {
	const a1 = artists;
	const conditions = [eq(ships.isPublished, true)];

	if (filters.search) {
		const pattern = `%${filters.search.replace(/[\\%_]/g, '\\$&')}%`;
		conditions.push(
			or(
				ilike(ships.name, pattern),
				sql`${a1.nickname} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${a1.fullNameEn} ILIKE ${pattern} ESCAPE '\\'`,
				sql`${a1.fullNameTh} ILIKE ${pattern} ESCAPE '\\'`
			)!
		);
	}

	return and(...conditions);
}

export async function getShipList(filters: ShipFilters, page: number = 1): Promise<ShipListResult> {
	const db = await getDb();
	const offset = (page - 1) * SHIPS_PAGE_LIMIT;
	const where = buildShipConditions(filters);

	const artist1 = artists;
	const artist2 = artists;

	const [countResult] = await db
		.select({ count: sql<number>`count(distinct ${ships.id})::int` })
		.from(ships)
		.innerJoin(artist1, and(eq(ships.artist1Id, artist1.id), isNull(artist1.deletedAt)))
		.innerJoin(artist2, and(eq(ships.artist2Id, artist2.id), isNull(artist2.deletedAt)))
		.where(where);

	const rows = await db
		.select({
			id: ships.id,
			slug: ships.slug,
			name: ships.name,
			imageUrl: ships.imageUrl,
			description: ships.description,
			hashtags: ships.hashtags,
			isFeatured: ships.isFeatured,
			artist1Id: artist1.id,
			artist1Nickname: artist1.nickname,
			artist1FullNameEn: artist1.fullNameEn,
			artist1ImageUrl: artist1.profileImageUrl,
			artist2Id: artist2.id,
			artist2Nickname: artist2.nickname,
			artist2FullNameEn: artist2.fullNameEn,
			artist2ImageUrl: artist2.profileImageUrl,
			seriesCount: sql<number>`count(distinct ${shipSeries.seriesId})::int`
		})
		.from(ships)
		.innerJoin(artist1, and(eq(ships.artist1Id, artist1.id), isNull(artist1.deletedAt)))
		.innerJoin(artist2, and(eq(ships.artist2Id, artist2.id), isNull(artist2.deletedAt)))
		.leftJoin(shipSeries, eq(ships.id, shipSeries.shipId))
		.where(where)
		.groupBy(ships.id, artist1.id, artist2.id)
		.orderBy(desc(ships.isFeatured), desc(ships.createdAt), asc(ships.name))
		.limit(SHIPS_PAGE_LIMIT)
		.offset(offset);

	return {
		items: rows.map((row) => ({
			id: row.id,
			slug: row.slug,
			name: row.name,
			imageUrl: row.imageUrl ?? DEFAULT_SHIP_IMAGE,
			description: row.description ?? '',
			hashtags: row.hashtags ?? [],
			isFeatured: row.isFeatured,
			artist1: {
				id: row.artist1Id,
				name: row.artist1Nickname || row.artist1FullNameEn,
				imageUrl: row.artist1ImageUrl ?? DEFAULT_ARTIST_IMAGE
			},
			artist2: {
				id: row.artist2Id,
				name: row.artist2Nickname || row.artist2FullNameEn,
				imageUrl: row.artist2ImageUrl ?? DEFAULT_ARTIST_IMAGE
			},
			seriesCount: row.seriesCount
		})),
		total: countResult?.count ?? 0,
		page,
		limit: SHIPS_PAGE_LIMIT
	};
}

export function buildShipCacheKey(filters: ShipFilters, page: number, scope: 'ships' | 'explore' = 'ships'): string {
	return `api:${scope}:ships:search:${filters.search}:page:${page}`;
}

export function buildShipSeoMeta(filters: ShipFilters, items: ShipListItem[], url: URL, page: number = 1): ShipSeoMeta {
	const params = buildShipSearchParams(filters);
	if (page > 1) params.set('page', String(page));
	const query = params.toString();
	const canonicalPath = query ? `/ships?${query}` : '/ships';

	const title = filters.search ? `ผลการค้นหา "${filters.search}" | GL-Orbit` : 'Ships คู่จิ้น GL | GL-Orbit';
	const description = filters.search
		? `ผลการค้นหา Ships คู่จิ้น GL สำหรับ "${filters.search}" บน GL-Orbit`
		: 'รวม Ships คู่จิ้น GL พร้อมข้อมูลศิลปินและผลงานร่วมกัน';

	const jsonLd = safeJsonLd({
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'Person',
				name: item.name,
				image: item.imageUrl,
				url: `${url.origin}/ships/${item.slug}`
			}
		}))
	});

	return {
		title,
		description,
		robots: filters.search ? 'noindex, follow' : 'index, follow',
		canonicalPath,
		jsonLd
	};
}

export { DEFAULT_SHIP_IMAGE, DEFAULT_ARTIST_IMAGE };
```

- [ ] **Step 3: Create `src/lib/server/ships/detail.ts`**

Add this implementation:

```ts
import { and, eq, isNull, or } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { artists, series, shipSeries, ships } from '$lib/server/db/schema.js';
import { DEFAULT_ARTIST_IMAGE, DEFAULT_SHIP_IMAGE } from './listing.js';

export type ShipDetail = {
	id: string;
	slug: string;
	name: string;
	imageUrl: string;
	description: string;
	startedAt: Date | null;
	hashtags: string[];
	isFeatured: boolean;
	artist1: { id: string; name: string; fullNameEn: string; fullNameTh: string; imageUrl: string };
	artist2: { id: string; name: string; fullNameEn: string; fullNameTh: string; imageUrl: string };
	series: { id: string; title: string; titleTh: string; posterUrl: string; status: 'UPCOMING' | 'ONGOING' | 'ENDED' }[];
};

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function getShipDetail(identifier: string): Promise<ShipDetail | null> {
	const db = await getDb();
	const artist1 = artists;
	const artist2 = artists;

	const lookup = isUuid(identifier) ? or(eq(ships.id, identifier), eq(ships.slug, identifier)) : eq(ships.slug, identifier);

	const [row] = await db
		.select({
			id: ships.id,
			slug: ships.slug,
			name: ships.name,
			imageUrl: ships.imageUrl,
			description: ships.description,
			startedAt: ships.startedAt,
			hashtags: ships.hashtags,
			isFeatured: ships.isFeatured,
			artist1Id: artist1.id,
			artist1Nickname: artist1.nickname,
			artist1FullNameEn: artist1.fullNameEn,
			artist1FullNameTh: artist1.fullNameTh,
			artist1ImageUrl: artist1.profileImageUrl,
			artist2Id: artist2.id,
			artist2Nickname: artist2.nickname,
			artist2FullNameEn: artist2.fullNameEn,
			artist2FullNameTh: artist2.fullNameTh,
			artist2ImageUrl: artist2.profileImageUrl
		})
		.from(ships)
		.innerJoin(artist1, and(eq(ships.artist1Id, artist1.id), isNull(artist1.deletedAt)))
		.innerJoin(artist2, and(eq(ships.artist2Id, artist2.id), isNull(artist2.deletedAt)))
		.where(and(eq(ships.isPublished, true), lookup))
		.limit(1);

	if (!row) return null;

	const seriesRows = await db
		.select({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			posterUrl: series.posterUrl,
			status: series.status,
			sortOrder: shipSeries.sortOrder
		})
		.from(shipSeries)
		.innerJoin(series, and(eq(shipSeries.seriesId, series.id), isNull(series.deletedAt)))
		.where(eq(shipSeries.shipId, row.id))
		.orderBy(shipSeries.sortOrder, series.titleEn);

	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		imageUrl: row.imageUrl ?? DEFAULT_SHIP_IMAGE,
		description: row.description ?? '',
		startedAt: row.startedAt,
		hashtags: row.hashtags ?? [],
		isFeatured: row.isFeatured,
		artist1: {
			id: row.artist1Id,
			name: row.artist1Nickname || row.artist1FullNameEn,
			fullNameEn: row.artist1FullNameEn,
			fullNameTh: row.artist1FullNameTh ?? '',
			imageUrl: row.artist1ImageUrl ?? DEFAULT_ARTIST_IMAGE
		},
		artist2: {
			id: row.artist2Id,
			name: row.artist2Nickname || row.artist2FullNameEn,
			fullNameEn: row.artist2FullNameEn,
			fullNameTh: row.artist2FullNameTh ?? '',
			imageUrl: row.artist2ImageUrl ?? DEFAULT_ARTIST_IMAGE
		},
		series: seriesRows.map((item) => ({
			id: item.id,
			title: item.titleEn,
			titleTh: item.titleTh ?? '',
			posterUrl: item.posterUrl ?? '/placeholders/poster.svg',
			status: item.status
		}))
	};
}

export function buildShipDetailSeo(ship: ShipDetail, origin: string) {
	const description = ship.description || `${ship.name} บน GL-Orbit พร้อมข้อมูลศิลปินและผลงานร่วมกัน`;
	return {
		title: `${ship.name} | Ships GL-Orbit`,
		description,
		canonicalPath: `/ships/${ship.slug}`,
		jsonLd: JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ProfilePage',
			name: ship.name,
			description,
			image: ship.imageUrl,
			url: `${origin}/ships/${ship.slug}`
		}).replace(/</g, '\\u003c')
	};
}
```

- [ ] **Step 4: Review alias limitation before implementation**

The snippets above use `const artist1 = artists; const artist2 = artists;`. If Drizzle rejects joining the same table twice without aliases, replace the imports in both files with `aliasedTable` from Drizzle's pg-core utilities if available in this project version, or create raw SQL aliases following existing project style. Keep the final field names the same so route code does not change.

---

## Task 3: Add Public Ships List and Detail Routes

**Files:**
- Create: `src/routes/[lang=lang]/(app)/ships/+page.server.ts`
- Create: `src/routes/[lang=lang]/(app)/ships/+page.svelte`
- Create: `src/routes/[lang=lang]/(app)/ships/[id]/+page.server.ts`
- Create: `src/routes/[lang=lang]/(app)/ships/[id]/+page.svelte`

- [ ] **Step 1: Create list server load**

Create `src/routes/[lang=lang]/(app)/ships/+page.server.ts`:

```ts
import { getCached, setCached } from '$lib/server/cache.js';
import {
	buildShipCacheKey,
	buildShipSeoMeta,
	getShipList,
	parseShipFilters,
	parseShipPage
} from '$lib/server/ships/listing.js';
import type { PageServerLoad } from './$types.js';

const CACHE_TTL = 30_000;

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const filters = parseShipFilters(url.searchParams);
	const page = parseShipPage(url.searchParams);
	const cacheKey = buildShipCacheKey(filters, page, 'ships');
	const cached = getCached<Awaited<ReturnType<typeof getShipList>>>(cacheKey, CACHE_TTL);
	const ships = cached ?? await getShipList(filters, page);

	if (!cached) setCached(cacheKey, ships, CACHE_TTL);

	setHeaders({
		'cache-control': 'private, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});

	return {
		ships,
		filters,
		seo: buildShipSeoMeta(filters, ships.items, url, page)
	};
};
```

- [ ] **Step 2: Create list Svelte page**

Create `src/routes/[lang=lang]/(app)/ships/+page.svelte`. Base it on `src/routes/[lang=lang]/(app)/series/+page.svelte`, replacing series terminology with ships and using only search filtering:

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { buildCanonicalUrl, jsonLdScript, localizedPath } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { ShipListItem } from '$lib/server/ships/listing.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let extraShips = $state<ShipListItem[]>([]);
	let loadedPage = $state<number | null>(null);
	let searchQuery = $state('');
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');
	let loadMoreController: AbortController | null = null;

	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, data.seo.canonicalPath));
	const localizedJsonLd = $derived(data.seo.jsonLd.replaceAll(`${page.url.origin}/ships`, `${page.url.origin}${localizedPath(currentLang, '/ships')}`));
	const allShips = $derived([...data.ships.items, ...extraShips]);
	const total = $derived(data.ships.total);
	const currentPage = $derived(loadedPage ?? data.ships.page);
	const hasMore = $derived(allShips.length < total);

	$effect(() => {
		if (loadMoreController) {
			loadMoreController.abort();
			loadMoreController = null;
			loadMoreLoading = false;
		}
		extraShips = [];
		loadedPage = null;
		searchQuery = data.filters.search;
		loadMoreError = '';
		loading = false;
	});

	function buildUrl(search: string): string {
		const params = new URLSearchParams();
		if (search.trim()) params.set('search', search.trim());
		const query = params.toString();
		const base = `/${page.data.lang}/ships`;
		return query ? `${base}?${query}` : base;
	}

	async function updateUrl(search: string) {
		if (loadMoreController) {
			loadMoreController.abort();
			loadMoreController = null;
			loadMoreLoading = false;
		}
		const target = buildUrl(search);
		const current = page.url.pathname + page.url.search;
		if (target === current) return;
		loading = true;
		await goto(target, { replaceState: true, noScroll: true, keepFocus: true });
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	function clearSearchTimer() {
		clearTimeout(searchTimer);
		searchTimer = undefined;
	}
	$effect(() => () => clearSearchTimer());
	function scheduleSearchUpdate() {
		clearSearchTimer();
		searchTimer = setTimeout(() => {
			searchTimer = undefined;
			updateUrl(searchQuery);
		}, 500);
	}
	function clearSearch() {
		clearSearchTimer();
		searchQuery = '';
		updateUrl('');
	}
	async function loadMore() {
		if (!hasMore || loadMoreLoading) return;
		loadMoreLoading = true;
		loadMoreError = '';
		loadMoreController = new AbortController();
		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('page', String(currentPage + 1));
			const response = await fetch(`/api/ships?${params.toString()}`, { signal: loadMoreController.signal });
			if (!response.ok) throw new Error('load-more-failed');
			const result = await response.json() as { items: ShipListItem[]; page: number };
			extraShips = [...extraShips, ...result.items];
			loadedPage = result.page;
		} catch (err) {
			if ((err as Error).name !== 'AbortError') loadMoreError = m.series_load_error();
		} finally {
			loadMoreLoading = false;
			loadMoreController = null;
		}
	}
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="robots" content={data.seo.robots} />
	<link rel="canonical" href={canonicalUrl} />
	{@html jsonLdScript(localizedJsonLd)}
</svelte:head>

<section class="space-y-8 pb-12">
	<header class="text-center space-y-3">
		<p class="text-sm font-semibold text-coral-dark uppercase tracking-[0.3em]">Ships</p>
		<h1 class="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-plum">
			<span class="text-gradient">คู่จิ้น</span> ทั้งหมด
		</h1>
		<p class="text-plum-light max-w-2xl mx-auto">รวม Ships คู่จิ้น GL พร้อมศิลปินและผลงานร่วมกัน</p>
	</header>

	<div class="glass-card-strong rounded-[2rem] p-4 sm:p-5 sticky top-4 z-10">
		<label class="sr-only" for="ship-search">ค้นหา Ships</label>
		<div class="relative">
			<input
				id="ship-search"
				bind:value={searchQuery}
				oninput={scheduleSearchUpdate}
				type="search"
				placeholder="ค้นหาชื่อคู่จิ้นหรือศิลปิน..."
				class="w-full rounded-2xl border border-white/70 bg-white/80 px-5 py-4 pr-12 text-plum placeholder:text-plum-light/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-coral/40"
			/>
			{#if searchQuery}
				<button type="button" onclick={clearSearch} class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-plum-light hover:bg-coral/10 hover:text-coral-dark" aria-label={m.common_search_clear()}>×</button>
			{/if}
		</div>
	</div>

	{#if loading}
		<p class="text-center text-plum-light">{m.common_loading()}</p>
	{/if}

	{#if allShips.length > 0}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each allShips as ship (ship.id)}
				<a href="/{page.data.lang}/ships/{ship.slug}" class="glass-card group overflow-hidden rounded-[1.75rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
					<div class="aspect-[4/3] overflow-hidden bg-lavender/10">
						<Picture src={ship.imageUrl} alt={ship.name} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
					</div>
					<div class="space-y-3 p-5">
						<div class="flex items-start justify-between gap-3">
							<h2 class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum">{ship.name}</h2>
							{#if ship.isFeatured}<span class="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral-dark">Featured</span>{/if}
						</div>
						<p class="text-sm text-plum-light">{ship.artist1.name} × {ship.artist2.name}</p>
						<p class="text-sm text-plum-light line-clamp-2">{ship.description || 'ยังไม่มีคำอธิบาย'}</p>
						<div class="flex flex-wrap gap-2 text-xs text-plum-light">
							<span class="rounded-full bg-mint/15 px-3 py-1">{ship.seriesCount} ผลงานร่วมกัน</span>
							{#each ship.hashtags.slice(0, 2) as tag}<span class="rounded-full bg-lavender/15 px-3 py-1">#{tag}</span>{/each}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="glass-card rounded-[2rem] p-10 text-center">
			<h2 class="text-2xl font-bold text-plum">ไม่พบ Ships</h2>
			<p class="mt-2 text-plum-light">ลองค้นหาด้วยคำอื่น หรือกลับมาดูใหม่ภายหลัง</p>
		</div>
	{/if}

	{#if hasMore}
		<div class="text-center">
			<button type="button" onclick={loadMore} disabled={loadMoreLoading} class="touch-target rounded-full bg-gradient-to-r from-coral to-coral-dark px-6 py-3 font-semibold text-white shadow-lg shadow-coral/25 disabled:opacity-60">
				{loadMoreLoading ? m.common_loading() : m.common_load_more()}
			</button>
			{#if loadMoreError}<p class="mt-3 text-sm text-coral-dark">{loadMoreError}</p>{/if}
		</div>
	{/if}
</section>
```

- [ ] **Step 3: Create detail server load**

Create `src/routes/[lang=lang]/(app)/ships/[id]/+page.server.ts`:

```ts
import { error } from '@sveltejs/kit';
import { buildShipDetailSeo, getShipDetail } from '$lib/server/ships/detail.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const ship = await getShipDetail(params.id);
	if (!ship) error(404, 'ไม่พบ Ship นี้');

	setHeaders({
		'cache-control': 'private, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});

	return {
		ship,
		seo: buildShipDetailSeo(ship, url.origin)
	};
};
```

- [ ] **Step 4: Create detail Svelte page**

Create `src/routes/[lang=lang]/(app)/ships/[id]/+page.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { buildCanonicalUrl, jsonLdScript } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, data.seo.canonicalPath));
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={canonicalUrl} />
	{@html jsonLdScript(data.seo.jsonLd)}
</svelte:head>

<article class="space-y-10 pb-12">
	<section class="glass-card-strong overflow-hidden rounded-[2rem]">
		<div class="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="aspect-[16/10] lg:aspect-auto overflow-hidden bg-lavender/10">
				<Picture src={data.ship.imageUrl} alt={data.ship.name} class="h-full w-full object-cover" />
			</div>
			<div class="flex flex-col justify-center space-y-5 p-6 sm:p-8 lg:p-10">
				<p class="text-sm font-semibold uppercase tracking-[0.3em] text-coral-dark">Ship</p>
				<h1 class="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-plum">{data.ship.name}</h1>
				<p class="text-lg text-plum-light">{data.ship.artist1.name} × {data.ship.artist2.name}</p>
				{#if data.ship.description}<p class="leading-8 text-plum-light">{data.ship.description}</p>{/if}
				{#if data.ship.hashtags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each data.ship.hashtags as tag}<span class="rounded-full bg-lavender/20 px-3 py-1 text-sm font-semibold text-lavender-dark">#{tag}</span>{/each}
					</div>
				{/if}
			</div>
		</div>
	</section>

	<section class="grid gap-5 sm:grid-cols-2">
		{#each [data.ship.artist1, data.ship.artist2] as artist}
			<a href="/{page.data.lang}/artists/{artist.id}" class="glass-card flex items-center gap-4 rounded-[1.5rem] p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
				<Picture src={artist.imageUrl} alt={artist.name} class="h-20 w-20 rounded-2xl object-cover" />
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-coral-dark">Artist</p>
					<h2 class="text-xl font-bold text-plum">{artist.name}</h2>
					<p class="text-sm text-plum-light">{artist.fullNameTh || artist.fullNameEn}</p>
				</div>
			</a>
		{/each}
	</section>

	<section class="space-y-4">
		<h2 class="font-[family-name:var(--font-display)] text-3xl font-bold text-plum">ผลงานร่วมกัน</h2>
		{#if data.ship.series.length > 0}
			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.ship.series as item}
					<a href="/{page.data.lang}/series/{item.id}" class="glass-card overflow-hidden rounded-[1.5rem] transition hover:-translate-y-1 hover:shadow-lg">
						<Picture src={item.posterUrl} alt={item.title} class="aspect-[3/4] w-full object-cover" />
						<div class="p-4">
							<h3 class="font-bold text-plum">{item.title}</h3>
							{#if item.titleTh}<p class="text-sm text-plum-light">{item.titleTh}</p>{/if}
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="glass-card rounded-[1.5rem] p-6 text-plum-light">ยังไม่มีผลงานร่วมกันในระบบ</div>
		{/if}
	</section>
</article>
```

---

## Task 4: Add Public Load-More API Routes

**Files:**
- Create: `src/routes/api/ships/+server.ts`
- Create: `src/routes/api/explore/ships/+server.ts`

- [ ] **Step 1: Create `/api/ships`**

Create `src/routes/api/ships/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import { getShipList, parseShipFilters, parseShipPage } from '$lib/server/ships/listing.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const filters = parseShipFilters(url.searchParams);
	const page = parseShipPage(url.searchParams);
	const result = await getShipList(filters, page);

	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});

	return json(result);
};
```

- [ ] **Step 2: Create `/api/explore/ships`**

Create `src/routes/api/explore/ships/+server.ts` with the same implementation as `/api/ships`:

```ts
import { json } from '@sveltejs/kit';
import { getShipList, parseShipFilters, parseShipPage } from '$lib/server/ships/listing.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const filters = parseShipFilters(url.searchParams);
	const page = parseShipPage(url.searchParams);
	const result = await getShipList(filters, page);

	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});

	return json(result);
};
```

---

## Task 5: Add Explore Ships Tab and Page

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/explore/+layout.svelte`
- Create: `src/routes/[lang=lang]/(app)/explore/ships/+page.server.ts`
- Create: `src/routes/[lang=lang]/(app)/explore/ships/+page.svelte`

- [ ] **Step 1: Add `nav_ships` message usage to Explore tabs**

Modify the `tabs` array in `src/routes/[lang=lang]/(app)/explore/+layout.svelte` to include Ships between Series and Artists:

```ts
const tabs = $derived([
	{ id: 'series', href: `${langPrefix}/explore/series`, label: m.nav_series(), icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4' },
	{ id: 'ships', href: `${langPrefix}/explore/ships`, label: m.nav_ships(), icon: 'M12 21s-6.716-4.35-9.193-7.06C.429 11.337.52 7.54 3.05 5.24 5.264 3.228 8.59 3.62 12 7.09c3.41-3.47 6.736-3.862 8.95-1.85 2.53 2.3 2.621 6.097.243 8.7C18.716 16.65 12 21 12 21z' },
	{ id: 'artists', href: `${langPrefix}/explore/artists`, label: m.nav_artists(), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
]);
```

- [ ] **Step 2: Create Explore Ships server load**

Create `src/routes/[lang=lang]/(app)/explore/ships/+page.server.ts`:

```ts
import { getCached, setCached } from '$lib/server/cache.js';
import { buildShipCacheKey, getShipList, parseShipFilters, parseShipPage } from '$lib/server/ships/listing.js';
import type { PageServerLoad } from './$types.js';

const CACHE_TTL = 30_000;

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const filters = parseShipFilters(url.searchParams);
	const page = parseShipPage(url.searchParams);
	const cacheKey = buildShipCacheKey(filters, page, 'explore');
	const cached = getCached<Awaited<ReturnType<typeof getShipList>>>(cacheKey, CACHE_TTL);
	const ships = cached ?? await getShipList(filters, page);

	if (!cached) setCached(cacheKey, ships, CACHE_TTL);

	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});

	return { ships, filters };
};
```

- [ ] **Step 3: Create Explore Ships page**

Create `src/routes/[lang=lang]/(app)/explore/ships/+page.svelte` by reusing the `/ships` page behavior with Explore URLs and a compact header:

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { buildBreadcrumbJsonLd, buildCanonicalUrl, buildWebPageJsonLd, jsonLdScript, safeJsonLd } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { ShipListItem } from '$lib/server/ships/listing.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let extraShips = $state<ShipListItem[]>([]);
	let searchQuery = $state(data.filters.search);
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');

	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalPath = '/explore/ships';
	const SEO_TITLE = 'สำรวจ Ships คู่จิ้น GL | GL-Orbit';
	const SEO_DESCRIPTION = 'สำรวจ Ships คู่จิ้น GL พร้อมศิลปินและผลงานร่วมกัน';
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const jsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, `/${currentLang}${canonicalPath}`, SEO_TITLE, SEO_DESCRIPTION, currentLang),
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: m.nav_home(), path: `/${currentLang}` },
			{ name: m.nav_explore(), path: `/${currentLang}/explore/series` },
			{ name: m.nav_ships(), path: `/${currentLang}${canonicalPath}` }
		])
	]));

	const allShips = $derived([...data.ships.items, ...extraShips]);
	const total = $derived(data.ships.total);
	const currentPage = $derived(data.ships.page + Math.floor(extraShips.length / data.ships.limit));
	const hasMore = $derived(allShips.length < total);

	$effect(() => {
		extraShips = [];
		searchQuery = data.filters.search;
		loadMoreError = '';
		loading = false;
	});

	function buildUrl(search: string): string {
		const params = new URLSearchParams();
		if (search.trim()) params.set('search', search.trim());
		const query = params.toString();
		const base = `/${page.data.lang}/explore/ships`;
		return query ? `${base}?${query}` : base;
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	function scheduleSearchUpdate() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(async () => {
			const target = buildUrl(searchQuery);
			if (target !== page.url.pathname + page.url.search) {
				loading = true;
				await goto(target, { replaceState: true, noScroll: true, keepFocus: true });
			}
		}, 500);
	}
	function clearSearch() {
		clearTimeout(searchTimer);
		searchQuery = '';
		goto(buildUrl(''), { replaceState: true, noScroll: true, keepFocus: true });
	}
	async function loadMore() {
		if (!hasMore || loadMoreLoading) return;
		loadMoreLoading = true;
		loadMoreError = '';
		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('page', String(currentPage + 1));
			const response = await fetch(`/api/explore/ships?${params.toString()}`);
			if (!response.ok) throw new Error('load-more-failed');
			const result = await response.json() as { items: ShipListItem[] };
			extraShips = [...extraShips, ...result.items];
		} catch {
			loadMoreError = m.series_load_error();
		} finally {
			loadMoreLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{SEO_TITLE}</title>
	<meta name="description" content={SEO_DESCRIPTION} />
	<link rel="canonical" href={canonicalUrl} />
	{@html jsonLdScript(jsonLd)}
</svelte:head>

<section class="space-y-6">
	<div class="glass-card rounded-[1.75rem] p-4">
		<label class="sr-only" for="explore-ship-search">ค้นหา Ships</label>
		<div class="relative">
			<input id="explore-ship-search" bind:value={searchQuery} oninput={scheduleSearchUpdate} type="search" placeholder="ค้นหา Ships หรือศิลปิน..." class="w-full rounded-2xl border border-white/70 bg-white/80 px-5 py-3 pr-12 text-plum placeholder:text-plum-light/60 focus:outline-none focus:ring-2 focus:ring-coral/40" />
			{#if searchQuery}<button type="button" onclick={clearSearch} class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-plum-light hover:bg-coral/10">×</button>{/if}
		</div>
	</div>

	{#if loading}<p class="text-center text-plum-light">{m.common_loading()}</p>{/if}

	{#if allShips.length > 0}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each allShips as ship (ship.id)}
				<a href="/{page.data.lang}/ships/{ship.slug}" class="glass-card overflow-hidden rounded-[1.5rem] transition hover:-translate-y-1 hover:shadow-lg">
					<Picture src={ship.imageUrl} alt={ship.name} class="aspect-[4/3] w-full object-cover" />
					<div class="space-y-2 p-4">
						<h2 class="font-[family-name:var(--font-display)] text-xl font-bold text-plum">{ship.name}</h2>
						<p class="text-sm text-plum-light">{ship.artist1.name} × {ship.artist2.name}</p>
						<p class="text-xs text-plum-light">{ship.seriesCount} ผลงานร่วมกัน</p>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="glass-card rounded-[1.5rem] p-8 text-center text-plum-light">ไม่พบ Ships ที่ตรงกับการค้นหา</div>
	{/if}

	{#if hasMore}
		<div class="text-center">
			<button type="button" onclick={loadMore} disabled={loadMoreLoading} class="touch-target rounded-full bg-gradient-to-r from-coral to-coral-dark px-6 py-3 font-semibold text-white shadow-lg shadow-coral/25 disabled:opacity-60">
				{loadMoreLoading ? m.common_loading() : m.common_load_more()}
			</button>
			{#if loadMoreError}<p class="mt-3 text-sm text-coral-dark">{loadMoreError}</p>{/if}
		</div>
	{/if}
</section>
```

---

## Task 6: Add Admin Ships APIs

**Files:**
- Create: `src/routes/api/admin/ships/+server.ts`
- Create: `src/routes/api/admin/ships/[id]/+server.ts`

- [ ] **Step 1: Create shared helper code inside `+server.ts`**

Create `src/routes/api/admin/ships/+server.ts`:

```ts
import { error, json } from '@sveltejs/kit';
import { and, asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { artists, series, shipSeries, ships } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

type ShipInput = {
	name?: string;
	slug?: string;
	artist1Id?: string;
	artist2Id?: string;
	imageUrl?: string;
	description?: string;
	startedAt?: string | null;
	hashtags?: string[] | string;
	isFeatured?: boolean;
	isPublished?: boolean;
	seriesIds?: string[];
};

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'ADMIN') error(403, 'ไม่มีสิทธิ์เข้าถึง');
}

function normalizeSlug(value: string): string {
	return value.trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 255);
}

function normalizeHashtags(value: ShipInput['hashtags']): string[] {
	if (Array.isArray(value)) return value.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 20);
	return (value ?? '').split(',').map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 20);
}

function buildPairKey(artist1Id: string, artist2Id: string): string {
	return [artist1Id, artist2Id].sort().join(':');
}

async function validateShipInput(body: ShipInput, existingId?: string) {
	const name = body.name?.trim() ?? '';
	const slug = normalizeSlug(body.slug?.trim() || name);
	const artist1Id = body.artist1Id?.trim() ?? '';
	const artist2Id = body.artist2Id?.trim() ?? '';

	if (!name) return { ok: false as const, error: 'กรุณากรอกชื่อ Ship' };
	if (!slug) return { ok: false as const, error: 'กรุณากรอก slug หรือชื่อ Ship ที่สร้าง slug ได้' };
	if (!artist1Id || !artist2Id) return { ok: false as const, error: 'กรุณาเลือกศิลปินให้ครบ 2 คน' };
	if (artist1Id === artist2Id) return { ok: false as const, error: 'ศิลปินทั้งสองคนต้องไม่ซ้ำกัน' };

	const db = await getDb();
	const pairKey = buildPairKey(artist1Id, artist2Id);

	const [slugConflict] = await db.select({ id: ships.id }).from(ships).where(eq(ships.slug, slug)).limit(1);
	if (slugConflict && slugConflict.id !== existingId) return { ok: false as const, error: 'slug นี้ถูกใช้แล้ว' };

	const [pairConflict] = await db.select({ id: ships.id }).from(ships).where(eq(ships.pairKey, pairKey)).limit(1);
	if (pairConflict && pairConflict.id !== existingId) return { ok: false as const, error: 'คู่ศิลปินนี้มีอยู่แล้ว' };

	return {
		ok: true as const,
		data: {
			name,
			slug,
			artist1Id,
			artist2Id,
			pairKey,
			imageUrl: body.imageUrl?.trim() || null,
			description: body.description?.trim() || null,
			startedAt: body.startedAt ? new Date(body.startedAt) : null,
			hashtags: normalizeHashtags(body.hashtags),
			isFeatured: Boolean(body.isFeatured),
			isPublished: Boolean(body.isPublished),
			seriesIds: Array.isArray(body.seriesIds) ? body.seriesIds.filter(Boolean) : []
		}
	};
}

export const GET: RequestHandler = async ({ locals, url }) => {
	requireAdmin(locals);
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(1000, Number.parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const search = (url.searchParams.get('search') ?? '').trim();
	const offset = (page - 1) * limit;
	const db = await getDb();

	const where = search
		? or(ilike(ships.name, `%${search}%`), ilike(ships.slug, `%${search}%`))
		: undefined;

	const rows = await db
		.select({
			id: ships.id,
			name: ships.name,
			slug: ships.slug,
			imageUrl: ships.imageUrl,
			isFeatured: ships.isFeatured,
			isPublished: ships.isPublished,
			artist1Id: ships.artist1Id,
			artist2Id: ships.artist2Id,
			createdAt: ships.createdAt
		})
		.from(ships)
		.where(where)
		.orderBy(asc(ships.name))
		.limit(limit)
		.offset(offset);

	const artistIds = [...new Set(rows.flatMap((row) => [row.artist1Id, row.artist2Id]))];
	const artistRows = artistIds.length
		? await db.select({ id: artists.id, nickname: artists.nickname, fullNameEn: artists.fullNameEn }).from(artists).where(inArray(artists.id, artistIds))
		: [];
	const artistMap = new Map(artistRows.map((artist) => [artist.id, artist.nickname || artist.fullNameEn]));

	const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(ships).where(where);

	return json({
		data: rows.map((row) => ({
			...row,
			artist1Name: artistMap.get(row.artist1Id) ?? 'ไม่พบศิลปิน',
			artist2Name: artistMap.get(row.artist2Id) ?? 'ไม่พบศิลปิน'
		})),
		page,
		limit,
		total: count,
		totalPages: Math.ceil(count / limit)
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals);
	const body = await request.json() as ShipInput;
	const validated = await validateShipInput(body);
	if (!validated.ok) return json({ success: false, error: validated.error }, { status: 400 });

	const db = await getDb();
	const { seriesIds, ...shipData } = validated.data;
	const [inserted] = await db.insert(ships).values(shipData).returning();

	if (seriesIds.length > 0) {
		await db.insert(shipSeries).values(seriesIds.map((seriesId, index) => ({ shipId: inserted.id, seriesId, sortOrder: index })));
	}

	return json({ success: true, data: inserted }, { status: 201 });
};
```

- [ ] **Step 2: Create item API route**

Create `src/routes/api/admin/ships/[id]/+server.ts`:

```ts
import { error, json } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { artists, series, shipSeries, ships } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'ADMIN') error(403, 'ไม่มีสิทธิ์เข้าถึง');
}

function normalizeSlug(value: string): string {
	return value.trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 255);
}

function normalizeHashtags(value: string[] | string | undefined): string[] {
	if (Array.isArray(value)) return value.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 20);
	return (value ?? '').split(',').map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 20);
}

function buildPairKey(artist1Id: string, artist2Id: string): string {
	return [artist1Id, artist2Id].sort().join(':');
}

export const GET: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);
	const db = await getDb();
	const [ship] = await db.select().from(ships).where(eq(ships.id, params.id)).limit(1);
	if (!ship) error(404, 'ไม่พบ Ship');

	const relations = await db.select({ seriesId: shipSeries.seriesId }).from(shipSeries).where(eq(shipSeries.shipId, params.id));
	return json({ success: true, data: { ...ship, seriesIds: relations.map((item) => item.seriesId) } });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);
	const body = await request.json();
	const name = body.name?.trim() ?? '';
	const slug = normalizeSlug(body.slug?.trim() || name);
	const artist1Id = body.artist1Id?.trim() ?? '';
	const artist2Id = body.artist2Id?.trim() ?? '';

	if (!name) return json({ success: false, error: 'กรุณากรอกชื่อ Ship' }, { status: 400 });
	if (!slug) return json({ success: false, error: 'กรุณากรอก slug หรือชื่อ Ship ที่สร้าง slug ได้' }, { status: 400 });
	if (!artist1Id || !artist2Id) return json({ success: false, error: 'กรุณาเลือกศิลปินให้ครบ 2 คน' }, { status: 400 });
	if (artist1Id === artist2Id) return json({ success: false, error: 'ศิลปินทั้งสองคนต้องไม่ซ้ำกัน' }, { status: 400 });

	const db = await getDb();
	const [existing] = await db.select({ id: ships.id }).from(ships).where(eq(ships.id, params.id)).limit(1);
	if (!existing) error(404, 'ไม่พบ Ship');

	const pairKey = buildPairKey(artist1Id, artist2Id);
	const [slugConflict] = await db.select({ id: ships.id }).from(ships).where(eq(ships.slug, slug)).limit(1);
	if (slugConflict && slugConflict.id !== params.id) return json({ success: false, error: 'slug นี้ถูกใช้แล้ว' }, { status: 400 });
	const [pairConflict] = await db.select({ id: ships.id }).from(ships).where(eq(ships.pairKey, pairKey)).limit(1);
	if (pairConflict && pairConflict.id !== params.id) return json({ success: false, error: 'คู่ศิลปินนี้มีอยู่แล้ว' }, { status: 400 });

	const [updated] = await db.update(ships)
		.set({
			name,
			slug,
			artist1Id,
			artist2Id,
			pairKey,
			imageUrl: body.imageUrl?.trim() || null,
			description: body.description?.trim() || null,
			startedAt: body.startedAt ? new Date(body.startedAt) : null,
			hashtags: normalizeHashtags(body.hashtags),
			isFeatured: Boolean(body.isFeatured),
			isPublished: Boolean(body.isPublished),
			updatedAt: new Date()
		})
		.where(eq(ships.id, params.id))
		.returning();

	await db.delete(shipSeries).where(eq(shipSeries.shipId, params.id));
	const seriesIds = Array.isArray(body.seriesIds) ? body.seriesIds.filter(Boolean) : [];
	if (seriesIds.length > 0) {
		await db.insert(shipSeries).values(seriesIds.map((seriesId: string, index: number) => ({ shipId: params.id, seriesId, sortOrder: index })));
	}

	return json({ success: true, data: updated });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);
	const db = await getDb();
	await db.delete(ships).where(eq(ships.id, params.id));
	return json({ success: true });
};
```

- [ ] **Step 3: Remove unused imports after creation**

After creating both API files, remove any imports TypeScript reports as unused. In particular, `artists`, `series`, `and`, and `inArray` may not be needed in `[id]/+server.ts` after final editing.

---

## Task 7: Add Admin Ships Page and Navigation

**Files:**
- Create: `src/routes/[lang=lang]/admin/ships/+page.svelte`
- Modify: `src/routes/[lang=lang]/admin/+layout.svelte`

- [ ] **Step 1: Add admin nav item**

In `src/routes/[lang=lang]/admin/+layout.svelte`, add Ships to the first nav section after Series:

```ts
{ href: `/${page.data.lang}/admin/ships`, label: 'Ships', hint: 'จัดการคู่จิ้น', icon: 'M12 21s-6.716-4.35-9.193-7.06C.429 11.337.52 7.54 3.05 5.24 5.264 3.228 8.59 3.62 12 7.09c3.41-3.47 6.736-3.862 8.95-1.85 2.53 2.3 2.621 6.097.243 8.7C18.716 16.65 12 21 12 21z' }
```

- [ ] **Step 2: Create admin page skeleton and types**

Create `src/routes/[lang=lang]/admin/ships/+page.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { adminFetch } from '$lib/admin/api.js';

	type AdminShip = {
		id: string;
		name: string;
		slug: string;
		imageUrl: string | null;
		isFeatured: boolean;
		isPublished: boolean;
		artist1Name: string;
		artist2Name: string;
	};

	type ArtistOption = { id: string; nickname: string; fullNameEn: string };
	type SeriesOption = { id: string; title: string; titleTh?: string };

	let ships = $state<AdminShip[]>([]);
	let artists = $state<ArtistOption[]>([]);
	let seriesOptions = $state<SeriesOption[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let errorMessage = $state('');
	let search = $state('');
	let editingId = $state<string | null>(null);

	let form = $state({
		name: '',
		slug: '',
		artist1Id: '',
		artist2Id: '',
		imageUrl: '',
		description: '',
		startedAt: '',
		hashtags: '',
		isFeatured: false,
		isPublished: false,
		seriesIds: [] as string[]
	});

	async function loadShips() {
		loading = true;
		errorMessage = '';
		try {
			const params = new URLSearchParams();
			params.set('limit', '1000');
			if (search.trim()) params.set('search', search.trim());
			const response = await adminFetch(`/api/admin/ships?${params.toString()}`);
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || result.error || 'โหลดข้อมูลไม่สำเร็จ');
			ships = result.data;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ';
		} finally {
			loading = false;
		}
	}

	async function loadReferences() {
		const [artistsResponse, seriesResponse] = await Promise.all([
			adminFetch('/api/admin/artists?limit=1000'),
			adminFetch('/api/admin/series?limit=1000')
		]);
		const artistsResult = await artistsResponse.json();
		const seriesResult = await seriesResponse.json();
		artists = artistsResult.data ?? [];
		seriesOptions = (seriesResult.data ?? []).map((item: { id: string; title: string; titleTh?: string }) => ({ id: item.id, title: item.title, titleTh: item.titleTh }));
	}

	onMount(async () => {
		await Promise.all([loadShips(), loadReferences()]);
	});

	function resetForm() {
		editingId = null;
		form = { name: '', slug: '', artist1Id: '', artist2Id: '', imageUrl: '', description: '', startedAt: '', hashtags: '', isFeatured: false, isPublished: false, seriesIds: [] };
		errorMessage = '';
	}

	function toggleSeries(id: string) {
		form.seriesIds = form.seriesIds.includes(id) ? form.seriesIds.filter((item) => item !== id) : [...form.seriesIds, id];
	}

	async function editShip(id: string) {
		const response = await adminFetch(`/api/admin/ships/${id}`);
		const result = await response.json();
		if (!response.ok) {
			errorMessage = result.message || result.error || 'โหลดข้อมูล Ship ไม่สำเร็จ';
			return;
		}
		const ship = result.data;
		editingId = ship.id;
		form = {
			name: ship.name ?? '',
			slug: ship.slug ?? '',
			artist1Id: ship.artist1Id ?? '',
			artist2Id: ship.artist2Id ?? '',
			imageUrl: ship.imageUrl ?? '',
			description: ship.description ?? '',
			startedAt: ship.startedAt ? ship.startedAt.slice(0, 10) : '',
			hashtags: Array.isArray(ship.hashtags) ? ship.hashtags.join(', ') : '',
			isFeatured: Boolean(ship.isFeatured),
			isPublished: Boolean(ship.isPublished),
			seriesIds: ship.seriesIds ?? []
		};
	}

	async function saveShip() {
		saving = true;
		errorMessage = '';
		try {
			const response = await adminFetch(editingId ? `/api/admin/ships/${editingId}` : '/api/admin/ships', {
				method: editingId ? 'PATCH' : 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(form)
			});
			const result = await response.json();
			if (!response.ok || !result.success) throw new Error(result.error || 'บันทึกไม่สำเร็จ');
			resetForm();
			await loadShips();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ';
		} finally {
			saving = false;
		}
	}

	async function deleteShip(id: string) {
		if (!confirm('ลบ Ship นี้ถาวรใช่ไหม? การลบนี้ย้อนกลับไม่ได้')) return;
		const response = await adminFetch(`/api/admin/ships/${id}`, { method: 'DELETE' });
		const result = await response.json();
		if (!response.ok || !result.success) {
			errorMessage = result.error || 'ลบไม่สำเร็จ';
			return;
		}
		await loadShips();
	}
</script>
```

- [ ] **Step 3: Add admin page markup**

Append this markup to `src/routes/[lang=lang]/admin/ships/+page.svelte`:

```svelte
<svelte:head>
	<title>จัดการ Ships | GL-Orbit Admin</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-sm font-semibold text-coral-dark">Admin</p>
			<h1 class="text-3xl font-bold text-plum">จัดการ Ships</h1>
			<p class="text-sm text-gray-500">เพิ่มและแก้ไขคู่จิ้น พร้อมศิลปินและผลงานร่วมกัน</p>
		</div>
		<button type="button" onclick={resetForm} class="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-plum shadow-sm ring-1 ring-gray-200 hover:bg-gray-50">สร้างรายการใหม่</button>
	</header>

	{#if errorMessage}
		<div class="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
	{/if}

	<section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
		<form onsubmit={(event) => { event.preventDefault(); saveShip(); }} class="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<h2 class="text-xl font-bold text-plum">{editingId ? 'แก้ไข Ship' : 'เพิ่ม Ship'}</h2>

			<label class="block text-sm font-medium text-gray-700">ชื่อ Ship
				<input bind:value={form.name} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" placeholder="เช่น หลิงออม" />
			</label>
			<label class="block text-sm font-medium text-gray-700">Slug
				<input bind:value={form.slug} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" placeholder="lingorm" />
			</label>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block text-sm font-medium text-gray-700">ศิลปินคนที่ 1
					<select bind:value={form.artist1Id} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm">
						<option value="">เลือกศิลปิน</option>
						{#each artists as artist}<option value={artist.id}>{artist.nickname} ({artist.fullNameEn})</option>{/each}
					</select>
				</label>
				<label class="block text-sm font-medium text-gray-700">ศิลปินคนที่ 2
					<select bind:value={form.artist2Id} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm">
						<option value="">เลือกศิลปิน</option>
						{#each artists as artist}<option value={artist.id}>{artist.nickname} ({artist.fullNameEn})</option>{/each}
					</select>
				</label>
			</div>
			<label class="block text-sm font-medium text-gray-700">รูปภาพ
				<input bind:value={form.imageUrl} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" placeholder="https://..." />
			</label>
			<label class="block text-sm font-medium text-gray-700">คำอธิบาย
				<textarea bind:value={form.description} rows="4" class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm"></textarea>
			</label>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block text-sm font-medium text-gray-700">วันที่เริ่มต้น
					<input bind:value={form.startedAt} type="date" class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" />
				</label>
				<label class="block text-sm font-medium text-gray-700">Hashtags
					<input bind:value={form.hashtags} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" placeholder="lingorm, ใจซ่อนรัก" />
				</label>
			</div>

			<div class="space-y-2">
				<p class="text-sm font-medium text-gray-700">ผลงานร่วมกัน</p>
				<div class="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-3">
					{#each seriesOptions as item}
						<label class="flex items-center gap-2 text-sm text-gray-700">
							<input type="checkbox" checked={form.seriesIds.includes(item.id)} onchange={() => toggleSeries(item.id)} />
							<span>{item.title}{item.titleTh ? ` — ${item.titleTh}` : ''}</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="flex flex-wrap gap-4">
				<label class="flex items-center gap-2 text-sm text-gray-700"><input bind:checked={form.isPublished} type="checkbox" /> เผยแพร่</label>
				<label class="flex items-center gap-2 text-sm text-gray-700"><input bind:checked={form.isFeatured} type="checkbox" /> Featured</label>
			</div>

			<div class="flex gap-3">
				<button disabled={saving} type="submit" class="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
				{#if editingId}<button type="button" onclick={resetForm} class="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">ยกเลิก</button>{/if}
			</div>
		</form>

		<section class="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 class="text-xl font-bold text-plum">รายการ Ships</h2>
				<input bind:value={search} oninput={loadShips} class="rounded-xl border-gray-200 px-3 py-2 text-sm shadow-sm" placeholder="ค้นหา" />
			</div>
			{#if loading}
				<p class="text-sm text-gray-500">กำลังโหลด...</p>
			{:else if ships.length === 0}
				<p class="text-sm text-gray-500">ยังไม่มี Ships</p>
			{:else}
				<div class="divide-y divide-gray-100">
					{#each ships as ship}
						<div class="flex items-center justify-between gap-4 py-3">
							<div>
								<p class="font-semibold text-plum">{ship.name}</p>
								<p class="text-sm text-gray-500">{ship.artist1Name} × {ship.artist2Name}</p>
								<p class="text-xs text-gray-400">/{ship.slug} · {ship.isPublished ? 'เผยแพร่' : 'ฉบับร่าง'}{ship.isFeatured ? ' · Featured' : ''}</p>
							</div>
							<div class="flex gap-2">
								<button type="button" onclick={() => editShip(ship.id)} class="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700">แก้ไข</button>
								<button type="button" onclick={() => deleteShip(ship.id)} class="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">ลบถาวร</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</section>
</div>
```

- [ ] **Step 4: Verify admin reference APIs shape**

Open the actual `src/routes/api/admin/artists/+server.ts` response shape. If it returns `data` items with different field names than `id`, `nickname`, and `fullNameEn`, adjust the `ArtistOption` mapping in `loadReferences()` so the dropdown labels render correctly.

---

## Task 8: Add Localization Messages

**Files:**
- Modify: `messages/th.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add Thai messages**

Add these keys near the other nav/list keys in `messages/th.json`:

```json
"nav_ships": "Ships",
"ships_search_placeholder": "ค้นหาชื่อคู่จิ้นหรือศิลปิน...",
"ships_search_label": "ค้นหา Ships",
"ships_heading_plain": "คู่จิ้น",
"ships_heading_accent": "ทั้งหมด",
"ships_subtitle": "รวม Ships คู่จิ้น GL พร้อมศิลปินและผลงานร่วมกัน",
"ships_empty_title": "ไม่พบ Ships",
"ships_empty_search_prompt": "ลองค้นหาด้วยคำอื่น หรือกลับมาดูใหม่ภายหลัง",
"ships_shared_works": "ผลงานร่วมกัน",
"ships_featured": "Featured",
"ships_series_count": "{count} ผลงานร่วมกัน",
"ships_detail_empty_series": "ยังไม่มีผลงานร่วมกันในระบบ",
"explore_ships_seo_title": "สำรวจ Ships คู่จิ้น GL | GL-Orbit",
"explore_ships_seo_description": "สำรวจ Ships คู่จิ้น GL พร้อมศิลปินและผลงานร่วมกัน"
```

Keep valid JSON commas. Do not leave a trailing comma before the closing brace.

- [ ] **Step 2: Add English messages**

Add corresponding keys in `messages/en.json`:

```json
"nav_ships": "Ships",
"ships_search_placeholder": "Search ships or artists...",
"ships_search_label": "Search ships",
"ships_heading_plain": "Ships",
"ships_heading_accent": "all",
"ships_subtitle": "GL ships with artists and shared works",
"ships_empty_title": "No ships found",
"ships_empty_search_prompt": "Try another search term or check back later",
"ships_shared_works": "Shared works",
"ships_featured": "Featured",
"ships_series_count": "{count} shared works",
"ships_detail_empty_series": "No shared works in the system yet",
"explore_ships_seo_title": "Explore GL Ships | GL-Orbit",
"explore_ships_seo_description": "Explore GL ships with artists and shared works"
```

- [ ] **Step 3: Replace hardcoded copy where practical**

In pages created earlier, replace hardcoded strings with `m.*()` calls for keys added in this task when the string exactly matches the key purpose. Keep Thai-only admin validation copy in API routes.

---

## Task 9: Update Long-List Layout Behavior

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/+layout.svelte`

- [ ] **Step 1: Locate long-list/back-to-top condition**

Open `src/routes/[lang=lang]/(app)/+layout.svelte` and find the condition that includes `/series`, `/artists`, and `/explore/*` paths.

- [ ] **Step 2: Add `/ships`**

If the condition is a derived expression like this:

```ts
const showBackToTop = $derived(page.url.pathname.includes('/series') || page.url.pathname.includes('/artists') || page.url.pathname.includes('/explore'));
```

Change it to:

```ts
const showBackToTop = $derived(page.url.pathname.includes('/series') || page.url.pathname.includes('/artists') || page.url.pathname.includes('/ships') || page.url.pathname.includes('/explore'));
```

If the actual condition has a different name, preserve the existing name and only add the `/ships` path check.

---

## Task 10: Manual Verification and Type Check

**Files:**
- No source changes unless diagnostics require fixes.

- [ ] **Step 1: Run type and Svelte check**

Run:

```bash
npm run check
```

Expected: command completes without TypeScript or Svelte diagnostics.

- [ ] **Step 2: Fix diagnostics**

If `npm run check` reports diagnostics, fix the exact files named by the output. Common expected fixes:

```text
- Remove unused imports from API route files.
- Replace incorrect route data property names from PageData.
- Adjust Drizzle alias syntax if joining artists twice fails.
- Replace hardcoded message calls if Paraglide generated names differ.
```

- [ ] **Step 3: Run check again**

Run:

```bash
npm run check
```

Expected: no diagnostics.

- [ ] **Step 4: Confirm generated files exist**

Confirm these paths exist:

```text
src/lib/server/ships/listing.ts
src/lib/server/ships/detail.ts
src/routes/[lang=lang]/(app)/ships/+page.server.ts
src/routes/[lang=lang]/(app)/ships/+page.svelte
src/routes/[lang=lang]/(app)/ships/[id]/+page.server.ts
src/routes/[lang=lang]/(app)/ships/[id]/+page.svelte
src/routes/[lang=lang]/(app)/explore/ships/+page.server.ts
src/routes/[lang=lang]/(app)/explore/ships/+page.svelte
src/routes/api/admin/ships/+server.ts
src/routes/api/admin/ships/[id]/+server.ts
src/routes/api/ships/+server.ts
src/routes/api/explore/ships/+server.ts
```

---

## Self-Review

### Spec coverage

- Database schema for `ships` and `ship_series`: Task 1.
- Public `/ships` and `/ships/[id-or-slug]`: Task 3.
- Explore `/explore/ships` and tab: Task 5.
- Admin `/admin/ships`: Task 7.
- Admin APIs with hard delete: Task 6.
- Localization: Task 8.
- Navigation/back-to-top: Task 9.
- Automated tests excluded: Scope Notes and Task 10 only use type/Svelte checks, not test suites.

### Placeholder scan

This plan contains no deferred implementation placeholders. Where final implementation may need adjustment, the plan gives the exact condition and replacement behavior.

### Type consistency

- Public list route returns `ships`, `filters`, and `seo`; Svelte page uses `data.ships`, `data.filters`, and `data.seo`.
- Public detail route returns `ship` and `seo`; Svelte page uses `data.ship` and `data.seo`.
- Admin APIs use `ships` and `shipSeries` exports from schema.
- Hard delete uses `db.delete(ships)` and cascade deletes `ship_series` rows via FK.
