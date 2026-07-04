# Series Cover and Gallery Design

Date: 2026-07-05

## Status

Approved for implementation.

## Goal

Add real series cover images and series gallery images so the public series detail page can use dedicated wide hero artwork and an official scene/gallery grid instead of relying on poster or episode-cover fallbacks.

## Scope

### In scope

- Add `cover_url` to `series`.
- Add `series_gallery_images` table.
- Add admin editing for cover image and gallery images.
- Add public detail query support for `coverUrl` and `gallery`.
- Update the public series detail page to use real cover/gallery data.
- Generate a Drizzle migration.

### Out of scope

- Do not push migrations to the database automatically.
- Do not add rich gallery metadata such as source URL, credit, featured flag, or alt text in this phase.
- Do not build drag-and-drop sorting; use simple up/down sort controls.
- Do not change the existing image upload storage model; use the existing `posters` image type for cover/gallery uploads.

## Data Model

### `series.cover_url`

- Type: nullable text.
- Purpose: wide hero/cover image for public detail pages.
- Fallback: `series.posterUrl` when absent.

### `series_gallery_images`

Fields:

- `id`: UUID primary key.
- `series_id`: UUID, required, references `series.id` with cascade delete.
- `image_url`: text, required.
- `caption`: text, nullable.
- `sort_order`: integer, required, default `0`.
- `created_at`: timestamptz, required, default now.

Ordering:

- Sort by `sort_order` ascending, then `created_at` ascending.

## Admin UX

In `SeriesMainSection`:

- Show two image upload cards near the top:
  - Poster (`posterUrl`), existing behavior.
  - Cover image (`coverUrl`), new behavior.
- Add a gallery manager section:
  - Upload/select image URL with existing `ImageUpload`.
  - Optional caption input.
  - Add button.
  - Grid/list of current gallery images.
  - Up/down buttons to adjust order.
  - Delete button.
- On successful mutation, call `onrefresh()`.

## API

Keep series core updates in existing endpoint:

- `POST /api/admin/series`
- `PUT /api/admin/series/:id`

Add gallery endpoint:

- `GET /api/admin/series/:id/gallery`
- `POST /api/admin/series/:id/gallery`
- `PUT /api/admin/series/:id/gallery` for reorder/update list order
- `DELETE /api/admin/series/:id/gallery/:imageId`

All endpoints require ADMIN.

## Public Detail Page

`getSeriesDetail()` returns:

- `coverUrl: string | null`
- `gallery: { id: string; imageUrl: string; caption: string | null }[]`

Page behavior:

- `coverCandidate = series.coverUrl ?? series.poster`.
- Gallery section uses `series.gallery` when present.
- If no real gallery exists, fallback to episode cover candidates or omit the gallery section.

## Verification

Run:

```bash
npm run db:generate
npm run check
npm test
npm run build
```

Do not run `npm run db:push` unless explicitly requested.
