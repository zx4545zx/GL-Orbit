# Halo Profile Moments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock `/th/halo/profile/moments` page with an authenticated user's real profile and published Moment feed, with infinite scrolling and real social actions.

**Architecture:** A protected server load returns the current user's identity and the first authored Moment page. A shared mapper converts the API/DB Moment payload to the component view model. The feed owns cursor pagination through `IntersectionObserver`; cards own optimistic like, bookmark, and comment interactions through the existing REST endpoints.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Drizzle ORM, Neon Postgres, Tailwind CSS.

---

## File structure

- Create `src/routes/[lang=lang]/(orbit-halo)/halo/profile/moments/+page.server.ts` — authenticated initial profile and feed load.
- Modify `src/routes/[lang=lang]/(orbit-halo)/halo/profile/moments/+page.svelte` — consume load data and remove static profile/feed content.
- Modify `src/lib/server/moments/queries.ts` — include viewer-specific liked/bookmarked state in Moment rows.
- Modify `src/lib/components/moments/types.ts` — define API payload, UI Moment model, mapper, and provider/date helpers while preserving `sampleMoments` for unconverted routes.
- Modify `src/lib/components/moments/MomentFeed.svelte` — cursor-based infinite scrolling, retry/error/end states.
- Modify `src/lib/components/moments/MomentCard.svelte` — render mapped real data, real comments, and optimistic action state.

No schema migration or new API route is required.

### Task 1: Return viewer action state from the Moment query

**Files:**
- Modify: `src/lib/server/moments/queries.ts:7-35`

- [ ] **Step 1: Extend the Moment query result with viewer action flags**

  Keep the existing published filters, entity filters, cursor ordering, and `authorId` filtering. When `viewerId` exists, use `momentLikes` and `momentBookmarks` to calculate these fields for every selected row:

  ```ts
  liked: boolean;
  bookmarked: boolean;
  ```

  Return `false` for both when there is no viewer. Do not infer either state from a count.

- [ ] **Step 2: Preserve response compatibility**

  Ensure `GET /api/moments` returns the two new boolean fields inside every item in `moments`, alongside its existing `likeCount`, `commentCount`, author, media, and tag IDs. Do not change its cursor, status code, or query parameter contract.

- [ ] **Step 3: Manually verify the query contract**

  With an authenticated user who has liked/bookmarked a Moment, request:

  ```text
  GET /api/moments?authorId=<current-user-id>&limit=1
  ```

  Confirm the returned Moment contains actual `liked` and `bookmarked` booleans and remains published-only.

### Task 2: Define a reusable real-Moment view model

**Files:**
- Modify: `src/lib/components/moments/types.ts:1-52`

- [ ] **Step 1: Add transport and display types without deleting mock support**

  Add an exported `MomentApiItem` type for the server/API payload, including `id`, body/source fields, counts, created date, `liked`, `bookmarked`, author identity, media, and entity IDs. Add an exported `ProfileMoment` type for components with these minimum fields:

  ```ts
  id: string;
  author: string;
  handle: string;
  initial: string;
  avatarUrl: string | null;
  time: string;
  body: string;
  source: string | null;
  provider: 'YouTube' | 'TikTok' | 'X' | 'Link';
  tags: string[];
  likes: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
  media: MomentApiItem['media'];
  ```

  Keep `HaloMoment` and `sampleMoments` until other Halo routes stop importing them.

- [ ] **Step 2: Add one pure mapper**

  Export `toProfileMoment(moment: MomentApiItem): ProfileMoment`. It must derive a safe display name, `@username` handle, initial, relative/display time, source provider fallback (`Link`), tags from available IDs, numeric counts, and server-provided viewer booleans. It must not call `fetch`, access Svelte state, or mutate the input.

- [ ] **Step 3: Use the mapper as the sole shape boundary**

  Both the server-loaded first page and client-fetched next pages must pass through `toProfileMoment`. Components must not read raw API field names such as `likeCount` or `sourceProvider`.

### Task 3: Protect and load the profile-moments route

**Files:**
- Create: `src/routes/[lang=lang]/(orbit-halo)/halo/profile/moments/+page.server.ts`

- [ ] **Step 1: Add the protected server load**

  Implement `load` with `PageServerLoad` from `./$types.js`. If `locals.user` is absent, redirect to the localized login route using the current `params.lang` and a return path of `/${params.lang}/halo/profile/moments`.

- [ ] **Step 2: Load only the current user's published Moment page**

  Use `getDb()` and `getMoments({ authorId: locals.user.id, viewerId: locals.user.id })`. Return:

  ```ts
  {
    profile: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      coverUrl: string | null;
    },
    moments: MomentApiItem[],
    nextCursor: string | null
  }
  ```

  Obtain profile identity from the real users table if `locals.user` lacks any display field. Do not return static biography, Moment totals, Glow totals, or fabricated social-graph counts.

- [ ] **Step 3: Manually verify route authorization**

  Visit `/th/halo/profile/moments` signed out: confirm localized login redirect. Visit it signed in: confirm the returned Moments all have `authorId` equal to the session user and `status` is published.

### Task 4: Replace mock page content with server data

**Files:**
- Modify: `src/routes/[lang=lang]/(orbit-halo)/halo/profile/moments/+page.svelte:1-19`

- [ ] **Step 1: Consume `data` with Svelte 5 props**

  Import `PageData` from `./$types.js`, receive `{ data } = $props<{ data: PageData }>()`, and remove the `sampleMoments` import and direct `$app/state` user dependency.

- [ ] **Step 2: Render only sourced profile fields**

  Render `data.profile.displayName`, `data.profile.username`, and `data.profile.avatarUrl` with an initial fallback. Render `coverUrl` only when present. Remove the hard-coded bio, `12 Moments`, and `248 Glow` UI rather than displaying invented values.

- [ ] **Step 3: Pass real first-page data into the feed**

  Map `data.moments` with `toProfileMoment` and pass the result plus `data.nextCursor`, `data.profile.id`, and the localized API base requirements to `MomentFeed`. Render a Thai empty state when the mapped array is empty.

### Task 5: Implement cursor infinite scrolling and feed states

**Files:**
- Modify: `src/lib/components/moments/MomentFeed.svelte:1-15`

- [ ] **Step 1: Expand feed props for paginated real data**

  Replace the static-only interface with props for `moments: ProfileMoment[]`, `initialCursor: string | null`, and `authorId: string`. Copy initial moments into local `$state`; retain the optional `expanded` presentation prop only if current callers need it.

- [ ] **Step 2: Fetch and append cursor pages**

  Implement `loadNextPage()` with a guard for loading, exhausted cursor, and existing error. Request:

  ```ts
  `/api/moments?authorId=${encodeURIComponent(authorId)}&cursor=${encodeURIComponent(nextCursor)}`
  ```

  On success, map every response item with `toProfileMoment`, append de-duplicated IDs, then replace `nextCursor`. On failure, preserve current cards and set a Thai retry message.

- [ ] **Step 3: Trigger page loads with an accessible sentinel**

  Attach an `IntersectionObserver` to an end-of-feed sentinel after mount; call `loadNextPage()` when it enters the viewport. Disconnect it on cleanup. Keep a visible Thai fallback retry button after failures, a loading indicator while fetching, and an end-of-feed message only after a non-empty feed receives `nextCursor: null`.

- [ ] **Step 4: Remove the static Load More behavior**

  Delete or replace the current nonfunctional Load More control. Do not expose both infinite scroll and a normal pagination button except the error retry button.

### Task 6: Wire Moment cards to real data and interactions

**Files:**
- Modify: `src/lib/components/moments/MomentCard.svelte:1-30`

- [ ] **Step 1: Accept the real display model**

  Accept `moment: ProfileMoment`. Render its avatar/name/handle/body/source/media/provider/tags/counts and remove assumptions that comments arrive as `HaloComment[]`. Use `moment.liked` and `moment.bookmarked` as the initial selected states.

- [ ] **Step 2: Implement optimistic likes and bookmarks**

  For each action, capture prior local state and count, update UI immediately, then call either `PUT` or `DELETE`:

  ```text
  /api/moments/<id>/like
  /api/moments/<id>/bookmark
  ```

  Disable a repeated click while its request is pending. If the response is not OK, restore the captured state/count and show a Thai inline error. Do not change counts from the endpoint body because the endpoints return only boolean action state.

- [ ] **Step 3: Implement real comments**

  When the comments section opens, fetch `/api/moments/<id>/comments?limit=50`, render author/body/time from that response, and retain a loading/error state. Submit a non-empty trimmed comment via `POST /api/moments/<id>/comments` with `{ body }`. On `201`, re-fetch comments and increment local `commentCount`; on failure, preserve the input and show a Thai error. Do not invent a comment before server confirmation.

- [ ] **Step 4: Preserve accessibility and Thai feedback**

  Use meaningful button labels and `aria-pressed` for selected like/bookmark controls. Mark feed/comment loading regions with `aria-live="polite"`. All new user-facing action, retry, empty, and error messages are Thai.

### Task 7: Static and manual validation

**Files:**
- Modify: none

- [ ] **Step 1: Run the type and Svelte checker**

  Run:

  ```bash
  npm run check
  ```

  Expected: exit code 0 with no new errors.

- [ ] **Step 2: Manually validate the real user flow**

  Verify in a browser:

  1. A guest is redirected from `/th/halo/profile/moments` to login.
  2. A signed-in user sees only their real published Moments and real profile identity.
  3. An account with no Moments gets the Thai empty state.
  4. Multiple Moment pages append once when the sentinel enters view; the end state appears only at cursor exhaustion.
  5. Like/bookmark state survives reload, and each forced failing request rolls its UI state back.
  6. Comments load, submit, and report an API failure in Thai.

## Plan self-review

- **Spec coverage:** Tasks 1–6 cover protected SSR data, real profile data, no mock counts, cursor infinite scroll, actions, rollback, and Thai states. Task 7 covers requested validation.
- **User constraint:** Automated tests are intentionally omitted at the user's request; the plan uses `npm run check` and manual verification instead.
- **Consistency:** `MomentApiItem` is the raw payload, `ProfileMoment` is the only card/feed model, and `toProfileMoment` is used for both SSR and cursor pages.
