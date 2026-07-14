# Navigation Performance Design

## Goal

Reduce authenticated warm client navigation to under 500 ms on representative
GL-Orbit routes while keeping user-specific data private and correct.

Baseline measurements from production preview:

- `/en/calendar`: 611 ms
- `/en/explore/series`: 738 ms
- `/en/halo/explore`: 776 ms
- `/en/halo`: 1,684 ms

The global loading toast currently appears after 180 ms, so normal navigation
looks abnormally slow even though the toast itself does not add latency.

## Scope

### Navigation feedback

- Remove the delayed loading toast.
- Keep the non-interactive top progress bar for immediate route feedback.
- Do not restore blocking overlays or global touch cancellation.

### Shared authenticated request path

- Return `preferredLanguage` from the existing session-and-user join.
- Remove the second user lookup from `hooks.server.ts`.
- Preserve current session validation, locale precedence, and public user shape.
- Unauthenticated requests must not gain a database query.

### Route query efficiency

- Run independent series count and listing queries concurrently.
- Keep dependent genre lookup after series IDs are known.
- Add a short cache for non-personalized Halo discovery data only.
- Keep Moment likes, bookmarks, and other viewer-specific state uncached.
- Do not publicly cache SvelteKit page-data responses containing parent user data.

### Database indexes

Add Drizzle schema indexes and a generated migration for active calendar rows and
join keys:

- `episode_schedules(air_date)` where `deleted_at IS NULL`
- `episode_schedules(episode_id)`
- `episodes(series_id)`

Index names must follow existing schema conventions. Migration SQL must be
reviewed before applying. This task creates migration files but does not push
schema changes to a live database without separate approval.

## Data Flow

1. SvelteKit receives a page-data request.
2. The hook validates the session with one joined session/user query.
3. The same result supplies user identity, role, and preferred language.
4. Locale detection uses URL, cookie, joined preference, then request headers.
5. Route loads perform only their own required queries.
6. Public, non-personalized read models may use bounded server cache entries.
7. Personalized data remains private and is assembled per viewer.

## Correctness and Security

- Revoked and expired sessions continue to fail validation.
- Session tokens remain hashed and never leave the server.
- Locale behavior remains unchanged.
- No shared cache entry may include `user`, likes, bookmarks, or session data.
- Existing CSP, service-worker registration, and PWA hydration behavior remain
  unchanged.
- The progress bar remains `pointer-events-none`.

## Error Handling

- Database errors retain current route-specific behavior.
- Cache misses fall through to the database; cache failures must not break page
  loads.
- Optimization must not hide query failures behind stale personalized data.

## Verification

### Automated

- Regression test confirms no loading toast remains and progress is nonblocking.
- Session tests confirm preferred language is returned by validation without a
  second hook query.
- Query tests confirm independent series queries start concurrently.
- Schema and migration tests confirm all three indexes and the partial predicate.
- Run targeted tests, full Vitest suite, `npm run check`, and `npm run build`.

### Runtime

- Use production build and preview with an authenticated session.
- Measure warm client navigation for calendar, series explore, and Halo routes.
- Target under 500 ms for representative warm runs.
- Confirm navigation controls remain interactive and service worker stays active.
- Record any external Neon/network variance separately from application query
  time.

## Non-goals

- No global CDN cache for personalized SvelteKit page data.
- No materialized views or new caching service in this iteration.
- No broad Halo feed redesign.
- No live database migration without explicit approval.
