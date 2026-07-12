# Halo profile moments

## Goal

Replace the mock profile-moments page at `/th/halo/profile/moments` with the authenticated user's real published moments and real profile data.

## Scope

- Require authentication. Unauthenticated requests redirect to login.
- Render the first page server-side from the current user's profile and published moments.
- Replace static profile text, counts, and sample moments. Do not render profile fields or counts that have no real data source.
- Use cursor pagination with `IntersectionObserver` for infinite scrolling.
- Use existing moment APIs for likes, bookmarks, and comments.
- Apply optimistic UI updates and roll them back when a request fails.
- Show Thai loading, empty, end-of-feed, error, and retry states.

## Architecture

`+page.server.ts` becomes the protected initial-data boundary. It obtains the database through `getDb()`, reads the current user from `locals.user`, and uses the existing moment query layer for the first authored, published-only page.

The page maps API/database responses into the view model accepted by the shared moment components. `MomentFeed` owns the next cursor and observes a sentinel at the feed end. It fetches subsequent pages from `GET /api/moments?authorId=...&cursor=...`.

`MomentCard` uses the existing endpoints for like, bookmark, and comments. Each interaction updates local display state immediately, then restores the prior state and displays a Thai error when the request fails.

## Failure behavior

- Server-side authorization protects the route; API authorization remains unchanged.
- A failed next-page request preserves already loaded moments and exposes a retry action.
- Action failures restore the prior counts and selection state.
- No automated tests will be added for this page at the user's request.

## Validation

- Run `npm run check`.
- Manually verify login redirect, real profile header, empty state, multiple-page infinite scroll, and successful/failed like, bookmark, and comment operations.

## Out of scope

- Public profile route `/th/halo/u/[username]`.
- Replacing unrelated mock Halo pages.
- Adding profile social-graph schema or fabricated follower/following statistics.
