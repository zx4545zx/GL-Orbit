# Orbit Halo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Orbit Halo community MVP without applying schema changes to Neon.

**Architecture:** Add a localized sibling Halo layout. Keep APIs thin over dedicated embed, rate-limit, validation, query, mutation, permission, and serializer modules. Extend existing notifications with target-aware Moment events while preserving series events.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind CSS 4, Drizzle, Neon Postgres driver, Paraglide, Vitest.

---

## File structure

- `src/lib/server/embeds/{types,url-security,normalize-url,resolver,youtube,tiktok,x,other}.ts` — source/image URL safety and provider resolution
- `src/lib/server/rate-limit/{index,keys}.ts` — atomic Postgres fixed-window limits
- `src/lib/server/moments/{types,validation,permissions,cursor,queries,mutations,serializers}.ts` — Moment domain layer
- `src/routes/api/moments/**`, `src/routes/api/comments/[id]/+server.ts`, `src/routes/api/admin/moments/**` — thin handlers
- `src/routes/[lang=lang]/(orbit-halo)/**` and `src/lib/components/{halo,moments}/**` — Halo shell and UI
- `src/lib/server/db/schema.ts`, new `drizzle/0017_*.sql`, snapshot, journal — schema only; never `db:push`
- `src/lib/{types.ts,server/notifications.ts,server/push-notifications.ts}`, `src/service-worker.ts` — notification extension
- `messages/{th,en}.json`, navigation, admin shell, entity details, `src/hooks.server.ts` — integration and CSP

### Task 1: Add Moment domain contracts

**Files:** Create `src/lib/server/moments/types.ts`, `src/lib/server/moments/types.test.ts`.

- [ ] Write the failing test:

```ts
expect(isMomentReportReason('SPAM')).toBe(true);
expect(isMomentReportReason('INVALID')).toBe(false);
expect(MAX_MOMENT_IMAGES).toBe(4);
```

- [ ] Run: `npm test -- src/lib/server/moments/types.test.ts` — expect failure because module is missing.
- [ ] Implement bounded constants and `MomentReportReason`, `MomentCursor`, `MomentVisibility`, and `ResolvedEmbed` shared types.
- [ ] Run: `npm test -- src/lib/server/moments/types.test.ts` — expect pass.
- [ ] Commit: `git add src/lib/server/moments && git commit -m "feat(halo): add Moment domain contracts"`.

### Task 2: Add schema and unapplied migration

**Files:** Modify `src/lib/server/db/schema.ts`; create next generated `drizzle/0017_*.sql` and snapshot; modify journal; create `tests/db/orbit-halo-migration.test.ts`.

- [ ] Write failing migration assertions:

```ts
expect(sql).toContain('CREATE TABLE "moments"');
expect(sql).toContain('moment_reports_target_check');
expect(sql).toContain('ALTER COLUMN "series_id" DROP NOT NULL');
```

- [ ] Run: `npm test -- tests/db/orbit-halo-migration.test.ts` — expect fail.
- [ ] Add all Moment enums/tables: moments, media, likes, bookmarks, comments, entity joins, reports, and append-only moderation actions. Add composite keys, FKs, `status/created_at/id` feed index, deterministic comment index, duplicate-author source constraint, partial report uniqueness, report/media/counter/self-parent checks.
- [ ] Extend `notifications` with nullable series target, actor, Moment, comment, metadata; add rate-limit table if the helper requires persistence.
- [ ] Run `npm run db:generate`; inspect generated SQL, snapshot, and journal. Do **not** run `npm run db:push`.
- [ ] Run: `npm test -- tests/db/orbit-halo-migration.test.ts && npm run check` — expect pass.
- [ ] Commit: `git add src/lib/server/db/schema.ts drizzle tests/db && git commit -m "feat(halo): add Moment database schema"`.

### Task 3: Implement URL security and safe embeds

**Files:** Create `src/lib/server/embeds/**`; create `src/lib/server/embeds/{url-security,normalize-url,resolver}.test.ts`.

- [ ] Write failing bypass tests:

```ts
for (const url of ['http://example.com', 'https://localhost:3000', 'https://127.0.0.1', 'https://10.0.0.4', 'https://internal.local']) {
  expect(() => parseSafeExternalUrl(url)).toThrow();
}
expect(normalizeUrl('https://youtu.be/abc123?si=x')).toBe('https://www.youtube.com/watch?v=abc123');
```

- [ ] Run: `npm test -- src/lib/server/embeds` — expect fail.
- [ ] Implement exact host matching, HTTPS-only parsing, IP/private/link-local/credentials/port rejection, tracking stripping, YouTube/X canonicalization, provider ID validation, and fallback `ResolvedEmbed` results.
- [ ] Permit only fixed provider endpoint requests with timeout, body cap, and revalidated redirects. Never fetch OTHER URLs or store/render provider HTML.
- [ ] Run: `npm test -- src/lib/server/embeds && npm run check` — expect pass.
- [ ] Commit: `git add src/lib/server/embeds && git commit -m "feat(halo): add safe embed resolution"`.

### Task 4: Validate payloads, cursors, and rate limits

**Files:** Create `src/lib/server/moments/{validation,cursor}.ts`, `src/lib/server/rate-limit/{index,keys}.ts` and tests.

- [ ] Write failing tests for 2,000-char Moment body, 1,000-char comment, four images, tag limits, malformed cursor, and rate-limit retry time.
- [ ] Run: `npm test -- src/lib/server/moments/validation.test.ts src/lib/server/moments/cursor.test.ts src/lib/server/rate-limit/index.test.ts` — expect fail.
- [ ] Implement trimmed parsers with empty optional body mapped to null; URL validation reuse; URL-safe base64 `{ v: 1, createdAt, id }` cursors; payload-size guard before resolution; atomic DB-time fixed window with `Retry-After`.
- [ ] Apply limits: preview 20/10m, create 10/10m, comment 30/10m, like 100/10m, report 10/day, moderation attempt bounded.
- [ ] Run the same test command — expect pass.
- [ ] Commit: `git add src/lib/server/moments src/lib/server/rate-limit && git commit -m "feat(halo): validate Moment requests"`.

### Task 5: Implement Moment services

**Files:** Create `src/lib/server/moments/{permissions,serializers,queries,mutations}.ts` and tests.

- [ ] Write privacy/permission failures:

```ts
expect(serializeMomentAuthor({ id: 'u', username: 'a', displayName: 'A', email: 'a@x.test', role: 'ADMIN' } as never))
  .toEqual({ id: 'u', username: 'a', displayName: 'A' });
expect(canManageMoment({ id: 'u', role: 'USER' }, 'other')).toBe(false);
```

- [ ] Run: `npm test -- src/lib/server/moments` — expect fail.
- [ ] Prove supported transaction semantics for `getDb()` before multi-table writes. Implement public DTOs, `limit + 1` cursor queries, full hydration without N+1, entity visibility checks, create/update/delete, idempotent like/bookmark, one-level reply validation, tombstones, reports, counter protection, and moderation audit in transactions.
- [ ] Run: `npm test -- src/lib/server/moments && npm run check` — expect pass; stop and document if transaction support is unavailable.
- [ ] Commit: `git add src/lib/server/moments && git commit -m "feat(halo): add Moment services"`.

### Task 6: Add Moment API handlers

**Files:** Create `src/routes/api/moments/**`, `src/routes/api/comments/[id]/+server.ts`, `src/routes/api/admin/moments/**`, colocated tests.

- [ ] Write failing handler tests for unauthenticated create, malformed JSON, unsafe URL, duplicate source, author-only PATCH, admin-only moderation, and 429 with `Retry-After`.
- [ ] Run: `npm test -- src/routes/api/moments src/routes/api/comments src/routes/api/admin/moments` — expect fail.
- [ ] Implement `preview`, feed/detail, create/PATCH/DELETE, explicit `PUT/DELETE` like and bookmark, comments, Moment reports, reports queue, and moderation handlers. Map typed service errors to 400/401/403/404/409/422/429; source URL remains immutable on PATCH.
- [ ] Run the same test command — expect pass.
- [ ] Commit: `git add src/routes/api/moments src/routes/api/comments src/routes/api/admin/moments && git commit -m "feat(halo): add Moment APIs"`.

### Task 7: Refactor existing notifications

**Files:** Modify `src/lib/types.ts`, `src/lib/server/notifications.ts`, `src/lib/server/push-notifications.ts`, `src/service-worker.ts`, notification APIs/components/pages and their tests.

- [ ] Write regression tests for both a legacy series target and a Moment target:

```ts
expect(items).toEqual(expect.arrayContaining([
  expect.objectContaining({ target: expect.objectContaining({ kind: 'series' }) }),
  expect.objectContaining({ target: expect.objectContaining({ kind: 'moment' }) })
]));
```

- [ ] Run: `npm test -- src/lib/server/notifications.test.ts src/routes/api/notifications/server.test.ts` — expect fail.
- [ ] Use target-aware joins/batched hydration. Add liked/commented/replied/moderated events; avoid self-notifications; deduplicate active like notification; persist event with mutation then broadcast/push after commit without failing the action. Use locale-aware stored target URLs for click navigation.
- [ ] Run: `npm test -- src/lib/server/notifications.test.ts src/routes/api/notifications` — expect pass.
- [ ] Commit: `git add src/lib/types.ts src/lib/server/notifications.ts src/lib/server/push-notifications.ts src/service-worker.ts src/routes/api/notifications src/lib/components/NotificationDropdown.svelte && git commit -m "feat(halo): extend notifications for Moments"`.

### Task 8: Add Halo layout and navigation

**Files:** Create `src/routes/[lang=lang]/(orbit-halo)/+layout.{server.ts,svelte}`, `src/lib/components/halo/{HaloSidebar,HaloBottomNav,HaloTopBar,DiscoveryPanel}.svelte`; modify navigation, bottom nav, `messages/{th,en}.json`; add layout test.

- [ ] Write a failing isolation test that asserts Halo navigation renders and main app navigation/back-to-top does not.
- [ ] Run: `npm test -- src/routes/[lang=lang]/(orbit-halo)/layout.test.ts` — expect fail.
- [ ] Build desktop 3-column shell and mobile feed-first shell with safe-area bottom nav, prominent Create, Back to GL-Orbit, and all Thai/English Paraglide keys.
- [ ] Run: `npm test -- src/routes/[lang=lang]/\(orbit-halo\)/layout.test.ts && npm run check` — expect pass.
- [ ] Commit: `git add src/routes/[lang=lang]/\(orbit-halo\) src/lib/components/halo src/lib/components/Navigation.svelte src/lib/components/BottomNav.svelte messages && git commit -m "feat(halo): add dedicated Halo layout"`.

### Task 9: Build feed, composer, and embeds

**Files:** Create listed `src/lib/components/moments/{MomentComposer,MomentCard,MomentFeed,MomentActions,MomentEntityTags,MomentMediaGallery,MomentSkeleton}.svelte`, embed components, and `halo/+page.{server.ts,svelte}` with tests.

- [ ] Write failing tests that fallback embeds show hostname, publish is disabled until a valid preview, and feed de-duplicates item IDs.
- [ ] Run: `npm test -- src/lib/components/moments` — expect fail.
- [ ] Implement preview/create states, bounded image/tag inputs, responsive cards, IntersectionObserver pagination with abort/stale-response/retry handling, controlled lazy YouTube iframe, once-only near-viewport TikTok/X scripts, fixed placeholders, broken image fallback, and no `{@html}`.
- [ ] Run: `npm test -- src/lib/components/moments && npm run check` — expect pass.
- [ ] Commit: `git add src/lib/components/moments src/routes/[lang=lang]/\(orbit-halo\)/halo && git commit -m "feat(halo): add Moment feed and composer"`.

### Task 10: Build detail, comments, and community surfaces

**Files:** Create Moment detail route, `MomentComments`, `MomentCommentItem`, `MomentReportDialog`; create saved/explore/notifications/profile/community-profile routes; tests.

- [ ] Write failures for no nested reply action, 404 hidden detail, private saved feed, and locale-preserving login link.
- [ ] Run: `npm test -- src/lib/components/moments src/routes/[lang=lang]/(orbit-halo)` — expect fail.
- [ ] Implement server-loaded detail, comment/reply/tombstone/report flow, optimistic idempotent actions only, saved/profile/explore/alerts surfaces using reusable feed filters, accessible controls, and user-visible loading/error states.
- [ ] Run the same test command — expect pass.
- [ ] Commit: `git add src/lib/components/moments src/routes/[lang=lang]/\(orbit-halo\) && git commit -m "feat(halo): add community surfaces"`.

### Task 11: Integrate entities and admin moderation

**Files:** Modify series/artist/ship detail loaders/pages; create `src/routes/[lang=lang]/admin/moments/reports/**`; modify admin layout; add tests.

- [ ] Write failures for a `/th/halo?seriesId=…` entity link, admin guard, and visible audit action/reason.
- [ ] Run: `npm test -- tests/halo-entity-links.test.ts src/routes/api/admin/moments src/routes/[lang=lang]/admin/moments/reports` — expect fail.
- [ ] Add small Latest Moments sections only; never a second infinite feed. Add report queue/filter/actions using existing admin guard and append-only audit display.
- [ ] Run the same test command — expect pass.
- [ ] Commit: `git add src/routes/[lang=lang]/\(app\)/series src/routes/[lang=lang]/\(app\)/artists src/routes/[lang=lang]/\(app\)/ships src/routes/[lang=lang]/admin src/routes/api/admin/moments tests && git commit -m "feat(halo): add Moment moderation"`.

### Task 12: Add narrow CSP and verify

**Files:** Modify `src/hooks.server.ts`; add `src/hooks.server.test.ts`; create `docs/testing/orbit-halo-real-db-boundary.md`.

- [ ] Write failing header test:

```ts
expect(csp).toContain("frame-src 'self' https://www.youtube-nocookie.com");
expect(csp).not.toContain('frame-src *');
```

- [ ] Run: `npm test -- src/hooks.server.test.ts` — expect fail.
- [ ] Add CSP only for tested provider origins; no wildcard or unsafe directive. Check PWA, push, and existing pages remain functional.
- [ ] Record real-DB follow-up: disposable PostgreSQL must verify migration, transaction rollback, partial uniqueness, concurrent counters, and cascades; this work must not run Neon migration.
- [ ] Run: `npm run check && npm test && npm run build` — expect all exit 0.
- [ ] Commit: `git add src/hooks.server.ts src/hooks.server.test.ts docs/testing && git commit -m "feat(halo): harden external content policy"`.

## Acceptance criteria

- [ ] Migration exists in git but is not pushed to Neon.
- [ ] No Moment/provider content uses `{@html}` or arbitrary server URL fetching.
- [ ] Existing series notifications continue to work.
- [ ] Halo works in Thai and English, desktop and mobile.
- [ ] Public DTOs never leak email, role, session, or tokens.
- [ ] All mutation authorization, rate limits, moderation audit, and hidden-content rules have tests.
- [ ] `npm run check`, `npm test`, and `npm run build` pass.
