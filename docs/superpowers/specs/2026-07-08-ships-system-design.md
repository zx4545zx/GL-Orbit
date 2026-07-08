# Ships System Design

Date: 2026-07-08

## Goal

Add a complete Ships system for GL-Orbit. A ship represents one “คู่จิ้น” made from exactly two artists. The feature uses `ships` consistently across database tables, server code, API routes, admin routes, and public routes to avoid naming confusion.

Thai UI copy may still describe the feature as “คู่จิ้น”, but the technical and URL vocabulary is `ships`.

## Scope

Included:

- Public ships list page at `/ships`
- Public ship detail page at `/ships/[id-or-slug]`
- Explore tab at `/explore/ships`
- Ships tab added to the existing Explore tab layout
- Admin ships management at `/admin/ships`
- Admin API routes for listing, creating, updating, and hard-deleting ships
- Database schema for ships and their related series
- Query helpers for public list/detail and admin management

Excluded:

- Automated testing work for this feature
- Supporting ships with more than two artists
- Creating admin accounts or changing authentication behavior

## Data Model

### `ships`

The `ships` table stores the primary ship record.

Core fields:

- ID
- Ship name
- Slug
- Artist 1 ID
- Artist 2 ID
- Cover/profile image URL
- Description
- Start date or first-known pairing date
- Hashtags/social tags
- Featured flag
- Published status
- Audit fields

Rules:

- A ship must contain exactly two artists.
- Artist 1 and Artist 2 cannot be the same artist.
- A pair cannot be duplicated in reverse order. If Artist A + Artist B exists, Artist B + Artist A is also considered the same ship.
- Slug must be unique.

### `ship_series`

The `ship_series` table links ships to series they appear in together.

Core fields:

- ID
- Ship ID
- Series ID
- Optional display/order metadata if existing admin patterns need it
- Audit fields

Rules:

- A ship can be linked to multiple series.
- A series can be linked to multiple ships.
- Duplicate ship/series rows should not be allowed.

## Public UX

### `/ships`

The public list page should follow the current Series page style and interaction model.

It should include:

- Header section matching the visual rhythm of Series
- Search by ship name and artist names
- Card grid similar to Series cards
- Card content:
  - Ship image
  - Ship name
  - Two artist names
  - Shared series count
  - Main hashtags/tags when available
- Load-more behavior if the existing Series pattern uses it
- Empty state in Thai
- Localized SEO metadata following existing public page conventions

### `/ships/[id-or-slug]`

The public detail page should follow the Series detail page structure.

It should include:

- Hero section with ship image and ship name
- Artist pair section linking to each artist detail page
- Description section
- Hashtags/social tags section
- Shared works section showing linked series from `ship_series`
- JSON-LD/SEO metadata where appropriate, using existing SEO helpers

Public pages must only show ships that are published.

## Explore UX

The Explore layout currently has Series and Artists tabs. Add a Ships tab.

Routes:

- `/explore/ships`

Behavior:

- The Ships tab should use the same active-tab behavior as the existing Explore tabs.
- The page should mirror the Explore Series/Artists list style: search, grid, load more, empty state, and URL syncing where appropriate.
- The Explore Ships page can share the same query/data shape as `/ships`, but should fit visually inside the Explore tab shell.

## Admin UX

### `/admin/ships`

Admin ships management should follow existing admin resource patterns.

It should support:

- List ships
- Search ships
- Create ship
- Edit ship
- Hard delete ship
- Select exactly two artists
- Select related series
- Manage ship name, slug, image, description, start date, hashtags/social tags, featured flag, and published status

Admin validation messages should be in Thai.

Validation cases:

- Missing required ship name
- Duplicate slug
- Same artist selected twice
- Duplicate ship pair, including reversed artist order
- Missing one of the two artists

## API Design

Admin API routes:

- `GET /api/admin/ships`
- `POST /api/admin/ships`
- `GET /api/admin/ships/[id]`
- `PATCH /api/admin/ships/[id]`
- `DELETE /api/admin/ships/[id]`

Expected behavior:

- `GET /api/admin/ships` returns list data for the admin table with search support.
- `POST` validates input, creates a ship, and creates `ship_series` relations.
- `GET /api/admin/ships/[id]` returns a complete edit payload, including selected artists and related series.
- `PATCH` validates input, updates the ship, and resets `ship_series` relations using the existing relation reset pattern from series editing.
- `DELETE` permanently deletes the ship and its dependent `ship_series` rows.

Public data should use server load/query helpers instead of calling admin APIs.

## Query Layer

Add query helpers under existing server query conventions.

Suggested helpers:

- `getShipList()` for `/ships` and `/explore/ships`
- `getShipDetail()` for `/ships/[id-or-slug]`
- Admin-specific list/detail helpers if they keep API route files smaller

Public list queries should include:

- Ship basic fields
- Artist 1 and Artist 2 display fields
- Shared series count
- Featured/published information as needed for sorting/filtering

Public detail queries should include:

- Ship basic fields
- Artist 1 and Artist 2 detail/link fields
- Related series from `ship_series`

## Navigation and Layout Updates

Update:

- Explore layout tabs to include Ships
- Admin navigation to include Ships management
- Public long-list/back-to-top logic to include `/ships` if it follows the same long-list pattern as Series

All public links should follow the existing language-prefixed route conventions and use existing link helpers where appropriate.

## Error Handling

Admin errors should return Thai messages and avoid exposing internal database details.

Public detail pages should return 404 when:

- The ship does not exist
- The ship is unpublished

Public list pages should show a friendly Thai empty state when no ships match the search/filter.

## Open Decisions Resolved

- Use `ships` everywhere for routes, code, API, and database naming.
- UI can use Thai copy “คู่จิ้น”.
- Ships contain exactly two artists.
- Add full public, Explore, and admin surfaces.
- Match the Series page style and patterns.
- Skip automated testing work for this feature.
- Delete ships with hard delete, not soft delete.
