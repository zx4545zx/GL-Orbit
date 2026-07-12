# Orbit Halo Design

Date: 2026-07-12

## Goal

Add Orbit Halo as GL-Orbit's localized social community product. Members share a **Moment** that always preserves an external source URL. The product must feel distinct from GL-Orbit's information architecture while sharing authentication, entities, notifications, localization, and global design tokens.

Tagline: **Every moment adds to the glow.**

## Scope

Included:

- Dedicated localized Halo route group and responsive social-product shell
- Moment creation, editing, soft deletion, chronological feed, detail, cursor pagination, and entity filters
- Safe external source and image URL handling with provider-specific previews
- Series, artist, and ship tags
- Likes, private bookmarks, comments, one reply level, reports, and admin moderation
- Existing notification-system extension for Moment events
- Postgres-backed rate limits, CSP updates, Paraglide Thai/English copy, and critical server/UI tests
- Small Latest Moments integrations on series, artist, and ship pages

Excluded:

- Uploading images or videos, direct messages, reposts, quotes, following, hashtags, ranking, full-text search, realtime comments, nested replies beyond one level, Redis, microservices, and a separate media service
- Applying migrations to Neon or running `db:push` in this work

## Product and Route Architecture

Add a sibling localized route group without changing existing public routes:

```txt
src/routes/[lang=lang]/
├── (app)/                       # Existing GL-Orbit information shell
└── (orbit-halo)/
    ├── +layout.server.ts
    ├── +layout.svelte
    └── halo/
        ├── +page.server.ts
        ├── +page.svelte
        ├── explore/
        ├── moments/[id]/
        ├── saved/
        ├── notifications/
        ├── profile/moments/
        └── u/[username]/
```

URLs remain clean: `/th/halo`, `/en/halo/moments/[id]`, and so on. The root layout continues to supply locale, session data, global theme, loading UI, toast/dialog primitives, and push prompt. The Halo layout must not render the existing `(app)` `Navigation` or `BottomNav`.

Desktop uses stable left Halo navigation, a 680–760px readable feed column, and an optional right discovery panel. Mobile is feed-first with a top bar and safe-area-aware bottom navigation: Halo, Explore, prominent Create, Alerts, Profile. The Halo layout provides a visible return link to GL-Orbit.

Add an Orbit Halo entry to `src/lib/components/Navigation.svelte` and `src/lib/components/BottomNav.svelte`. Add the admin moderation destination to the existing localized admin shell rather than creating a second admin shell.

## Data Model and Migration

Extend `src/lib/server/db/schema.ts` and generate the next Drizzle migration after `drizzle/0016_great_husk.sql`. Commit generated SQL, snapshot, and journal. Do not run the migration against Neon.

Add enums and tables specified by `docs/gl-orbit-orbit-halo-spec.md`:

- `moments`
- `moment_media`
- `moment_likes`
- `moment_bookmarks`
- `moment_comments`
- `moment_series`
- `moment_artists`
- `moment_ships`
- `moment_reports`

Add `moment_moderation_actions` as an append-only audit table. It records moment, acting admin, action, reason, and timestamp so HIDE, RESTORE, and DELETE are auditable.

Use `primaryKey`, `index`, `uniqueIndex`, and `check` builders explicitly. The migration includes:

- unique `(author_id, source_canonical_url)` for duplicate source protection
- feed index `(status, created_at, id)` and author index `(author_id, created_at, id)`
- deterministic comment index `(moment_id, created_at, id)`
- report target check: exactly one of `moment_id` or `comment_id`
- media check: MVP external media requires `external_url` and forbids `storage_key`
- non-negative checks on Moment counters
- comment parent cannot point to itself
- partial unique indexes for one active report per reporter per Moment and, for future compatibility, per comment

`momentMedia` supports only `IMAGE` with `EXTERNAL` source during this release, a maximum of four images, and no storage key. Moment body is nullable after trimming; source URL is required. Limits are 2,000 body characters, 500 alt-text characters, three series tags, six artist tags, and three ship tags.

`likeCount` counts active likes. `commentCount` counts published, visible comments and replies; a deleted parent with replies remains a tombstone but does not lose its child replies. Bookmarks remain private, so this design omits a public `bookmarkCount` from API/UI behavior.

`updatedAt` is assigned explicitly by every update mutation.

Extend the existing `notifications` table rather than creating a second system:

- make `seriesId` nullable while preserving existing rows
- add nullable actor user, Moment, comment, and metadata fields
- serialize notifications by their target rather than assuming a series
- keep existing series notifications working

Moment notification data stores event fields and a target URL, not only language-specific prose, so the client can localize Thai and English. Existing series behavior continues through target-aware left joins/batched hydration. Notifications are persisted in the same transaction as the action; SSE/push runs only after commit and remains best-effort on Vercel.

## Server Boundaries

Keep route handlers thin. Add focused server modules:

```txt
src/lib/server/
├── embeds/
│   ├── types.ts
│   ├── url-security.ts
│   ├── normalize-url.ts
│   ├── resolver.ts
│   ├── youtube.ts
│   ├── tiktok.ts
│   ├── x.ts
│   └── other.ts
├── moments/
│   ├── validation.ts
│   ├── permissions.ts
│   ├── cursor.ts
│   ├── queries.ts
│   ├── mutations.ts
│   └── serializers.ts
└── rate-limit/
    ├── index.ts
    └── keys.ts
```

- `validation.ts` trims and validates payload limits with the project's existing local TypeScript validation style; it does not add a second validation library.
- `permissions.ts` is pure ownership/admin/visibility policy.
- `queries.ts` hydrates feed, detail, comments, entity tags, media, and current-user interaction state without N+1 queries.
- `mutations.ts` owns transactions, counters, ownership checks, reports, moderation, and notification inserts.
- `serializers.ts` exposes a Halo-specific public author DTO. It must never reuse `PublicUser`, which includes private email and role fields.
- `cursor.ts` version-encodes URL-safe base64 JSON for `(createdAt, id)` and strictly rejects malformed cursors.

Before implementing multi-table mutations, verify that the installed Neon Drizzle driver supports the required transaction semantics. If it does not, use an explicit supported transaction-capable database path; do not fake atomicity with sequential writes.

## Source URL and Embed Safety

Clients submit URLs only. They never submit HTML, iframe markup, scripts, blockquotes, or embed code. No Moment component uses `{@html}` for external content.

Both source and image URLs must be HTTPS, valid, within length limits, and reject credentials, raw IPv4/IPv6, localhost, loopback, private and link-local ranges, `.local`, malformed hosts, and unsupported ports. Provider recognition uses exact host or explicitly controlled subdomain matching, never lookalike suffix matching.

Normalization lowercases hosts, removes known tracking parameters, safely removes trailing slashes, changes YouTube short/mobile variants to `www.youtube.com/watch?v=…`, and changes Twitter aliases to `x.com` without changing the referenced item.

Provider behavior:

- **YouTube:** parse and validate an allowed video ID from watch, short, shorts, or embed URLs; render only a controlled `youtube-nocookie.com/embed/{id}` lazy iframe.
- **TikTok:** call only an allowlisted official endpoint when configured; persist safe metadata, never returned HTML; initialize one widget near the viewport and show a fallback on failure.
- **X:** validate status URL and ID, use an official widget only near the viewport, otherwise show a fallback.
- **Other:** never server-fetch. Show hostname, canonical URL, and open-original action.

Allowlisted provider requests use fixed endpoints, short timeouts, response-size caps, disabled or revalidated redirects, and no forwarded user headers. Metadata failure never prevents publishing a valid Moment: it returns `FALLBACK`.

External images use lazy loading, async decoding, `referrerpolicy="no-referrer"`, fixed gallery sizing, and a broken-image fallback. They are never proxied through the server.

## API Contract

Use localized SvelteKit `+server.ts` routes under `src/routes/api/`. Handlers authenticate via `locals.user`, parse bounded JSON before embed work, call one server service, and map typed errors to stable machine-readable codes. UI copy and validation labels come from Paraglide rather than hardcoded Thai-only components.

Public read routes:

- `GET /api/moments` — chronological published feed; filters: cursor, limit, seriesId, artistId, shipId, authorId, bookmarked
- `GET /api/moments/[id]` — one Moment plus initial comments page; hidden/deleted content is 404 for unauthorized viewers
- `GET /api/moments/[id]/comments` — deterministic paginated comments

Authenticated routes:

- `POST /api/moments/preview`
- `POST /api/moments`
- `PATCH /api/moments/[id]`
- `DELETE /api/moments/[id]`
- `PUT /api/moments/[id]/like` and `DELETE /api/moments/[id]/like`
- `PUT /api/moments/[id]/bookmark` and `DELETE /api/moments/[id]/bookmark`
- `POST /api/moments/[id]/comments`
- `DELETE /api/comments/[id]`
- `POST /api/moments/[id]/report`

Explicit like/bookmark methods are retry-safe; they replace ambiguous toggle behavior. Moment reports are the public MVP reporting surface. The schema remains compatible with future comment reports but no undefined comment-report endpoint is added.

Admin-only routes:

- `GET /api/admin/moments/reports`
- `PATCH /api/admin/moments/[id]/moderate`

Moderation actions are HIDE, RESTORE, DELETE, and DISMISS_REPORT. Admin authentication requires `locals.user.role === 'ADMIN'`.

All entity IDs are validated against visible, non-deleted records, not mere ID existence. Create/update relation writes, likes/counters, comment/counters, deletion/tombstones, report/moderation updates, and notification persistence are atomic transactions. Counters never become negative.

## Rate Limits and CSP

Create a reusable Postgres atomic fixed-window rate limiter based on database time. It returns `429` with `Retry-After` and applies the approved limits:

- preview: 20 / 10 minutes / user
- create Moment: 10 / 10 minutes / user
- create comment: 30 / 10 minutes / user
- like: 100 / 10 minutes / user
- report: 10 / day / user

Moderation attempts are also rate-limited. Payload-size checks occur before resolution or database work.

Add CSP centrally only after verifying existing behavior. Keep origins narrow: controlled YouTube frame sources, provider script/connect sources only where a tested widget needs them, and HTTPS image sources. Do not add wildcards or broad unsafe directives.

## UI Components and Behaviour

Create reusable components under `src/lib/components/moments/`:

- `MomentComposer`, `MomentCard`, `MomentFeed`, `MomentActions`, `MomentEntityTags`
- `MomentMediaGallery`, `MomentComments`, `MomentCommentItem`, `MomentReportDialog`, `MomentSkeleton`
- `embeds/EmbedPreview`, `YouTubeEmbed`, `TikTokEmbed`, `XEmbed`, `LinkFallbackCard`

Composer flow: paste URL, preview, optional body/images/entity tags, publish. States are idle, resolving, ready, publishing, and error. Moment cards show public author, time, text, safe preview, media, entity chips, source action, actions, and accessible menus.

Use optimistic UI only for idempotent likes/bookmarks. Creation, editing, comments, reports, and moderation wait for the server response. Infinite feed loading uses `IntersectionObserver`, item-ID deduplication, abortable requests, stale-response guards, and a manual retry/load-more fallback. Provider scripts load once only near the viewport and placeholders prevent layout shift.

Halo pages translate all UI through Paraglide Thai and English resources. Guest visitors can read public Moments; protected actions route to locale-preserving sign-in.

Series, artists, and ships receive a small Latest Moments section with a link to `/[lang]/halo` plus the relevant entity filter. They must not embed a second infinite feed.

## Testing and Verification

Add tests in layers:

1. Pure unit tests: URL security, normalization, provider-ID parsing, cursor handling, validation, rate-limit keys, and permissions.
2. Service tests: transaction orchestration, rollback, ownership, reply-depth rule, tombstones, counter behavior, notification suppression/deduplication, and moderation audit.
3. Handler tests: malformed JSON, auth/admin checks, status/error codes, rate-limit responses, and public DTO privacy.
4. Migration tests: generated SQL includes expected constraints, indexes, FKs, and nullable notification migration.
5. UI tests: layout isolation, composer states, fallbacks, broken image behavior, duplicate-free pagination, mobile safe areas, and Thai/English copy.
6. Security tests: URL bypass corpus, provider lookalikes, malformed IDs, oversized payloads, hidden-content access, and DTO leakage.

Mocked Drizzle tests cannot prove races, partial indexes, cascade behavior, or rollback. Add disposable PostgreSQL CI coverage when available. Until then, real database concurrency/constraint checks are explicitly recorded as an unverified boundary; Neon is not changed during this feature.

Final local verification runs `npm run check`, `npm test`, and `npm run build` after implementation.

## Implementation Order

1. Resolve contracts and verify transaction support.
2. Add schema, generated migration, and migration review tests.
3. Build URL security, providers, cursors, validation, and rate limiting with unit tests.
4. Build Moment query/mutation/serializer services.
5. Add public and authenticated Moment APIs.
6. Add interactions, comments, reports, and notifications refactor while preserving series behavior.
7. Build dedicated Halo layout, feed, composer, detail, saved, profile, alerts, and localization.
8. Build admin moderation queue and audit display.
9. Add entity integrations, CSP, accessibility/performance hardening, and complete verification.
