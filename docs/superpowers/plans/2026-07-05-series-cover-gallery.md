# Series Cover and Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real series cover and gallery image data, admin editing, and public series detail rendering.

**Architecture:** Add nullable `series.coverUrl` and a normalized `seriesGalleryImages` table. Extend admin editor data/API to update cover and gallery images, then extend public `getSeriesDetail()` and the series detail Svelte page to consume real cover/gallery with existing poster/episode-cover fallbacks.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Drizzle ORM, PostgreSQL/Neon, Tailwind CSS 4, existing admin `ImageUpload` using `posters` image type.

## Global Constraints

- Do not run `npm run db:push` unless explicitly requested.
- Generate a Drizzle migration with `npm run db:generate`.
- Use existing `posters` image type for cover/gallery uploads.
- No rich gallery metadata beyond `imageUrl`, `caption`, and `sortOrder`.
- No drag-and-drop sorting; use simple up/down controls.
- Preserve current poster behavior and public fallbacks.
- Use Svelte 5 runes only.
- Import TypeScript modules with `.js` extensions when applicable.

---

## File Structure

- Modify `src/lib/server/db/schema.ts`: add `coverUrl` and `seriesGalleryImages`.
- Generated `drizzle/*.sql` and metadata: Drizzle migration for schema changes.
- Modify `src/lib/admin/editor-types.ts`: add `coverUrl` and gallery image types.
- Modify `src/lib/server/queries.ts`: return cover/gallery for admin editor.
- Modify `src/routes/api/admin/series/+server.ts`: create/update coverUrl.
- Modify `src/routes/api/admin/series/[id]/+server.ts`: update/return coverUrl.
- Create `src/routes/api/admin/series/[id]/gallery/+server.ts`: list/create/reorder gallery.
- Create `src/routes/api/admin/series/[id]/gallery/[imageId]/+server.ts`: delete gallery image.
- Modify `src/lib/components/admin/SeriesMainSection.svelte`: cover upload + gallery manager.
- Modify `src/lib/server/queries/series-detail.ts`: public cover/gallery data.
- Modify `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`: consume real cover/gallery.

---

### Task 1: Schema and Migration

- [ ] Add `coverUrl: text('cover_url')` to `series`.
- [ ] Add `seriesGalleryImages` table with `id`, `seriesId`, `imageUrl`, `caption`, `sortOrder`, `createdAt`.
- [ ] Run `npm run db:generate`.
- [ ] Run `npm run check`.
- [ ] Commit with `feat: add series cover gallery schema`.

### Task 2: Admin API and Query Data

- [ ] Extend `SeriesCore` with `coverUrl`.
- [ ] Add `SeriesGalleryImage` type and `gallery` array to `SeriesFull`.
- [ ] Update `getSeriesFull()` to load gallery ordered by `sortOrder`, `createdAt`.
- [ ] Update admin series create/update endpoints to accept and return `coverUrl`.
- [ ] Add gallery API routes for GET/POST/PUT reorder and DELETE.
- [ ] Run `npm run check` and `npm test`.
- [ ] Commit with `feat: add admin series gallery api`.

### Task 3: Admin UI

- [ ] Add `coverUrl` local state and save payload in `SeriesMainSection.svelte`.
- [ ] Show a second `ImageUpload` for cover image.
- [ ] Add gallery manager using existing `ImageUpload`, caption input, add/up/down/delete actions.
- [ ] Call `onrefresh()` after gallery mutations.
- [ ] Run `npm run check`.
- [ ] Commit with `feat: add series cover gallery editor`.

### Task 4: Public Detail Query and UI

- [ ] Extend `SeriesDetail` with `coverUrl` and `gallery`.
- [ ] Select `series.coverUrl` in `getSeriesDetail()`.
- [ ] Load gallery images in `getSeriesDetail()` ordered by `sortOrder`, `createdAt`.
- [ ] Update detail page `coverCandidate = series.coverUrl ?? series.poster`.
- [ ] Update gallery section to prefer `series.gallery` and fallback to episode covers.
- [ ] Run `npm run check`, `npm test`, and `npm run build`.
- [ ] Commit with `feat: use series cover gallery on detail page`.

### Task 5: Final Verification

- [ ] Run `npm run check`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Verify git status is clean.

## Self-Review

- Covers schema, migration, admin API, admin UI, public query, public UI, and verification.
- Does not include db push.
- Does not add rich metadata or drag-and-drop.
