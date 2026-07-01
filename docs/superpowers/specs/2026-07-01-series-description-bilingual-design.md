# Design: Bilingual Series Description (TH/EN)

**Date:** 2026-07-01  
**Project:** GL-Orbit  
**Status:** Approved

## Goal
Add bilingual synopsis / description support for series, storing both Thai and English in the database while displaying only Thai on the public detail page for now.

## Decisions
- **Storage:** Two separate nullable text columns on `series`:
  - `description_th`
  - `description_en`
- **Public display:** Use Thai (`description_th`) as the primary displayed value. Fall back to English (`description_en`) when Thai is not available, so the page never shows an empty synopsis.
- **Admin UI:** Expose two textarea fields in the Series Studio "Main" tab so admins can edit both languages.
- **Out of scope:** Language toggle on public pages, WYSIWYG/Markdown editor, auto-translation.

## Schema Change
```sql
ALTER TABLE "series" ADD COLUMN "description_th" text;
ALTER TABLE "series" ADD COLUMN "description_en" text;
```

## Files Affected
1. `src/lib/server/db/schema.ts` — add columns to `series` table
2. `drizzle/*` — generated migration for the schema change
3. `src/lib/server/queries/series-detail.ts` — select both columns, map public `description`
4. `src/lib/server/queries.ts` — include both columns in `getSeriesFull`
5. `src/lib/admin/editor-types.ts` — add `descriptionTh`/`descriptionEn` to `SeriesCore`
6. `src/lib/components/admin/SeriesMainSection.svelte` — add two textarea fields
7. `src/routes/api/admin/series/+server.ts` — accept both fields on create
8. `src/routes/api/admin/series/[id]/+server.ts` — accept and persist both fields on update
9. `src/routes/(app)/series/[id]/+page.svelte` — no change needed if `series.description` is populated by the query

## Migration Plan
1. Run `npm run db:generate` to generate the migration.
2. Run `npm run db:push` to apply it to Neon.

## Data Flow
- Admin edits both language fields → `editorApi.updateSeries` sends `descriptionTh`/`descriptionEn` → API persists to DB.
- Public page loads `getSeriesDetail` → receives `description` derived from Thai with English fallback.
- SEO meta description continues to use `series.description`.

## Backward Compatibility
- Both columns are nullable, so existing series without a synopsis remain valid.
- No existing `description` column is being removed; the public page has been using a hardcoded empty string.
