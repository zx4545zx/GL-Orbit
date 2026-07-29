# Series Videos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ordered bilingual YouTube trailer and pilot clips to series, with safe server validation, protected admin management, and an accessible localized public player.

**Architecture:** Store videos in an additive `series_videos` child table while keeping accepted video types in one application registry. Route all writes through shared server validation and scoped Drizzle mutations, invalidate only the affected public series cache entry, and give public components only stored trusted YouTube IDs. Keep admin and public rendering in focused Svelte 5 components so mutation behavior and player selection can be tested independently.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript 5.8 strict/NodeNext, Drizzle ORM/PostgreSQL, Paraglide Thai/English messages, Vitest 4, Testing Library Svelte.

## Global Constraints

- Initial registered types are exactly `TRAILER` then `PILOT`; adding a future type changes the registry and translations, never the PostgreSQL table type.
- `series_videos.type` is `varchar(32)` with no PostgreSQL enum and no type check constraint.
- Both `title_th` and `title_en` are required, trimmed, non-empty, and at most 255 characters.
- Accept only HTTPS `youtube.com/watch?v=ID`, `www.youtube.com/watch?v=ID`, `m.youtube.com/watch?v=ID`, `youtu.be/ID`, and equivalent `/shorts/ID` URLs with exact approved hosts and IDs matching `[A-Za-z0-9_-]{11}`.
- Reject credentials, custom ports, HTTP, host lookalikes, unsupported paths, malformed/missing IDs, and playlists without a video ID; validation makes no network request.
- Persist only `https://www.youtube.com/watch?v=ID`; build public embeds only from stored `youtubeVideoId` as `https://www.youtube-nocookie.com/embed/ID?playsinline=1&rel=0`.
- Keep episode-level `episodes.trailer_url` and its existing public behavior unchanged.
- Every admin method independently requires `ADMIN`; every read/write scopes resources to the requested series.
- Mutation error codes are exactly `INVALID_TYPE`, `INVALID_TITLE`, `INVALID_YOUTUBE_URL`, `DUPLICATE_VIDEO`, `INVALID_REORDER`, `SERIES_NOT_FOUND`, and `VIDEO_NOT_FOUND` with specified 400/403/404/409/500 status behavior.
- Admin add/delete/reorder is pessimistic, immediate-save, disables affected controls while pending, confirms deletion, reports status, and refreshes editor data only after success.
- Public video controls never autoplay and use rectangular Orbit Editorial surfaces, visible focus, keyboard-operable buttons, and at least 44×44px targets.
- Generate one additive Drizzle migration after `0026_damp_morbius.sql`; review it and metadata, but never run `npm run db:push` or apply it to any configured database without explicit approval.
- Follow TDD: add a focused failing test, verify the intended failure, add minimal production code, then rerun that focused test before proceeding.

---

## File Map

**Create**

- `src/lib/series-videos/registry.ts` — single shared registry, type guard, labels, and deterministic registry-aware ordering.
- `src/lib/series-videos/registry.test.ts` — registry order, labels, extension behavior, and deterministic sorting tests.
- `src/lib/server/series-videos/youtube.ts` — pure YouTube URL parser/canonicalizer.
- `src/lib/server/series-videos/youtube.test.ts` — accepted and rejected URL matrix.
- `src/lib/server/series-videos/mutations.ts` — scoped add/reorder/delete operations and stable domain errors.
- `src/lib/server/series-videos/mutations.test.ts` — append, duplicate, exact-set reorder, transaction, scoping, and cache invalidation tests.
- `src/routes/api/admin/series/[id]/videos/+server.ts` — ADMIN-protected GET/POST/PUT collection route.
- `src/routes/api/admin/series/[id]/videos/server.test.ts` — collection route auth, validation, response/status, and failure-safety tests.
- `src/routes/api/admin/series/[id]/videos/[seriesVideoId]/+server.ts` — ADMIN-protected scoped DELETE route.
- `src/routes/api/admin/series/[id]/videos/[seriesVideoId]/server.test.ts` — delete auth, scoped 404, and response tests.
- `src/lib/components/admin/SeriesVideosSection.svelte` — immediate-save video manager.
- `src/lib/components/admin/SeriesVideosSection.test.ts` — form retention, pending, confirmation, reorder boundaries, refresh, and accessibility tests.
- `src/lib/components/series/SeriesVideoPlayer.svelte` — localized grouped public player using trusted IDs.
- `src/lib/components/series/SeriesVideoPlayer.test.ts` — empty/group/selection/embed/accessibility tests.
- `src/lib/server/queries/series-detail.test.ts` — public query shape, deterministic video order, cache, and deleted-series behavior.
- `src/lib/server/queries.test.ts` — admin full-series video shape and deterministic registry order.
- `drizzle/0027_series_videos.sql` — generated additive DDL only.
- `drizzle/meta/0027_snapshot.json` — generated Drizzle schema snapshot.

**Modify**

- `src/lib/server/db/schema.ts` — export `seriesVideos` table.
- `src/lib/server/db/schema.test.ts` — assert columns, defaults, cascade FK, uniqueness, index, and additive migration SQL.
- `drizzle/meta/_journal.json` — generated `0027_series_videos` journal entry.
- `src/lib/server/cache.ts` — add exact-key cache invalidation.
- `src/lib/server/queries.ts` — include ordered videos in `getSeriesFull()`.
- `src/lib/server/queries/series-detail.ts` — add one independent ordered video query and `SeriesDetail.videos`.
- `src/lib/admin/editor-types.ts` — add shared editor-facing video types and API error code.
- `src/lib/admin/editor-api.ts` — add typed video mutation methods and preserve stable error codes.
- `src/lib/components/ConfirmDialog.svelte` — consume the existing shared accessible destructive-confirmation dialog unchanged.
- `src/routes/[lang=lang]/admin/series/[id]/+page.svelte` — add top-level Videos tab/count and manager component.
- `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte` — replace mock video section/state with `SeriesVideoPlayer` and retain episode trailer logic.
- `messages/th.json` — Thai video manager/player copy.
- `messages/en.json` — matching English keys.

Generated `src/lib/i18n/paraglide/**` files may change when `npm run i18n:compile` runs; do not hand-edit them.

### Task 1: Shared video type registry and YouTube validator

**Files:**
- Create: `src/lib/series-videos/registry.ts`
- Create: `src/lib/series-videos/registry.test.ts`
- Create: `src/lib/server/series-videos/youtube.ts`
- Create: `src/lib/server/series-videos/youtube.test.ts`

**Interfaces:**
- Produces: `SeriesVideoType`, `SeriesVideoRegistryEntry`, `SERIES_VIDEO_TYPES`, `isSeriesVideoType(value)`, `getSeriesVideoType(value)`, `seriesVideoTypeLabel(type, lang)`, and `sortSeriesVideosByRegistry(videos)`.
- Produces: `parseYouTubeUrl(rawUrl): { canonicalUrl: string; videoId: string } | null`.
- Consumes: no database, browser, network, or generated route types.

- [ ] **Step 1: Write registry tests first**

Add tests that assert the exact registry and generic ordering contract:

```ts
expect(SERIES_VIDEO_TYPES.map(({ key }) => key)).toEqual(['TRAILER', 'PILOT']);
expect(seriesVideoTypeLabel('TRAILER', 'th')).toBe('ตัวอย่าง');
expect(seriesVideoTypeLabel('PILOT', 'en')).toBe('Pilot');
expect(isSeriesVideoType('TRAILER')).toBe(true);
expect(isSeriesVideoType('TEASER')).toBe(false);
expect(
  sortSeriesVideosByRegistry([
    { id: 'b', type: 'PILOT', sortOrder: 0, createdAt: new Date('2026-01-01') },
    { id: 'c', type: 'TRAILER', sortOrder: 0, createdAt: new Date('2026-01-01') },
    { id: 'a', type: 'TRAILER', sortOrder: 0, createdAt: new Date('2026-01-01') }
  ]).map(({ id }) => id)
).toEqual(['a', 'c', 'b']);
```

The sorter input must be generic over `{ id: string; type: SeriesVideoType; sortOrder: number; createdAt: Date }`, return a copied array, and compare registry order, `sortOrder`, `createdAt.getTime()`, then `id.localeCompare()`.

- [ ] **Step 2: Run registry tests and verify failure**

Run: `npm test -- src/lib/series-videos/registry.test.ts`

Expected: FAIL because `registry.ts` does not exist.

- [ ] **Step 3: Implement the registry exactly once**

Use this public shape:

```ts
export const SERIES_VIDEO_TYPES = [
  { key: 'TRAILER', labelTh: 'ตัวอย่าง', labelEn: 'Trailer' },
  { key: 'PILOT', labelTh: 'ไพล็อต', labelEn: 'Pilot' }
] as const satisfies readonly SeriesVideoRegistryEntry[];

export type SeriesVideoType = (typeof SERIES_VIDEO_TYPES)[number]['key'];
export interface SeriesVideoRegistryEntry {
  key: string;
  labelTh: string;
  labelEn: string;
}
```

`getSeriesVideoType(value: unknown)` returns the matching registry entry or `null`; `isSeriesVideoType` narrows to `SeriesVideoType`; `seriesVideoTypeLabel` accepts `'th' | 'en'`. Do not duplicate `TRAILER`/`PILOT` arrays in API or components.

- [ ] **Step 4: Run registry tests and verify pass**

Run: `npm test -- src/lib/series-videos/registry.test.ts`

Expected: PASS; the source array remains unchanged after sorting.

- [ ] **Step 5: Write the YouTube parser table tests**

Cover these successful inputs and exact outputs:

```ts
const accepted = [
  'https://youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=orbit',
  'https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ?t=12',
  'https://youtube.com/shorts/dQw4w9WgXcQ?si=tracking',
  'https://www.youtube.com/shorts/dQw4w9WgXcQ',
  'https://m.youtube.com/shorts/dQw4w9WgXcQ'
];
for (const input of accepted) {
  expect(parseYouTubeUrl(input)).toEqual({
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ'
  });
}
```

Reject empty input, `http://`, username/password credentials, custom ports such as `:8443`, `youtube.com.evil.test`, `evil.youtube.com`, `music.youtube.com`, `youtube-nocookie.com`, `/embed/ID`, `/live/ID`, `/watch/ID`, `/shorts/ID/extra`, `youtu.be/ID/extra`, malformed IDs of 10/12 characters, percent-encoded IDs, fragments used as IDs, `/playlist?list=...`, and `/watch?list=...` without `v`.

- [ ] **Step 6: Run parser tests and verify failure**

Run: `npm test -- src/lib/server/series-videos/youtube.test.ts`

Expected: FAIL because `youtube.ts` does not exist.

- [ ] **Step 7: Implement the pure parser**

Implement `parseYouTubeUrl(rawUrl: string)` with `new URL(rawUrl)` inside `try/catch`, exact `protocol === 'https:'`, empty `username`/`password`, empty `port`, an exact hostname set, exact path shapes, and `/^[A-Za-z0-9_-]{11}$/`. For `watch`, read only `searchParams.get('v')`; for `youtu.be` and `shorts`, require exactly one ID path segment after the route prefix. Return `null` on every rejection and never call `fetch`.

- [ ] **Step 8: Run both focused suites**

Run: `npm test -- src/lib/series-videos/registry.test.ts src/lib/server/series-videos/youtube.test.ts`

Expected: PASS with all accepted forms canonicalized and all unsafe/unsupported forms rejected.

### Task 2: Additive Drizzle schema and generated migration

**Files:**
- Modify: `src/lib/server/db/schema.ts:238-260`
- Modify: `src/lib/server/db/schema.test.ts`
- Create: `drizzle/0027_series_videos.sql` via Drizzle Kit
- Create: `drizzle/meta/0027_snapshot.json` via Drizzle Kit
- Modify: `drizzle/meta/_journal.json` via Drizzle Kit

**Interfaces:**
- Produces: exported Drizzle table `seriesVideos` with inferred select/insert types available through `typeof seriesVideos.$inferSelect` and `typeof seriesVideos.$inferInsert`.
- Consumes: existing `series.id`, existing `unique` and `index` imports.

- [ ] **Step 1: Add failing schema-configuration assertions**

Import `seriesVideos` and assert through `getTableConfig(seriesVideos)`:

- columns are exactly `id`, `series_id`, `type`, `youtube_url`, `youtube_video_id`, `title_th`, `title_en`, `sort_order`, `created_at`;
- `id` is UUID, primary, non-null, and default-generated;
- `series_id`, `type`, `youtube_url`, `youtube_video_id`, both titles, `sort_order`, and `created_at` are non-null;
- `type` is `varchar(32)`, `youtube_video_id` is `varchar(32)`, and titles are `varchar(255)`;
- `sort_order` defaults to `0`, and `created_at` has a default and timezone-aware timestamp SQL type;
- FK references `series`, uses `ON DELETE CASCADE`;
- unique constraint name is `series_videos_series_video_unique` over `(series_id, youtube_video_id)`;
- index name is `series_videos_order_idx` over `(series_id, type, sort_order, created_at)`;
- there is no enum/check constraint for video type.

- [ ] **Step 2: Run schema test and verify failure**

Run: `npm test -- src/lib/server/db/schema.test.ts`

Expected: FAIL because `seriesVideos` is not exported.

- [ ] **Step 3: Add the schema table**

Add immediately after `seriesGalleryImages`:

```ts
export const seriesVideos = pgTable('series_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(),
  youtubeUrl: text('youtube_url').notNull(),
  youtubeVideoId: varchar('youtube_video_id', { length: 32 }).notNull(),
  titleTh: varchar('title_th', { length: 255 }).notNull(),
  titleEn: varchar('title_en', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  seriesVideoUnique: unique('series_videos_series_video_unique').on(table.seriesId, table.youtubeVideoId),
  orderedReadIndex: index('series_videos_order_idx').on(table.seriesId, table.type, table.sortOrder, table.createdAt)
}));
```

- [ ] **Step 4: Verify schema assertions pass before generation**

Run: `npm test -- src/lib/server/db/schema.test.ts`

Expected: PASS for runtime schema assertions.

- [ ] **Step 5: Generate, do not apply, the named migration**

Run: `npm run db:generate -- --name series_videos`

Expected: creates `drizzle/0027_series_videos.sql`, `drizzle/meta/0027_snapshot.json`, and appends the `0027_series_videos` entry to `drizzle/meta/_journal.json`. Do **not** run `npm run db:push`.

- [ ] **Step 6: Add migration-content regression assertions**

Read `drizzle/0027_series_videos.sql` in `schema.test.ts` and assert it contains only the new table DDL, cascade FK, named unique constraint, and named ordered index. Assert it does not contain `ALTER TABLE "series"`, `ALTER TABLE "episodes"`, `UPDATE`, `DELETE FROM`, `INSERT INTO`, `trailer_url`, or `DROP`.

- [ ] **Step 7: Review generated metadata and run focused validation**

Run: `npm test -- src/lib/server/db/schema.test.ts && git diff -- drizzle/0027_series_videos.sql drizzle/meta/0027_snapshot.json drizzle/meta/_journal.json`

Expected: test PASS; diff shows one new table and its own FK/unique/index only, journal index `27`, and no existing table/data mutation. Record that no database command besides schema generation ran.

### Task 3: Typed query shapes and exact cache invalidation

**Files:**
- Modify: `src/lib/server/cache.ts`
- Modify: `src/lib/admin/editor-types.ts`
- Modify: `src/lib/server/queries.ts`
- Create: `src/lib/server/queries.test.ts`
- Modify: `src/lib/server/queries/series-detail.ts`
- Create: `src/lib/server/queries/series-detail.test.ts`

**Interfaces:**
- Produces: `deleteCached(key: string): boolean`.
- Produces: `SeriesVideo` with `id`, `seriesId`, `type`, `youtubeUrl`, `youtubeVideoId`, `titleTh`, `titleEn`, `sortOrder`, `createdAt`.
- Produces: `SeriesFull.videos: SeriesVideo[]` and `SeriesDetail.videos: PublicSeriesVideo[]`.
- Consumes: `seriesVideos`, `SeriesVideoType`, and `sortSeriesVideosByRegistry`.

- [ ] **Step 1: Add failing cache/query tests**

Test `deleteCached` by setting two keys, deleting `query:series:series-1`, and proving `series-2` remains. In query tests, use the existing Vitest Drizzle-chain mock style and assert:

- `getSeriesFull(db, id)` includes all trusted stored fields in `videos`;
- videos are registry-grouped and deterministically ordered even when mocked rows arrive as PILOT first and with tied `sortOrder`/`createdAt`;
- `getSeriesFull` still returns `null` for a soft-deleted series;
- `getSeriesDetail(id)` runs one additional independent video select, uses `createdAt` internally for tie ordering, and exposes only `id`, `type`, `youtubeUrl`, `youtubeVideoId`, `titleTh`, `titleEn`, and `sortOrder`;
- a missing/soft-deleted series returns `null` and does not cache orphan video data;
- a second public call reads the cached `videos` shape.

- [ ] **Step 2: Run query tests and verify failure**

Run: `npm test -- src/lib/server/queries.test.ts src/lib/server/queries/series-detail.test.ts`

Expected: FAIL because video query fields and `deleteCached` do not exist.

- [ ] **Step 3: Add exact editor/public types**

Add to `editor-types.ts`:

```ts
import type { SeriesVideoType } from '$lib/series-videos/registry.js';

export interface SeriesVideo {
  id: string;
  seriesId: string;
  type: SeriesVideoType;
  youtubeUrl: string;
  youtubeVideoId: string;
  titleTh: string;
  titleEn: string;
  sortOrder: number;
  createdAt: Date;
}

export type SeriesVideoErrorCode =
  | 'INVALID_TYPE' | 'INVALID_TITLE' | 'INVALID_YOUTUBE_URL'
  | 'DUPLICATE_VIDEO' | 'INVALID_REORDER'
  | 'SERIES_NOT_FOUND' | 'VIDEO_NOT_FOUND';
```

Add `videos: SeriesVideo[]` to `SeriesFull` and optional `code?: SeriesVideoErrorCode` to `ApiResult` so UI can preserve stable API codes without casting.

In `series-detail.ts`, add a local/exported `PublicSeriesVideo` with the seven safe fields listed above and `videos: PublicSeriesVideo[]` to `SeriesDetail`.

- [ ] **Step 4: Implement exact-key invalidation**

Add without changing `clearCache()`:

```ts
export function deleteCached(key: string): boolean {
  return cache.delete(key);
}
```

- [ ] **Step 5: Extend both queries**

In `queries.ts`, select all `SeriesVideo` fields for `seriesId = id`, order by `sortOrder`, `createdAt`, `id`, discard rows whose string `type` is not currently registered using `isSeriesVideoType`, narrow retained rows to `SeriesVideo`, then pass them through `sortSeriesVideosByRegistry`; include `videos` in the returned `SeriesFull` object.

In `series-detail.ts`, import `seriesVideos`, add `videosPromise` beside gallery/ships as a separate independent query, select the seven public fields plus internal `createdAt`, order deterministically, include it in the existing `Promise.all`, filter/narrow through `isSeriesVideoType`, apply registry sorting, then map out `createdAt` before assigning `SeriesDetail.videos`. Update the query-count comment. Do not join videos into the main series query and do not alter episode `trailerUrl` handling.

- [ ] **Step 6: Run query tests**

Run: `npm test -- src/lib/server/queries.test.ts src/lib/server/queries/series-detail.test.ts`

Expected: PASS; admin/public shapes match their interfaces, registry order wins over alphabetical DB order, and deleted series remain excluded.

### Task 4: Scoped mutation service and stable admin API

**Files:**
- Create: `src/lib/server/series-videos/mutations.ts`
- Create: `src/lib/server/series-videos/mutations.test.ts`
- Create: `src/routes/api/admin/series/[id]/videos/+server.ts`
- Create: `src/routes/api/admin/series/[id]/videos/server.test.ts`
- Create: `src/routes/api/admin/series/[id]/videos/[seriesVideoId]/+server.ts`
- Create: `src/routes/api/admin/series/[id]/videos/[seriesVideoId]/server.test.ts`

**Interfaces:**
- Produces: `listSeriesVideos(db, seriesId): Promise<SeriesVideo[]>`.
- Produces: `createSeriesVideo(db, input): Promise<SeriesVideo>` where input is `{ seriesId; type; titleTh; titleEn; youtubeUrl }` and URL is untrusted until parsed internally.
- Produces: `reorderSeriesVideos(db, input): Promise<void>` where input is `{ seriesId; type; videoIds }`.
- Produces: `deleteSeriesVideo(db, seriesId, seriesVideoId): Promise<void>`.
- Produces: `SeriesVideoMutationError` carrying one stable `code`, safe Thai `message`, and HTTP `status`.
- Consumes: `Db`, `series`, `seriesVideos`, registry guard/sorter, `parseYouTubeUrl`, and `deleteCached`.

- [ ] **Step 1: Write mutation-service tests**

Build focused DB mocks around select/insert/update/delete and `db.transaction(async tx => ...)`. Assert:

- parent lookup requires matching non-deleted `series.id`, else `SERIES_NOT_FOUND`/404;
- type is checked only through `isSeriesVideoType`, else `INVALID_TYPE`/400;
- both titles are trimmed, required, and reject length 256 with `INVALID_TITLE`/400;
- parser failure is `INVALID_YOUTUBE_URL`/400;
- POST calculates `coalesce(max(sort_order), -1) + 1` scoped by both series and type;
- inserted values use canonical URL and server-derived ID, never a client ID;
- PostgreSQL `23505` for `series_videos_series_video_unique` maps to `DUPLICATE_VIDEO`/409 without exposing error detail;
- reorder rejects an empty array when the current group is non-empty, duplicate IDs, missing IDs, extra IDs, other-series IDs, and other-type IDs as `INVALID_REORDER`/400;
- reorder accepts `[]` only when that exact series/type group is empty;
- successful reorder performs all updates in one transaction with contiguous `0..n-1` and predicates on ID, series ID, and type;
- any validation failure occurs before updates/transaction, preserving existing order;
- delete predicates on series ID and video ID and maps zero returned rows to `VIDEO_NOT_FOUND`/404;
- successful POST, PUT, and DELETE each call `deleteCached('query:series:<seriesId>')` exactly once, after database success only.

- [ ] **Step 2: Run mutation tests and verify failure**

Run: `npm test -- src/lib/server/series-videos/mutations.test.ts`

Expected: FAIL because `mutations.ts` does not exist.

- [ ] **Step 3: Implement mutation errors and validation**

Use this stable class contract:

```ts
export class SeriesVideoMutationError extends Error {
  constructor(
    public readonly code: SeriesVideoErrorCode,
    public readonly status: 400 | 404 | 409,
    message: string
  ) { super(message); }
}
```

Use safe Thai admin messages per code. Keep malformed request JSON and wrong field types in the closest documented input code (`INVALID_TYPE`, `INVALID_TITLE`, `INVALID_YOUTUBE_URL`, or `INVALID_REORDER`). Detect only the named video unique constraint as duplicate; rethrow all other database errors for route-level 500 handling.

- [ ] **Step 4: Implement exact-set reorder transaction**

Read current IDs using `seriesId` and `type`, compare `new Set(videoIds)` size to input length, length to current rows, and membership in both directions. Only after exact equality call `db.transaction`; each update sets its array index and repeats all three predicates. Invalidate cache after transaction resolution, not inside it.

- [ ] **Step 5: Run mutation tests**

Run: `npm test -- src/lib/server/series-videos/mutations.test.ts`

Expected: PASS, including no update/cache calls on rejected reorder and no cache deletion on failed writes.

- [ ] **Step 6: Write collection-route tests before route code**

For each exported `GET`, `POST`, and `PUT`, call the handler directly. Assert missing user and role `USER` each produce 403 before `getDb`. Then assert:

- GET returns `{ success: true, data }` and maps missing parent to `{ success: false, code: 'SERIES_NOT_FOUND', error: safeMessage }`/404;
- POST passes only `type`, `titleTh`, `titleEn`, `youtubeUrl`, and path `seriesId` to the service, returns 201, and ignores any submitted `youtubeVideoId`, `canonicalUrl`, `sortOrder`, `createdAt`, or `seriesId`;
- PUT passes path `seriesId` plus `{ type, videoIds }` and returns 200;
- every known domain error preserves status/code/safe message;
- malformed JSON returns 400 with a stable documented code rather than 500;
- unexpected errors return generic `{ success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' }`/500 and never include the thrown message.

- [ ] **Step 7: Implement collection route**

Create a local `requireAdmin(locals)` called at the top of every handler and a response mapper for `SeriesVideoMutationError`. Do not rely on the localized admin page layout guard. Use `const db = await getDb()` in each handler after auth and input parsing; no async DB proxy.

- [ ] **Step 8: Write and implement DELETE route with TDD**

Test both auth failures, successful scoped deletion, `VIDEO_NOT_FOUND`/404, and generic 500 redaction. Implement `DELETE` using only `params.id` and `params.seriesVideoId`; never accept either identifier from body/query.

- [ ] **Step 9: Run all API/service tests**

Run: `npm test -- src/lib/server/series-videos/mutations.test.ts src/routes/api/admin/series/[id]/videos/server.test.ts src/routes/api/admin/series/[id]/videos/[seriesVideoId]/server.test.ts`

Expected: PASS; every method has an independent ADMIN assertion and stable safe response codes.

### Task 5: Typed editor client and admin video manager

**Files:**
- Modify: `src/lib/admin/editor-api.ts`
- Create: `src/lib/components/admin/SeriesVideosSection.svelte`
- Create: `src/lib/components/admin/SeriesVideosSection.test.ts`
- Modify: `messages/th.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces editor methods `addSeriesVideo(seriesId, body)`, `reorderSeriesVideos(seriesId, type, videoIds)`, and `removeSeriesVideo(seriesId, seriesVideoId)`.
- Produces component props `{ seriesId: string; videos: SeriesVideo[]; lang: 'th' | 'en'; onrefresh: () => void | Promise<void> }`.
- Consumes `SERIES_VIDEO_TYPES`, `seriesVideoTypeLabel`, `SeriesVideo`, `editorApi`, the existing `$lib/components/ConfirmDialog.svelte`, and Paraglide `m`.

- [ ] **Step 1: Extend API result parsing and write component tests**

Update `req()` to read both safe `error` and stable `code` on non-2xx responses. Add typed methods:

```ts
addSeriesVideo: (seriesId: string, body: {
  type: SeriesVideoType; titleTh: string; titleEn: string; youtubeUrl: string;
}) => req<{ success: true; data: SeriesVideo }>(`/api/admin/series/${seriesId}/videos`, { method: 'POST', body: JSON.stringify(body) }),
reorderSeriesVideos: (seriesId: string, type: SeriesVideoType, videoIds: string[]) =>
  req<{ success: true }>(`/api/admin/series/${seriesId}/videos`, { method: 'PUT', body: JSON.stringify({ type, videoIds }) }),
removeSeriesVideo: (seriesId: string, seriesVideoId: string) =>
  req<{ success: true }>(`/api/admin/series/${seriesId}/videos/${seriesVideoId}`, { method: 'DELETE' })
```

In jsdom component tests, mock these methods and cover:

- required native labels/fields for type, Thai title, English title, and YouTube URL;
- submit disabled while any trimmed required field is empty;
- failed add retains all submitted values and shows `role="alert"`;
- successful add clears fields, announces success through `aria-live="polite"`, and awaits `onrefresh`;
- groups appear in registry order regardless of incoming array order;
- each row shows both titles, canonical URL, localized type, and one-based position;
- top/bottom move controls are disabled at boundaries and movement never crosses type groups;
- pending add disables form; pending reorder disables that group's movement/delete controls; pending delete disables the affected row/group;
- delete opens `ConfirmDialog`, cancel sends no request, confirm sends one request;
- failed delete/reorder shows error and does not call `onrefresh`; success calls it once;
- all action controls have accessible names, visible `focus-visible` classes, rectangular styling, and `min-h-11`/44px sizing.

- [ ] **Step 2: Run component test and verify failure**

Run: `npm test -- src/lib/components/admin/SeriesVideosSection.test.ts`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Add matching Thai and English messages**

Add identical keys in both message files for: videos heading/description/count, type/title/url labels, add/add-pending, move-up/move-down, delete/delete-confirm title/delete-confirm body, empty state, saved/reordered/deleted success, generic failure, position, and localized-title descriptors. Use Thai admin copy in `th.json` and natural English equivalents in `en.json`; compile only through project commands.

- [ ] **Step 4: Implement Svelte 5 manager state**

Use `$props`, `$state`, and `$derived`; do not use `export let`. Keep four add-form states unchanged until successful POST. Track `addPending`, `pendingType`, and `pendingDeleteId` separately so only affected controls disable. Derive registry-ordered groups from props; construct reorder IDs from the current type group only. Reuse the existing `$lib/components/ConfirmDialog.svelte` instead of creating another dialog or using a raw browser confirm, so confirmation/focus behavior remains consistent, testable, and localized.

- [ ] **Step 5: Implement rectangular accessible markup**

Use semantic `<form>`, `<label>`, `<select>`, `<input required maxlength="255">`, `<button type="submit">`, group headings, and list rows. Render no decorative rounded pills/cards; use Orbit tokens/borders and square/rectangular control radius already permitted by the design system. Give all buttons at least `min-h-11`, disabled styles, and `focus-visible:outline` classes.

- [ ] **Step 6: Run admin component and i18n checks**

Run: `npm run i18n:compile && npm test -- src/lib/components/admin/SeriesVideosSection.test.ts`

Expected: compile succeeds and tests PASS with retained input on recoverable failures and refresh only after success.

### Task 6: Integrate the top-level admin Videos tab

**Files:**
- Modify: `src/routes/[lang=lang]/admin/series/[id]/+page.svelte:5-46,138-185`
- Create test coverage in: `src/lib/components/admin/SeriesVideosSection.test.ts`

**Interfaces:**
- Consumes: `data.full.videos`, `SeriesVideosSection`, and current `page.data.lang`.
- Produces: top-level tab ID `'videos'` and count `data.full.videos.length`.

- [ ] **Step 1: Add a failing source/integration assertion**

Extend the admin manager test (or add a source assertion in the same file) to require import/render of `SeriesVideosSection`, `'videos'` in `TabId`, a top-level Videos tab, `tabCount('videos')`, and props `seriesId`, `videos`, `lang`, `onrefresh`.

- [ ] **Step 2: Run focused test and verify failure**

Run: `npm test -- src/lib/components/admin/SeriesVideosSection.test.ts`

Expected: FAIL because the editor page has no Videos tab.

- [ ] **Step 3: Wire the tab without changing other editor behavior**

Import the component, extend `TabId`, append a `videos` tab with localized visible label and count, return `data.full.videos.length` from `tabCount`, and render:

```svelte
<SeriesVideosSection
  seriesId={data.full.series.id}
  videos={data.full.videos}
  lang={page.data.lang === 'en' ? 'en' : 'th'}
  onrefresh={refresh}
/>
```

Do not move Gallery out of `SeriesMainSection`, alter metadata dirty-navigation behavior, or add video data to readiness scoring unless separately requested.

- [ ] **Step 4: Run focused test**

Run: `npm test -- src/lib/components/admin/SeriesVideosSection.test.ts`

Expected: PASS and editor data refresh continues through existing `invalidateAll()`.

### Task 7: Public grouped video player and localized embed UX

**Files:**
- Create: `src/lib/components/series/SeriesVideoPlayer.svelte`
- Create: `src/lib/components/series/SeriesVideoPlayer.test.ts`
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte:23-132,445-469,1033-1122`
- Modify: `messages/th.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces component props `{ videos: PublicSeriesVideo[]; lang: 'th' | 'en' }`.
- Consumes only stored `youtubeVideoId`; it does not parse `youtubeUrl`.
- Produces embed source `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?playsinline=1&rel=0`.

- [ ] **Step 1: Write public component tests first**

Use two TRAILER clips and one PILOT clip. Assert:

- `videos=[]` renders no video section/heading/iframe;
- only non-empty type tabs render and registry order is TRAILER then PILOT;
- first clip of first group is selected initially;
- selecting PILOT selects its first clip; returning to TRAILER selects its first clip;
- selecting trailer clip 2 changes iframe/title and active button state;
- Thai uses `titleTh`, English uses `titleEn`, with no fallback because both are required;
- iframe `src` is exactly the nocookie URL with `playsinline=1&rel=0`, never contains `youtube.com/embed`, stored canonical URL, `autoplay`, or a client-parsed value;
- iframe has `loading="lazy"`, localized descriptive `title`, `referrerpolicy="strict-origin-when-cross-origin"`, exact `allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"`, and `allowfullscreen`;
- type controls expose `role="tablist"`, tabs with `aria-selected`, unique `id`/`aria-controls`, and a matching `role="tabpanel"`/`aria-labelledby`;
- clip selectors are native buttons, keyboard clickable, expose active state through `aria-pressed`, have 44px targets, and retain visible focus styling;
- rerendering for a different video list resets selection to the first clip rather than retaining a missing ID.

- [ ] **Step 2: Run public component test and verify failure**

Run: `npm test -- src/lib/components/series/SeriesVideoPlayer.test.ts`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Add public message keys**

Add matching Thai/English keys for the section heading, type-tab accessible label, clip-list accessible label, iframe title with `{title}`, and clip position label. Reuse registry labels for type names; remove use of `series_detail_video_placeholder` from this section, but leaving the old message key is harmless unless repository policy requires removing unused messages.

- [ ] **Step 4: Implement Svelte 5 selection state**

Derive non-empty groups by iterating `SERIES_VIDEO_TYPES` and filtering props by type. Keep `activeType` and `activeVideoId` in `$state`; an `$effect` keyed by the available IDs ensures the default is first type/first clip and repairs stale selection after props change. `selectType(type)` always assigns that group's first video ID. `selectVideo(id)` only accepts an ID in the active group.

- [ ] **Step 5: Implement trusted embed markup**

Build `embedSrc` only by interpolating the selected row's `youtubeVideoId`; never call `new URL`, never use `youtubeUrl` for the iframe, and never use `@html`. Render the section only when at least one group exists. Keep aspect ratio 16:9 and responsive width, with rectangular Orbit borders/surfaces and no autoplay permission/query.

- [ ] **Step 6: Replace the page mock section**

Import and render `<SeriesVideoPlayer videos={series.videos} lang={currentLang} />` where the existing mock video section lives. Remove page-level `activeVideoTab` state/reset and obsolete mock-only `.sd-soon`, `.sd-empty`, `.sd-screen`, `.sd-play`, and `.sd-bar` styles. Preserve `youtubeEmbedUrl()` and `activatedTrailers` because those belong to out-of-scope episode trailers.

- [ ] **Step 7: Run public component/query tests**

Run: `npm run i18n:compile && npm test -- src/lib/components/series/SeriesVideoPlayer.test.ts src/lib/server/queries/series-detail.test.ts src/routes/[lang=lang]/(app)/series/[id]/cover-fallback.test.ts`

Expected: PASS; no-video series omit the section, trusted clips switch without autoplay, and unrelated cover/episode behavior remains intact.

### Task 8: Consolidated verification and rollout guard

**Files:**
- Review all files listed in File Map; make only corrections required by failed checks or spec gaps.

**Interfaces:**
- Verifies all earlier contracts agree on `SeriesVideoType`, `SeriesVideo`, `PublicSeriesVideo`, request bodies, response codes, and property casing.

- [ ] **Step 1: Run all focused feature tests together**

Run:

```bash
npm test -- \
  src/lib/series-videos/registry.test.ts \
  src/lib/server/series-videos/youtube.test.ts \
  src/lib/server/db/schema.test.ts \
  src/lib/server/queries.test.ts \
  src/lib/server/queries/series-detail.test.ts \
  src/lib/server/series-videos/mutations.test.ts \
  src/routes/api/admin/series/[id]/videos/server.test.ts \
  src/routes/api/admin/series/[id]/videos/[seriesVideoId]/server.test.ts \
  src/lib/components/admin/SeriesVideosSection.test.ts \
  src/lib/components/series/SeriesVideoPlayer.test.ts
```

Expected: all listed files PASS; no test connects to a configured database or network.

- [ ] **Step 2: Run project type/Svelte/i18n validation**

Run: `npm run check`

Expected: exit 0 with no new TypeScript, Svelte accessibility, generated message, or route type errors. Confirm local NodeNext imports use `.js` and all page/API handlers use generated `./$types.js`.

- [ ] **Step 3: Run broader tests and build due cross-layer blast radius**

Run: `npm test && npm run build`

Expected: full Vitest suite and production build exit 0; episode trailer, admin editor, SEO, and unrelated catalog behavior remain green.

- [ ] **Step 4: Perform browser UX checks without mutating a database**

Using mocked/test data or an isolated local database only, verify `/th/series/<test-id>` and `/en/series/<test-id>` at narrow mobile and desktop widths, light/dark themes, keyboard-only navigation, and reduced motion. Expected: localized titles/copy, section hidden when empty, type/clip selection stable, no autoplay, 16:9 responsive iframe, visible focus, and no standard YouTube embed requests. In admin, expected: fields remain after failed add, controls disable only while affected request is pending, boundary arrows remain disabled, confirmation receives focus, and successful writes refresh counts/order.

- [ ] **Step 5: Review migration and working-tree hygiene**

Run: `git diff --check && git status --short && git diff -- src/lib/server/db/schema.ts drizzle/0027_series_videos.sql drizzle/meta/0027_snapshot.json drizzle/meta/_journal.json`

Expected: no whitespace errors; only intended source/tests/messages/generated Paraglide/migration files changed; migration remains additive. Explicitly verify command history contains no `npm run db:push`, seed command, remote migration application, commit, or push.

## Self-Review Record

- **Spec coverage:** Tasks 1–2 cover registry, strict YouTube validation, schema, deterministic order, cascade, uniqueness, index, and additive migration. Tasks 3–4 cover admin/public query shapes, soft-delete exclusion, route guards/scoping, append/reorder/delete semantics, stable errors, transactions, duplicate handling, and exact cache invalidation. Tasks 5–7 cover bilingual admin/public UX, pending/error/success behavior, confirmation, accessibility, hidden empty state, trusted nocookie embeds, and no autoplay. Task 8 covers focused/full validation and the no-apply rollout guard. Episode trailer editing, uploads, alternate providers, drag sorting, metadata editing, analytics, and autoplay remain excluded.
- **No-placeholder scan:** Every created/modified path, exported contract, request body, response code, command, and expected outcome is named. Generated migration output is deterministic through `--name series_videos`; no unspecified implementation step remains.
- **Type consistency:** Registry keys flow as `SeriesVideoType`; DB/editor rows use `SeriesVideo`; public query/player uses `PublicSeriesVideo`; API request names are `type`, `titleTh`, `titleEn`, `youtubeUrl`, and `videoIds`; route path uses `seriesVideoId`; stored properties consistently use `youtubeUrl`, `youtubeVideoId`, `sortOrder`, and `createdAt`.
- **Safety:** Plan generates migration files but never applies them, makes no network request during URL validation, never trusts client video IDs/embed URLs, redacts database errors, and invalidates only `query:series:<seriesId>` after successful writes.
