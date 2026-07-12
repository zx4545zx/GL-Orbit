# Halo Social Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Halo mock composer with an accessible social composer that supports text, optional source links with automatic previews, local image selection, emoji insertion, and post-then-upload publication.

**Architecture:** Make source metadata nullable so text-only and image-only Moments are valid; keep `sourceProvider` populated as `OTHER` when no source exists. Image-only submissions create an `UPLOADING` Moment with the expected upload count, then each user-authorized upload appends managed R2 media and atomically publishes the Moment after the final file. Preview requests are debounced and isolated from publishing; local file previews never leave the browser until the post action begins.

**Tech Stack:** Svelte 5 runes, SvelteKit request handlers, TypeScript, Drizzle/PostgreSQL, Cloudflare R2, Vitest, Tailwind CSS 4.

---

## File structure

- Modify `src/lib/server/db/schema.ts`: make source URL/canonical URL nullable and add the short-lived upload state/count.
- Create a generated Drizzle migration under `drizzle/`: change the two source columns, enum, and expected-upload count.
- Modify `src/lib/server/moments/validation.ts`: normalize optional source URLs; require at least one body/source/image value.
- Modify `src/lib/server/moments/mutations.ts`: create source-less Moments and append uploaded R2 media.
- Modify `src/routes/api/moments/service.ts`: resolve embeds only when a source URL exists.
- Modify `src/routes/api/moments/+server.ts`: retain its create endpoint with the expanded request contract.
- Modify `src/lib/images/config.ts`: add a `moments` R2 image variant family.
- Create `src/routes/api/moments/[id]/media/+server.ts`: authenticated owner-only Moment image upload endpoint.
- Modify `src/lib/components/moments/MomentComposer.svelte`: social toolbar, local image preview, emoji chooser, debounced URL preview, and post-then-upload flow.
- Modify or create the focused test files listed below; retain existing source-string UI tests if no DOM harness exists.

### Task 1: Make a Moment source optional in schema and validation

**Files:**
- Modify: `src/lib/server/db/schema.ts:197-220`
- Modify: `src/lib/server/moments/validation.ts:1-16`
- Modify: `src/lib/server/moments/validation.test.ts`
- Create: generated `drizzle/XXXX_optional_moment_source.sql`

- [ ] **Step 1: Write failing validation tests**

```ts
it('accepts a text-only Moment', () => {
  expect(parseCreateMoment({ body: 'hello' })).toMatchObject({
    ok: true,
    value: { body: 'hello', sourceUrl: null, imageUrls: [] }
  });
});

it('accepts an image-only Moment intent and rejects an empty Moment', () => {
  expect(parseCreateMoment({ pendingMediaCount: 1 }).ok).toBe(true);
  expect(parseCreateMoment({}).ok).toBe(false);
});
```

- [ ] **Step 2: Run the validation test and confirm failure**

Run: `npm test -- src/lib/server/moments/validation.test.ts`

Expected: FAIL because `sourceUrl` remains required.

- [ ] **Step 3: Make source fields nullable and implement normalized optional input**

In `schema.ts`, change only these columns:

```ts
sourceUrl: text('source_url'),
sourceCanonicalUrl: text('source_canonical_url'),
sourceProvider: momentSourceProviderEnum('source_provider').notNull(),
pendingMediaCount: integer('pending_media_count').notNull().default(0),
```

Replace the validation input/result contract and parsing branch with this behavior:

```ts
type CreateMomentInput = { sourceUrl?: unknown; body?: unknown; imageUrls?: unknown; pendingMediaCount?: unknown };

// Normalize sourceUrl to null when omitted/blank. Validate it with
// parseSafeExternalUrl only when non-null. Normalize body to null, validate
// each supplied image URL, validate pendingMediaCount from 0 through
// MAX_MOMENT_IMAGES, then reject only when body, sourceUrl, imageUrls, and
// pendingMediaCount are all empty.
```

Return `{ sourceUrl: string | null, body: string | null, imageUrls: string[], pendingMediaCount: number }` so all downstream callers use one stable shape.

- [ ] **Step 4: Generate and inspect the migration**

Run: `npm run db:generate`

Expected: a new migration containing `ALTER TABLE "moments" ALTER COLUMN "source_url" DROP NOT NULL;`, the equivalent `source_canonical_url` statement, `ALTER TYPE "moment_status" ADD VALUE 'UPLOADING';`, and the `pending_media_count` column. Do not run `db:push` against a shared database without the user's explicit database-migration approval.

- [ ] **Step 5: Run validation tests**

Run: `npm test -- src/lib/server/moments/validation.test.ts`

Expected: PASS.

### Task 2: Persist source-less Moments without weakening source-backed behavior

**Files:**
- Modify: `src/lib/server/moments/mutations.ts:4-42`
- Modify: `src/lib/server/moments/mutations.test.ts`
- Modify: `src/routes/api/moments/service.ts:1-16`
- Create: `src/routes/api/moments/server.test.ts`

- [ ] **Step 1: Write failing mutation and request-parser tests**

```ts
it('creates a text-only Moment in one transaction', async () => {
  await createMoment({ authorId: 'user-1', body: 'hello', sourceUrl: null,
    sourceCanonicalUrl: null, provider: 'OTHER', imageUrls: [] });
  expect(transaction).toHaveBeenCalledOnce();
  expect(transaction.mock.calls[0][0]).toHaveLength(1);
});

it('does not resolve an embed when sourceUrl is absent', async () => {
  await expect(parseMomentRequest(new Request('http://test', {
    method: 'POST', body: JSON.stringify({ body: 'hello', seriesIds: [], artistIds: [], shipIds: [] })
  }))).resolves.toMatchObject({ sourceUrl: null, provider: 'OTHER' });
  expect(resolveEmbed).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npm test -- src/lib/server/moments/mutations.test.ts src/routes/api/moments/server.test.ts`

Expected: FAIL because the input types and service unconditionally require/resolve `sourceUrl`.

- [ ] **Step 3: Implement optional source handling**

Change the mutation input fields and insert interpolation to nullable values:

```ts
sourceUrl: string | null;
sourceCanonicalUrl: string | null;
// sourceProvider stays NOT NULL; use OTHER for a source-less Moment.
pendingMediaCount: number;
```

In `parseMomentRequest`, preserve current ID validation, then branch:

```ts
const embed = parsed.value.sourceUrl
  ? await resolveEmbed(parsed.value.sourceUrl)
  : { canonicalUrl: null, provider: 'OTHER' as const, externalId: undefined,
      status: 'FALLBACK' as const, metadata: {} };
```

Validate `pendingMediaCount` as an integer from 0 through `MAX_MOMENT_IMAGES`. The request is valid when it contains body, source URL, external image URLs, or a positive pending count. Return the existing payload shape with canonical URL `null` when source-less. Keep the unique index unchanged: PostgreSQL permits multiple `NULL` canonical URLs, while source-backed deduplication remains active.

- [ ] **Step 4: Add route contract tests**

Mock `createMoment` and assert `POST /api/moments` returns:

```ts
expect(response.status).toBe(201); // body-only with authenticated local user
expect(response.status).toBe(400); // no body, source, or image URL
expect(response.status).toBe(401); // unauthenticated
```

Mock `resolveEmbed` for the source-backed case and assert its canonical output reaches `createMoment`.

- [ ] **Step 5: Run server and mutation tests**

Run: `npm test -- src/lib/server/moments/mutations.test.ts src/routes/api/moments/server.test.ts`

Expected: PASS.

### Task 3: Add managed Moment image upload endpoint

**Files:**
- Modify: `src/lib/images/config.ts:1-20`
- Modify: `src/lib/server/moments/mutations.ts:19-31`
- Create: `src/routes/api/moments/[id]/media/+server.ts`
- Create: `src/routes/api/moments/[id]/media/server.test.ts`
- Modify: `src/lib/server/moments/mutations.test.ts`

- [ ] **Step 1: Write failing upload endpoint tests**

Cover exact outcomes using mocked `uploadImage`, owner lookup/append mutation, and a `File` in `FormData`:

```ts
expect(response.status).toBe(401); // no locals.user
expect(response.status).toBe(403); // Moment owned by another user
expect(response.status).toBe(400); // missing file or fifth image
expect(response.status).toBe(201); // valid owner upload
await expect(response.json()).resolves.toEqual({ url: 'https://cdn.example/images/moments/a/1080.jpg' });
```

- [ ] **Step 2: Run the new test and confirm failure**

Run: `npm test -- src/routes/api/moments/[id]/media/server.test.ts`

Expected: FAIL because the route and Moment image type do not exist.

- [ ] **Step 3: Add the Moment R2 variant family**

Extend types and URL regexes consistently:

```ts
export type ImageType = 'posters' | 'profiles' | 'moments';
moments: { widths: [480, 1080], formats: ['avif', 'webp', 'jpg'] as const, fallback: 1080 }
```

Include `moments` in `CANONICAL_RE`, `LEGACY_RE`, and `isManagedImageUrl`. This allows `uploadImage(file, 'moments')` to produce managed, responsive URLs without changing its existing size/type checks.

- [ ] **Step 4: Add owner-checked media mutation and endpoint**

Add `UPLOADING` to `momentStatusEnum`, add a non-negative `pendingMediaCount`, and have `createMoment` use `UPLOADING` only when the validated pending count is positive. Add a server mutation that, in one transaction, confirms the Moment belongs to the authenticated author and is `UPLOADING` or `PUBLISHED`, counts existing media, then inserts:

```sql
INSERT INTO moment_media (id, moment_id, source_type, storage_key, external_url, sort_order)
VALUES (:id, :momentId, 'UPLOAD', :key, :url, :nextSortOrder)
```

After the insert, update the Moment to `PUBLISHED` only when its actual uploaded-media count equals `pending_media_count`; otherwise retain `UPLOADING`. Return `false` when ownership fails or four images already exist. The handler must:

1. require `locals.user`,
2. reject a content length over 4 MB,
3. read `formData.get('file')` as a `File`,
4. call `uploadImage(file, 'moments')`,
5. append `{ url, key }` through the owner-checked mutation,
6. return `201 { url }` only after persistence.

Return Thai errors matching the admin upload route for invalid files, and a clear `403` for a non-owner. Do not accept `momentId`, storage keys, or URLs from the request body.

- [ ] **Step 5: Add transactional mutation test**

Assert the append operation sends the ownership/count guard and insert together in one Neon HTTP transaction, and never exposes a raw R2 key to the browser response.

- [ ] **Step 6: Run upload-focused tests**

Run: `npm test -- src/routes/api/moments/[id]/media/server.test.ts src/lib/server/moments/mutations.test.ts`

Expected: PASS.

### Task 4: Replace mock composer with the social publication flow

**Files:**
- Modify: `src/lib/components/moments/MomentComposer.svelte:1-93`
- Modify: `src/lib/components/moments/halo-ui.test.ts`
- Create: `src/lib/components/moments/MomentComposer.test.ts`

- [ ] **Step 1: Write failing behavior tests**

Use the repository's source-level component test convention unless a Svelte DOM test harness is added. Assert the composer source contains and uses:

```ts
expect(source).toContain('oninput={schedulePreview}');
expect(source).toContain("fetch('/api/moments/preview'");
expect(source).toContain("fetch('/api/moments'");
expect(source).toContain('/api/moments/${moment.id}/media');
expect(source).toContain('URL.createObjectURL');
expect(source).toContain('accept="image/jpeg,image/png,image/webp"');
```

Add assertions that publication is enabled when any of `body.trim()`, `url.trim()`, or selected images exists, and no longer requires `type="url"` content.

- [ ] **Step 2: Run the component test and confirm failure**

Run: `npm test -- src/lib/components/moments/MomentComposer.test.ts src/lib/components/moments/halo-ui.test.ts`

Expected: FAIL because composer has mock timers, no file state, and URL-only publish eligibility.

- [ ] **Step 3: Add composer state and safe local preview lifecycle**

Use focused local state:

```ts
type SelectedImage = { file: File; objectUrl: string };
type ComposerState = 'idle' | 'resolving' | 'preview-ready' | 'publishing' | 'error';
let selectedImages = $state<SelectedImage[]>([]);
let preview = $state<ResolvedEmbed | null>(null);
let linkOpen = $state(false);
let errorMessage = $state<string | null>(null);
const canPublish = $derived(signedIn && (body.trim().length > 0 || url.trim().length > 0 || selectedImages.length > 0) && composerState !== 'publishing');
```

On valid image input, reject files beyond four and any MIME outside JPEG/PNG/WebP or size above 4 MB, create an object URL for each accepted file, and revoke it when removed and when the component is destroyed. Never call the upload endpoint here.

- [ ] **Step 4: Add compact social UI**

Keep the existing avatar and body textarea. Replace the always-open rounded URL well with a toolbar of three accessible 44px buttons:

```svelte
<button type="button" aria-label={copy.addImage} onclick={() => fileInput?.click()}><HaloIcon name="image" size={18} /></button>
<button type="button" aria-label={copy.addEmoji} onclick={() => emojiOpen = !emojiOpen}><HaloIcon name="smile" size={18} /></button>
<button type="button" aria-label={copy.addLink} onclick={() => linkOpen = !linkOpen}><HaloIcon name="link" size={18} /></button>
<input bind:this={fileInput} class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onchange={selectImages} />
```

Use the project's existing `HaloIcon` names or add only the missing icon paths to `HaloIcon.svelte`. Render removable thumbnails in a small grid, an emoji popover with a fixed curated list, and the source-link input only while `linkOpen` or a URL exists. Preserve Thai/English copy through the existing `copy` derived object.

- [ ] **Step 5: Implement debounced optional URL preview**

On URL input, clear a pending timeout and schedule a request after 400 ms. Skip the request for a blank URL; clear preview without blocking publication. For a nonblank URL:

```ts
const response = await fetch('/api/moments/preview', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ sourceUrl: url.trim() })
});
```

Ignore stale responses with a monotonically increasing request ID. On success, render a compact preview using returned provider/metadata and the canonical URL. On failure, show an inline Thai warning but leave the optional field editable and permit a text/image-only post.

- [ ] **Step 6: Implement post-then-upload without duplicate posts**

In `publish()`:

1. preserve a snapshot of body, URL, and files;
2. POST `/api/moments` with `{ body: body.trim() || undefined, sourceUrl: url.trim() || undefined, pendingMediaCount: selectedImages.length, seriesIds: [], artistIds: [], shipIds: [] }`;
3. if creation fails, restore idle/error state without clearing input;
4. after `201`, upload snapshot files sequentially with `FormData` to `/api/moments/${id}/media`;
5. if upload fails, retain composer state and store the created Moment ID plus remaining files so Retry uploads only remaining files rather than repeating create; the incomplete Moment stays `UPLOADING` and is excluded from the feed;
6. after all uploads succeed, the final media endpoint atomically publishes the Moment; then revoke object URLs, clear all composer state, set a success live message, and call `invalidateAll()` or dispatch a completion event consumed by `MomentFeed` to refresh the feed.

Add `aria-live="polite"` status text, lock all form controls while publishing, and keep current focus-ring and coral primary button styling.

- [ ] **Step 7: Run component tests**

Run: `npm test -- src/lib/components/moments/MomentComposer.test.ts src/lib/components/moments/halo-ui.test.ts`

Expected: PASS.

### Task 5: Verify the integrated change

**Files:**
- Modify only files required by fixes discovered below.

- [ ] **Step 1: Run all Moment-related tests**

Run: `npm test -- src/lib/server/moments src/routes/api/moments src/lib/components/moments`

Expected: PASS.

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run: `npm run check`

Expected: exit code 0.

- [ ] **Step 3: Manual browser verification**

Run: `npm run dev`

Check `/th/halo` as a signed-in user:

1. text-only, image-only, URL-only, and mixed publication each enable `โพสต์`;
2. pasting an X, TikTok, YouTube, and ordinary HTTPS URL shows an automatic preview or non-blocking fallback;
3. select, remove, and replace up to four images without network upload before `โพสต์`;
4. a forced failed upload retains all original input and Retry does not create a second Moment;
5. keyboard focus, screen-reader labels, Thai text, and narrow mobile width remain usable.

- [ ] **Step 4: Review generated migration before deployment**

Run: `npm run db:generate && git diff -- drizzle/ src/lib/server/db/schema.ts`

Expected: only nullable source columns plus `UPLOADING`/`pending_media_count` migration and schema changes. Do not apply it to Neon until the user gives explicit consent for the database change.
