---
date: 2026-06-05
topic: "Image Runtime Caching via Workbox SW"
status: draft
---

# Image Runtime Caching via Workbox Service Worker

## Problem Statement

GL-Orbit displays remote image URLs stored in the database for posters (`series.posterUrl`), artist avatars (`artists.profileImageUrl`), platform/studio logos (`platforms.logoUrl`, `studios.logoUrl`), and user avatars (`users.avatarUrl`). All of these are external URLs pointing to CDNs, image hosts, or streaming platforms.

The current PWA setup precaches only the app shell (HTML, CSS, JS, fonts). Image bytes are never cached by the service worker. This means:

1. **Repeated network fetches** — Every navigation to a series detail page, admin panel, or the calendar re-downloads the same poster/avatar bytes from remote hosts
2. **Offline gaps** — Even with the PWA installed, images fail to load when the device is offline; only the app shell is available
3. **Performance variability** — Image load speed depends entirely on the remote host's CDN performance; posters from slow servers delay First Contentful Paint for image-heavy views
4. **Data waste** — Mobile users re-download identical poster bytes across sessions with no local reuse

## Constraints

- **Stack is fixed**: SvelteKit 2.x, Svelte 5 (Runes), `@vite-pwa/sveltekit` v1.x plugin, Tailwind CSS 4, Vite 6
- **No image proxy or server-side resizing**: Out of scope — no custom image upload, transformation, or resize endpoint
- **No data-fetching changes**: In phase 1, do not change how images are rendered in Svelte components or how image URLs come from the database
- **No UI modification**: `<img>` tags keep their existing `src` attributes; caching is transparent
- **Service worker conflict**: The project currently has BOTH a native `src/service-worker.ts` (using `$service-worker`) AND the `@vite-pwa/sveltekit` plugin configured in `generateSW` mode (Workbox). Dual registration is likely happening — the native SW caches all GET requests cache-first, while Workbox precaches `{html,css,js,woff2}` only
- **Must pass `npm run check`**: TypeScript strict mode must be satisfied
- **Phase 1 scope only**: Cache shape and SW ownership consolidation; no UI fallback, no skeleton for images, no blur-up placeholders

## Chosen Approach

**Option A: Workbox Runtime Caching (chosen)**

Add a `runtimeCaching` entry to the existing `SvelteKitPWA` plugin configuration for image requests. Consolidate service worker ownership under Workbox by removing the native `src/service-worker.ts` (subject to implementation verification that the plugin fully replaces it).

**Why Option A:**
- Leverages existing `@vite-pwa/sveltekit` Workbox infrastructure — zero new dependencies
- Workbox handles SW lifecycle, precaching, and runtime caching from a single config
- Cache-first strategy for images works because images are immutable resources identified by URL
- Built-in expiration (max entries + max age) prevents unbounded cache growth
- Simple to implement, test, and roll back

**Alternative B: Custom Native Service Worker — REJECTED**

Extend `src/service-worker.ts` with explicit image fetch handling.

- **Rejected because:** Would perpetuate the dual-SW conflict; manual cache management reimplements Workbox functionality; no expiration, quota management, or strategy helpers without extra code; `@vite-pwa/sveltekit` already handles registration and updates

**Alternative C: Server-Side Image Proxy — REJECTED**

Route all image requests through a SvelteKit server endpoint (`/api/image-proxy?url=...`) that fetches, caches on the server, and returns images.

- **Rejected because:** Adds server-side bandwidth and storage costs (Neon/Serverless); introduces a new API surface and potential SSRF risk; each image load requires a round-trip to the SvelteKit server; out of scope for phase 1

## Architecture

After consolidation:

```
                         Browser
                            │
                     ┌──────┴──────┐
                     │  SW  (Workbox-generated via @vite-pwa/sveltekit)
                     │             │
                     │  ┌─────────┐│
                     │  │Precache ││  → app shell (html, css, js, woff2)
                     │  └─────────┘│
                     │  ┌─────────┐│
                      │  │Img Cache││  → images (cache-first, max 60 entries, 30d)
                     │  └─────────┘│
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         App Shell      Remote Images   API calls
         (instant)    (cached after  (not cached
                        first load)    in phase 1)
```

### Service Worker Ownership

**Current (conflict):**

| Source | Mode | Manages |
|--------|------|---------|
| `src/service-worker.ts` | Native SvelteKit | All GET requests, cache-first |
| `@vite-pwa/sveltekit` Workbox | GenerateSW | App shell precache |

**Target (consolidated):**

| Source | Mode | Manages |
|--------|------|---------|
| ~~`src/service-worker.ts`~~ | Removed | — |
| `@vite-pwa/sveltekit` Workbox | GenerateSW + runtimeCaching | App shell precache + image runtime cache |

**Verification needed during implementation:** Build the project, inspect the generated SW file, and confirm that Workbox's generated SW (a) includes both precache and runtime caching rules and (b) does not conflict with any residual SvelteKit SW registration. If the plugin already suppresses SvelteKit's native SW in generateSW mode, removal of `src/service-worker.ts` is purely cosmetic but eliminates confusion.

### Cache Key Strategy

Images are keyed by their full request URL (including query strings). Since images are served from CDNs that may vary query params for cache busting, the cache key is the URL as requested.

### Isolation from API Caching

The image cache uses a separate named cache (`gl-orbit-images`) from the app shell cache (`workbox-precache-v2` or similar). This prevents:
- Image blobs from evicting app shell assets
- App shell cache eviction policies from affecting cached images
- Separate quota monitoring per cache

## Components

### 1. `vite.config.ts` — Add runtimeCaching to Workbox config

**Changed fields:**
- `workbox.runtimeCaching`: New array with one image caching rule
- `workbox.globPatterns`: Unchanged (app shell only)
- Optionally update `workbox.navigateFallback` and `workbox.navigateFallbackDenylist` if needed

No other files in this change set. The manifest (`icons`, `display`, etc.) stays unchanged.

### 2. `src/service-worker.ts` — Remove (subject to verification)

Delete the file only after confirming that:
- The Workbox-generated SW handles all needed caching
- No residual SvelteKit SW registration occurs
- The build output contains a single SW with both precache and runtime caching logic

If removal is unsafe, the file stays with a comment noting it's superseded by Workbox.

### 3. Regression Test Plan (manual, covered below)

Standard PWA verification checklist after the change.

## Data Flow

### First visit to a page with images

```
User opens /series/[id]
    │
    ▼
Browser requests page HTML (network)
    │
    ▼
SvelteKit server renders page with <img src="https://cdn.example.com/poster.jpg">
    │
    ▼
SW (Workbox) intercepts:
    ├── /_app/immutable/*.css  → precache match → instant
    ├── /_app/immutable/*.js   → precache match → instant
    ├── /_app/immutable/*.woff2 → precache match → instant
    ├── /api/series/*          → network only (no cache rule) → network
    └── https://cdn.example.com/poster.jpg  → runtime cache MISS
              │
              ▼
        Fetch from network → response status 200
              │
              ▼
        Put in gl-orbit-images cache (cache-first, maxAge: 30d, maxEntries: 60)
              │
              ▼
        Return image to browser
```

### Subsequent visits

```
User navigates to another page with same poster or returns to series/[id]
    │
    ▼
<img src="https://cdn.example.com/poster.jpg">
    │
    ▼
SW intercepts → runtime cache HIT (gl-orbit-images)
    │
    ▼
Return cached image → 0 network latency
```

### Cache expiration

When the `gl-orbit-images` cache exceeds 60 entries, Workbox evicts the oldest entry (LRU-like within the maxEntries constraint). When an entry exceeds 30 days, it is not returned and the network fetch is used instead, which then refreshes the cache.

## Workbox Runtime Caching Rule

```ts
workbox: {
  globPatterns: ['**/*.{html,css,js,woff2}'],
  runtimeCaching: [
    {
      urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|avif)(?:\?.*)?$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gl-orbit-images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,  // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
},
```

**Design notes on each field:**

| Field | Value | Rationale |
|-------|-------|-----------|
| `urlPattern` | `/\.(?:png|jpg|jpeg|gif|svg|webp|avif)(?:\?.*)?$/i` | Matches standard image extensions with optional query params; case-insensitive |
| `handler` | `CacheFirst` | Images are immutable by URL; if cached, serve instantly |
| `cacheName` | `gl-orbit-images` | Isolated named cache; does not collide with Workbox precache |
| `maxEntries` | `60` | Bounds cache size; 60 typical poster/avatar images ≈ ~30–60 MB (safe for most mobile quotas) |
| `maxAgeSeconds` | `2,592,000` (30d) | Images rarely change URLs; 30 days is reasonable for posters/avatars |
| `statuses: [0, 200]` | Opaque (0) + OK (200) | Status 0 includes opaque responses from CDNs (cross-origin); status 200 for same-origin images |

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Cache HIT, image still valid | Served from cache, no network request |
| Cache MISS, network success | Fetched from network, cached, served to page |
| Cache MISS, network failure | Workbox CacheFirst falls through to browser default — image shows broken in page (same as today) |
| Cache HIT, image expired (30d) | Expired entry treated as MISS → network fetch → re-cached |
| Cache full (60 entries) | Oldest entry evicted before adding new one |
| Opaque response (cross-origin CDN) | Cached if status 0; browser will render it (opaque responses work in `<img>` tags) |
| Image URL changes (new poster) | New URL = new cache key = cache MISS → network fetch → cached under new key; old entry eventually evicted |
| Quota exceeded (StorageEstimate) | Workbox catches QuotaExceededError from Cache API; cache operation fails silently; image loads from network |

### What we do NOT handle in phase 1

- **No UI fallback image**: If cache miss + network fail, the browser shows its default broken-image icon. A global `<img>` error handler fallback is deferred
- **No blur-up or LQIP**: Placeholder/base64 preview is out of scope
- **No API response caching**: Only image bytes; API JSON responses are not cached in this phase
- **No cache warming**: Images are cached on first access, not proactively prefetched
- **No admin purge button**: Clearing an individual cached image requires SW unregister or manual DevTools clear

## Testing Strategy

### Source-Level Verification (code review)

These assertions can be verified by reading the final `vite.config.ts`:

1. `runtimeCaching` array exists in the Workbox config
2. `urlPattern` matches image extensions (png, jpg, jpeg, gif, svg, webp, avif) with optional query params
3. `handler` is `'CacheFirst'` — not `NetworkFirst` or `StaleWhileRevalidate`
4. `maxEntries` is set (not infinite)
5. `maxAgeSeconds` is set (bounded cache lifetime)
6. Cache name is `'gl-orbit-images'` — does not collide with `'workbox-precache-*'`

### Build Verification

1. Run `npm run build`
2. Confirm `build/` contains a generated service worker file (`.js`)
3. Inspect the generated SW: confirm it contains both precache manifest and the `gl-orbit-images` runtime caching rule
4. Confirm the SW version hash changes (cache busting works)

### Type Check

1. `npm run check` passes with zero errors
2. No type errors from Workbox-related config types

### Runtime Verification (DevTools)

| Test Case | Steps | Expected |
|-----------|-------|----------|
| First image load | Open any series detail page | Network tab shows image request from CDN; SW intercepts |
| Cached image load | Navigate away and back to same page | Network tab shows "(from ServiceWorker)" for image |
| Cache entry exists | DevTools > Application > Cache Storage > `gl-orbit-images` | Image entry present with correct URL key |
| Offline image | Airplane mode → revisit page with cached images | Images render from cache; app shell renders |
| Offline uncached image | Airplane mode → visit page with new image | Image shows broken; page content renders |
| Cache eviction | Load >60 unique images | Oldest entries evicted; cache stays at ≤60 entries |

### Regression Checks

1. All existing pages render without image loading regressions
2. `npm run build` succeeds (no PWA plugin errors)
3. Manual install PWA → offline → app shell works and cached images appear
4. No double-registration of service workers in DevTools > Application > Service Workers

## Open Questions

1. **Native SW removal safety**: Does `@vite-pwa/sveltekit` in `generateSW` mode fully suppress SvelteKit's native service worker when `src/service-worker.ts` exists, or does the native SW still register alongside Workbox?
   - *To be determined during implementation by inspecting build output and DevTools SW registration. If the native SW is already suppressed, removal is safe. If not, we must keep the native SW (or switch to injectManifest mode) and add runtime caching logic to `src/service-worker.ts` instead.*

2. **`maxEntries` tuning**: 60 entries is an estimate based on typical app usage (posters, avatars, logos). Should this be raised (100) or lowered (30)?
   - *Decision deferred until phase 1. Can be adjusted without code change. Start with 60.*

3. **Image format additions**: Should the `urlPattern` include `.ico` (favicons) or `.svg` is already adequate?
   - *`.ico` excluded intentionally — favicons are tiny and not worth caching overhead. `.svg` included because platform logos are often SVGs.*

4. **`start_url` and `scope` in manifest**: The current PWA manifest has no explicit `start_url` or `scope`. Is this worth adding for better install experience?
   - *Nice-to-have enhancement outside the image caching scope. Add as a minor improvement alongside the SW changes.*

5. **Vite-PWA plugin generateSW vs injectManifest**: Is there a need for full custom SW logic (e.g., background sync, push notifications) that would make `injectManifest` mode more appropriate?
   - *Not in phase 1. `generateSW` with `runtimeCaching` is sufficient for now.*

## Implementation Plan

### Step 1: Add runtimeCaching to workbox config

File: `vite.config.ts`
- Add the `runtimeCaching` array as shown above
- Keep all other config unchanged

### Step 2: Remove native service-worker.ts (after verification)

File: `src/service-worker.ts`
- Delete only after confirming Workbox fully replaces it
- If verification shows dual registration, switch to injectManifest mode instead

### Step 3: Run full verification

- `npm run build` → confirm generated SW contains the runtime caching rule
- `npm run check` → zero type errors
- DevTools manual verification per testing strategy

### Step 4: (Optional) Add `start_url` and `scope` to manifest

Enhance the PWA manifest if desired but not required for image caching.

## Files Changed

| File | Change | Type |
|------|--------|------|
| `vite.config.ts` | Add `workbox.runtimeCaching` array | Edit |
| `src/service-worker.ts` | Remove after verification (or leave with deprecation comment) | Delete |

No other files in phase 1.
