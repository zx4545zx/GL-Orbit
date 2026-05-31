---
date: 2026-05-31
topic: "API-based Search & Filter for Series Listing with SEO"
status: validated
---

# API-based Search & Filter for Series Listing with SEO

## Problem Statement

The series listing page (`/series`) currently performs search and filtering entirely on the frontend. All series data is loaded via API, then filtered in-browser using JavaScript. This creates three critical problems:

1. **Search is incomplete** — Users can only search through already-loaded pages (20-40-60 items), not the full database
2. **No SEO value** — Filtered views like "ONGOING series" or search results have no crawlable URLs, so Google sees only the unfiltered list
3. **Poor UX on large datasets** — As the database grows, client-side filtering becomes slower and less accurate

We need to move search and filter logic to the API/backend while making filtered views SEO-friendly and crawlable.

## Constraints

- Must use existing tech stack: SvelteKit 2.x, Drizzle ORM, PostgreSQL (Neon)
- Must preserve existing UI/UX patterns (glass-morphism cards, status pills, "Load More" button)
- Must maintain Svelte 5 Runes (`$state`, `$derived`)
- Must support soft-deleted records (`deletedAt IS NULL`)
- Must use `getDb()` for all database queries (never the `db` proxy)
- SEO meta tags must be server-rendered (not client-side injected)
- Search result pages must have `noindex` to avoid thin content penalties

## Approach

**Chosen: Server Load + URL Query Params with API Pagination**

We convert the client-side load (`+page.ts`) to a server load (`+page.server.ts`) that reads filter parameters from the URL query string. The server queries the database with filters applied, then renders the initial page with SEO-ready meta tags. Client-side "Load More" continues to fetch additional pages via the existing API endpoint, but now passes the same filter parameters.

**Why this approach:**
- URL becomes the source of truth for filter state → refresh-safe, shareable, crawlable
- Google can index `/series?status=ongoing` as a distinct page
- Server-rendered meta tags (title, description, OG, schema) for every filter combination
- Minimal refactor — most UI code stays the same
- Maintains the existing "Load More" UX pattern

**Rejected alternatives:**
- **Pure API approach** (add params to `/api/series` only): No SEO benefit — Google can't execute JavaScript filters
- **Hybrid SSR + client state**: Too complex, two sources of truth for filter state

## Architecture

```
Browser Request
    │
    ▼
/series?search=gap&status=ongoing
    │
    ▼
+page.server.ts (NEW)
    ├── Read url.searchParams
    ├── Validate & normalize params
    ├── Build Drizzle query with WHERE clauses
    ├── Execute: SELECT count(*) + SELECT ... LIMIT 20 OFFSET 0
    ├── Build SEO meta (title, description, robots, canonical)
    ├── Build JSON-LD schema (BreadcrumbList + ItemList)
    └── Return { items, total, search, status, meta }
    │
    ▼
+page.svelte (MODIFIED)
    ├── Receives data from server load
    ├── Renders meta tags via <svelte:head>
    ├── Renders search/filter UI with current values
    ├── On user input: debounce 300ms → goto() with replaceState
    └── "Load More": fetch /api/series?search=gap&status=ongoing&page=2
         │
         ▼
    api/series/+server.ts (MODIFIED)
         ├── Read query params (same validation as server load)
         ├── Build same Drizzle query
         ├── Cache result with param-aware key
         └── Return { items, total, page, limit }
```

## Components

### 1. `+page.server.ts` (NEW)

**Responsibilities:**
- Parse and validate URL query parameters (`search`, `status`)
- Execute filtered database query (count + paginated select)
- Build SEO metadata object for `<svelte:head>`
- Build JSON-LD structured data

**Key behaviors:**
- `search`: trim whitespace, max 100 chars, escape SQL wildcards (`%`, `_`)
- `status`: validate against enum `['all', 'ongoing', 'upcoming', 'ended']`, default `'all'`
- Returns `null` for `search` if empty/whitespace-only (so UI knows no active search)

**SEO metadata rules:**
- Title: `ซีรีส์ GL [filter_label] | GL-Orbit`
- Description: `รวมซีรีส์ Girls' Love [filter_desc] พร้อมตารางฉาย`
- Robots: `noindex, follow` if `search` param exists; `index, follow` otherwise
- Canonical: self-referencing URL

### 2. `api/series/+server.ts` (MODIFIED)

**Responsibilities:**
- Accept `search`, `status`, and `page` query parameters
- Execute the same filtered query as `+page.server.ts`
- Cache results with a composite cache key including all params

**Changes from current:**
- Add `search` and `status` param parsing (same validation logic)
- Add WHERE clauses for text search and status filter
- Update cache key to `api:series:search=${search}:status=${status}:page=${page}`
- Share query-building logic with `+page.server.ts` (extract to shared utility)

### 3. `+page.svelte` (MODIFIED)

**Responsibilities:**
- Display series grid from server-loaded data
- Render `<svelte:head>` with dynamic meta tags from `data.meta`
- Handle user input for search and status filter
- Debounce URL updates (300ms) to avoid excessive server requests while typing
- Continue "Load More" pattern but pass current filter params to API

**Key behaviors:**
- Search input: controlled component, updates URL via `goto()` with `replaceState: true`
- Status pills: active state derived from URL param, updates URL on click
- "Load More" button: fetches next page with same `search` + `status` params
- Loading state: skeleton cards while SvelteKit re-runs `load` after URL change
- Empty state: context-aware message ("ไม่พบซีรีส์ที่ตรงกับ 'gap'")

### 4. Shared Query Builder (NEW)

**Responsibilities:**
- Encapsulate the Drizzle query construction to avoid duplication between `+page.server.ts` and `+server.ts`
- Accept filter params and return `{ whereClauses, orderBy }`

**Location:** `src/lib/server/db/queries/series.ts` (new file)

### 5. SEO Meta Builder (NEW)

**Responsibilities:**
- Generate title, description, robots, canonical, and Open Graph tags based on filter state
- Generate JSON-LD BreadcrumbList and ItemList schema

**Location:** Inline in `+page.server.ts` or `src/lib/server/seo/series.ts`

## Data Flow

### Initial Page Load (Server-Side)

```
User visits /series?status=ongoing
    │
    ▼
SvelteKit server
    │
    ▼
+page.server.ts
    ├── searchParams.get('status') → 'ongoing'
    ├── searchParams.get('search') → null
    ├── Build query: WHERE status='ONGOING' AND deletedAt IS NULL
    ├── Execute: SELECT count(*) → 45 total
    ├── Execute: SELECT ... LIMIT 20 OFFSET 0 → 20 items
    ├── Build meta:
    │   title: 'ซีรีส์ GL กำลังฉาย | GL-Orbit'
    │   robots: 'index, follow'
    │   canonical: 'https://gl-orbit.com/series?status=ongoing'
    ├── Build JSON-LD:
    │   BreadcrumbList (Home → Series)
    │   ItemList (20 TVSeries items)
    └── Return data object
    │
    ▼
+page.svelte renders with data
    ├── <svelte:head> injects meta tags
    ├── Search bar shows empty input
    ├── Status pill "กำลังฉาย" is active
    └── Grid shows 20 ongoing series cards
```

### Filter Change (Client-Side)

```
User types "gap" in search box
    │
    ▼
Debounce 300ms
    │
    ▼
goto('/series?search=gap&status=ongoing', { replaceState: true })
    │
    ▼
SvelteKit re-runs +page.server.ts
    ├── searchParams.get('search') → 'gap'
    ├── Build query: WHERE (titleTh ILIKE '%gap%' OR titleEn ILIKE '%gap%') AND status='ONGOING'
    ├── Execute queries
    ├── Build meta:
    │   title: 'ผลการค้นหา "gap" | GL-Orbit'
    │   robots: 'noindex, follow'  ← search results are noindex
    │   canonical: 'https://gl-orbit.com/series?search=gap&status=ongoing'
    └── Return data
    │
    ▼
+page.svelte re-renders
    ├── <svelte:head> updates meta tags
    └── Grid shows filtered results
```

### Load More (Client-Side Fetch)

```
User clicks "โหลดเพิ่ม"
    │
    ▼
fetch('/api/series?search=gap&status=ongoing&page=2')
    │
    ▼
+server.ts
    ├── Parse params (same validation)
    ├── Check cache: miss
    ├── Execute query with OFFSET 20
    ├── Cache result
    └── Return { items: [...], total: 45, page: 2, limit: 20 }
    │
    ▼
Append items to allSeries array
    │
    ▼
Grid updates with 40 total items
```

## Error Handling

### Invalid Parameters
- **Invalid `status` value** (e.g., `?status=invalid`): Silently fall back to `'all'`, log warning
- **Overlong `search` query** (>100 chars): Truncate to 100 chars before querying
- **Empty/whitespace `search`**: Treat as no search (redirect to URL without `search` param)

### Database Errors
- **Connection failure**: Return empty items array with `error` flag, render friendly message "ไม่สามารถโหลดข้อมูลได้"
- **Query timeout**: Same as above

### API Errors (Load More)
- **Network error**: Show inline error message below grid, keep existing items
- **Non-200 response**: Log error, show "โหลดไม่สำเร็จ กรุณาลองใหม่" with retry button

## Testing Strategy

### Unit Tests (if test suite exists)
- Query builder: test WHERE clause generation for all filter combinations
- Meta builder: test title/description/robots for each filter state
- Param validation: test edge cases (empty, too long, invalid status)

### Manual Testing Checklist
- [ ] `/series` loads with 20 items, no filter
- [ ] `/series?status=ongoing` shows only ONGOING series
- [ ] `/series?search=gap` filters by text across titleTh, titleEn, studio name
- [ ] Combined filter `/series?search=gap&status=ongoing` works
- [ ] View source shows correct `<title>` and `<meta name="description">`
- [ ] View source shows `robots: noindex` when `search` param present
- [ ] View source shows `robots: index` when only `status` param present
- [ ] JSON-LD schema present in view source
- [ ] Canonical URL correct in all cases
- [ ] "Load More" passes current filter params
- [ ] URL updates with debounce while typing
- [ ] Browser back/forward works correctly
- [ ] Empty search state shows appropriate message
- [ ] Invalid status param falls back gracefully

### SEO Verification
- [ ] Google Search Console: test `/series?status=ongoing` URL inspection
- [ ] Check that `/series?search=anything` is NOT indexed
- [ ] Validate JSON-LD with Google's Rich Results Test
- [ ] Test OG tags with Facebook Sharing Debugger

## Open Questions

1. **Multi-language support**: Hreflang tags are designed for future i18n. Currently the site is Thai-only; implement `hreflang="th"` now or defer?
   - *Decision: Implement now as it's trivial and future-proofs the site.*

2. **ItemList schema depth**: Should each series in ItemList include full `TVSeries` schema with `actor`, `episode` arrays, or just basic `name` + `image`?
   - *Decision: Basic `name` + `image` + `productionCompany` only. Full detail schema belongs on individual series detail pages.*

3. **Cache invalidation**: The in-memory cache uses 30s TTL. When a series is updated in admin, cached listing pages may be stale for up to 30s. Is this acceptable?
   - *Decision: Acceptable for now. Future enhancement: add cache invalidation hook in admin mutations.*
