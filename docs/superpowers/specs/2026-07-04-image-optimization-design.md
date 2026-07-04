# Image Optimization (sharp pre-process) — Design Spec

**Date:** 2026-07-04
**Status:** validated
**Scope:** ระบบ optimize รูปภาพเพื่อยกระดับ LCP / Core Web Vitals — ประมวลผลหลายขนาด + AVIF/WebP ตอนอัปโหลด เก็บใน Cloudflare R2 แล้ว render ผ่าน `<picture>`/srcset

---

## Problem Statement

ปัจจุบันระบบอัปโหลดรูป (`uploadImage()` ใน `src/lib/server/r2.ts`) เก็บรูป **ต้นฉบับ 1 ขนาด** ที่ `images/{type}/{uuid}.{ext}` และ DB เก็บ URL เดียว ทุกหน้า (series listing/detail, home, calendar, profile, artists) จึงโหลดรูปขนาดเดียวกัน ไม่ว่าจะแสดงบนการ์ดเล็กหรือ hero ใหญ่

ผลกระทบ:
- **LCP บนมือถือแย่** — ดาวน์โหลดรูป poster ขนาดใหญ่ (สูงสุด 4 MB) ทั้งที่การ์ดแสดงแค่ ~300px
- **ไม่มี responsive srcset / format สมัยใหม่** — เบราว์เซอร์เลือกขนาดไม่ได้, ไม่มี AVIF/WebP
- **Cache header ไม่ได้ตั้ง** — R2 objects ไม่มี `Cache-Control: immutable` ทำให้เข้าซ้ำโหลดใหม่
- **`<img>` หลายจุดขาด `width`/`height`/`loading`/`fetchpriority`** (เช่น admin series hero, profile cover preview) — เกิด layout shift

**เป้าหมาย:** รูป poster/profile ที่ไหลผ่าน upload path ต้องถูกประมวลผลเป็นหลายขนาด + หลายฟอร์แมต แล้วเสิร์ฟผ่าน `<picture>`/srcset + cache แบบ immutable เพื่อลด LCP บนมือถืออย่างชัดเจน โดยไม่มีค่ารันไทม์รายเดือน

---

## Constraints

- **App deploy บน Vercel, รูปเก็บบน Cloudflare R2** — ไม่ใช้ Cloudflare Image Resizing, ไม่ใช้ Vercel Image Optimization (quota)
- **ไม่เปลี่ยน schema ของ DB** — DB ยังเก็บ URL เดียวต่อฟิลด์ การ derive variant URLs ทำด้วย convention ของ key
- **ความเข้ากันได้ย้อนหลัง** — รูปเดิม (legacy key `{uuid}.jpg`) ต้องแสดงผลได้จนกว่าจะถูก backfill โดยไม่พัง
- **UI ภาษาไทย** — error message / label ภาษาไทยตามหลักโปรเจกต์
- **Svelte 5 Runes + `.js` import** — ตาม code style โปรเจกต์
- **sharp ทำงานบน Vercel Node serverless** — admin upload เรียกไม่บ่อย → cold start/function size ไม่ใช่ปัญหา

---

## Approach

**เลือก: pre-process ตอนอัปโหลดด้วย `sharp` + render ผ่าน `<picture>`/srcset**

เหตุผลในการเลือกเทียบกับทางเลือกอื่น:
- เป้าหมายคือ **LCP/CWV** → srcset + AVIF/WebP คือมาตรฐานที่ดีที่สุดและวัดผลได้
- **ไม่มีค่ารัยรายเดือน** (ไม่เหมือน Cloudflare Image Resizing $5/เดือน) และ **ไม่ติด quota** (ไม่เหมือน Vercel Image Optimization 1,000 img/เดือน)
- จุดอัปโหลด (`uploadImage`) เป็น **single integration point** ทำครั้งเดียวครอบทุกหน้า
- เป็นเจ้าของเอง 100% — ย้าย deploy ได้ ไม่ผูก vendor

Trade-off ที่ยอมรับ: upload ช้าขึ้นเล็กน้อย, ใช้ storage เพิ่ม (~3–5x), ต้อง backfill รูปเดิม (ปริมาณน้อย)

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│  Admin uploads image (ImageUpload.svelte)                     │
│   └─ client-side pre-compress (existing) → POST               │
│      /api/admin/upload/image                                  │
├──────────────────────────────────────────────────────────────┤
│  src/lib/server/r2.ts → uploadImage()  [MODIFIED]             │
│   ├─ detect type/mime (existing)                              │
│   ├─ NEW: for each width in IMAGE_VARIANTS[kind].widths:      │
│   │     sharp.resize(width)                                   │
│   │       → .avif | .webp | .jpg  (per formats)               │
│   ├─ PUT each variant → R2  images/{type}/{uuid}/{w}.{ext}    │
│   │     with Cache-Control: public, max-age=31536000,         │
│   │     immutable  + ContentType                              │
│   └─ return canonical URL  …/{uuid}/{fallback}.jpg            │
├──────────────────────────────────────────────────────────────┤
│  src/lib/server/images/sharp.ts  [NEW]                        │
│   └─ generateVariants(buffer, kind) → Map<{w.ext}, Buffer>    │
│      (pure sharp pipeline; no R2/network)                     │
├──────────────────────────────────────────────────────────────┤
│  src/lib/images/config.ts  [NEW — shared server+client]       │
│   └─ IMAGE_VARIANTS = { poster, profile }                     │
│      + deriveVariantUrls(canonicalUrl, kind) → {avif[],...}   │
│      + isLegacyUrl(url) → boolean                             │
├──────────────────────────────────────────────────────────────┤
│  src/lib/components/Picture.svelte  [NEW]                     │
│   └─ <Picture src kind sizes alt width height loading .../>   │
│      → <picture>                                              │
│          <source type="image/avif" srcset=...>                │
│          <source type="image/webp" srcset=...>                │
│          <img src=fallback sizes ...>                         │
│        </picture>                                             │
│      legacy/non-conforming src → plain <img>                  │
├──────────────────────────────────────────────────────────────┤
│  R2 object layout                                             │
│   images/posters/{uuid}/480.avif                              │
│   images/posters/{uuid}/480.webp                              │
│   images/posters/{uuid}/768.avif   ... {1080}.jpg (canonical) │
│   images/profiles/{uuid}/320.avif ... {640}.jpg               │
├──────────────────────────────────────────────────────────────┤
│  POST /api/admin/images/backfill  [NEW — ADMIN]               │
│   └─ scan DB rows w/ legacy URLs → download → variants →      │
│      PUT → update DB URL to new canonical. Idempotent (HEAD). │
└──────────────────────────────────────────────────────────────┘
```

---

## Detailed Design

### 1. Variant config (single source of truth)

`src/lib/images/config.ts` — **shared** (no `sharp` import, safe for client bundle):

```ts
export type ImageKind = 'poster' | 'profile';

export const IMAGE_VARIANTS = {
  poster:  { widths: [480, 768, 1080], formats: ['avif', 'webp', 'jpg'] as const, fallback: 1080 },
  profile: { widths: [320, 640],       formats: ['avif', 'webp', 'jpg'] as const, fallback: 640 }
} as const satisfies Record<ImageKind, { widths: number[]; formats: readonly string[]; fallback: number }>;
```

URL convention & helpers (exported from same file):

```ts
// New convention: .../images/{type}/{uuid}/{w}.{ext}
// Legacy:         .../images/{type}/{uuid}.{ext}

const NEW_RE = /\/images\/(posters|profiles)\/([0-9a-f-]{36})\/(\d+)\.(avif|webp|jpg)$/;
const LEGACY_RE = /\/images\/(posters|profiles)\/([0-9a-f-]{36})\.(jpg|png|webp)$/;

export function isLegacyImageUrl(url: string): boolean { return LEGACY_RE.test(url); }
export function isManagedImageUrl(url: string): boolean {
  return /\/images\/(posters|profiles)\//.test(url);
}

// Build srcset entries for <Picture> from a canonical URL.
// Each entry = { url, width } so the component can emit correct width descriptors.
export type SrcEntry = { url: string; width: number };
export function deriveVariantUrls(
  canonicalUrl: string,
  kind: ImageKind
): { avif: SrcEntry[]; webp: SrcEntry[]; jpg: SrcEntry[] } | null
```

`deriveVariantUrls` คืนอาร์เรย์เรียงตามลำดับ `IMAGE_VARIANTS[kind].widths` (เช่น poster = `[480, 768, 1080]`) คืน `null` เมื่อ URL ไม่ตรง convention ใหม่ → `<Picture>` ใช้ plain `<img>` fallback

### 2. sharp pipeline (server-only)

`src/lib/server/images/sharp.ts`:

```ts
import sharp from 'sharp';
import { IMAGE_VARIANTS, type ImageKind } from '$lib/images/config.js';

export type Variant = { width: number; ext: 'avif' | 'webp' | 'jpg'; buffer: Buffer };

export async function generateVariants(
  input: Buffer,
  kind: ImageKind
): Promise<Variant[]> {
  const { widths, formats } = IMAGE_VARIANTS[kind];
  const variants: Variant[] = [];
  const pipeline = sharp(input, { failOn: 'error' });
  const meta = await pipeline.metadata();
  const rot = pipeline.rotate(); // honor EXIF orientation

  for (const width of widths) {
    // never upscale beyond source width
    const w = Math.min(width, meta.width ?? width);
    for (const ext of formats) {
      const buf = await encode(rot.clone().resize({ width: w, withoutEnlargement: true }), ext);
      variants.push({ width: w, ext, buffer: buf });
    }
  }
  return variants;
}

async function encode(img: sharp.Sharp, ext: 'avif' | 'webp' | 'jpg'): Promise<Buffer> {
  switch (ext) {
    case 'avif': return img.avif({ quality: 50, effort: 4 }).toBuffer();
    case 'webp': return img.webp({ quality: 72 }).toBuffer();
    case 'jpg':  return img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  }
}
```

### 3. Upload pipeline changes

`src/lib/server/r2.ts` — `uploadImage(file, type)` modified:

1. `detectImage` → confirm mime (existing)
2. `file.arrayBuffer()` → `Buffer`
3. `generateVariants(buffer, type)` → `Variant[]`
4. For each variant: PUT to `images/{type}/{uuid}/{width}.{ext}` with headers:
   - `Content-Type: image/{ext}` (jpg → `image/jpeg`)
   - `Cache-Control: public, max-age=31536000, immutable`
   (parallel via `Promise.all`)
5. Return `{ url: …/{uuid}/{fallback}.jpg, key: images/{type}/{uuid}/{fallback}.jpg }`

`generateImageKey` ล้าสมัย → แทนด้วย `images/{type}/{uuid}/{width}.{ext}` per-variant. ลบฟังก์ชันเดิมเมื่อ migration ครบ

ขนาดลมิต request ที่ endpoint (`+server.ts`) ยังจำกัดที่ 4 MB (client pre-compress เหมือนเดิม)

### 4. `<Picture>` component

`src/lib/components/Picture.svelte`:

```svelte
<script lang="ts">
  import { deriveVariantUrls, type ImageKind } from '$lib/images/config.js';

  let {
    src, kind, sizes, alt,
    width, height,
    loading = 'lazy',
    fetchpriority,
    class: cls = '',
    decoding = 'async'
  }: {
    src: string | null | undefined;
    kind: ImageKind;
    sizes?: string;
    alt: string;
    width?: number; height?: number;
    loading?: 'lazy' | 'eager';
    fetchpriority?: 'high' | 'low' | 'auto';
    class?: string;
    decoding?: 'async' | 'sync' | 'auto';
  } = $props();

  const variants = $derived(src ? deriveVariantUrls(src, kind) : null);

  const toSrcset = (entries: { url: string; width: number }[]) =>
    entries.map((e) => `${e.url} ${e.width}w`).join(', ');
</script>

{#if !src}
  <!-- caller handles placeholder separately; render nothing -->
{:else if variants}
  <picture>
    {#if variants.avif.length}<source type="image/avif" srcset={toSrcset(variants.avif)} {sizes}>{/if}
    {#if variants.webp.length}<source type="image/webp" srcset={toSrcset(variants.webp)} {sizes}>{/if}
    <img {src} {alt} {width} {height} {loading} {decoding} {fetchpriority} class={cls} {sizes}>
  </picture>
{:else}
  <img {src} {alt} {width} {height} {loading} {decoding} {fetchpriority} class={cls}>
{/if}
```

> `deriveVariantUrls` คืน `{ url, width }[]` ตามลำดับ `IMAGE_VARIANTS[kind].widths` เสมอ → `toSrcset` สร้าง descriptor ที่ถูกต้อง (`480w, 768w, 1080w`) ไม่ใช่ index-based

### 5. Cache headers

ทุก R2 PUT ตั้ง `Cache-Control: public, max-age=31536000, immutable` เพราะ key content-addressed ด้วย `{uuid}/{width}.{ext}` → URL ไม่เปลี่ยน = immutable ปลอดภัย เป็น win ใหญ่สำหรับการเข้าซ้ำ (CDN/browser cache ตลอดปี)

### 6. Backfill รูปเดิม

`POST /api/admin/images/backfill` (ADMIN guard):

- Body: `{ cursor?: string, limit?: number }` → Response: `{ processed: number, updated: number, skipped: number, nextCursor: string | null }`
- ขั้นตอนต่อ 1 URL:
  1. ตรวจ `isLegacyImageUrl(url)` → skip ถ้าไม่ใช่ legacy (idempotent)
  2. HEAD variant canonical ใหม่ (`…/{uuid}/{fallback}.jpg`) → ถ้ามีอยู่แล้ว = backfill แล้ว → skip
  3. download original จาก URL เดิม → `generateVariants` → PUT ทุก variant + cache headers
  4. UPDATE DB field = canonical URL ใหม่ (เฉพาะ field ที่เท่ากับ URL เดิม เพื่อกัน race)
- แหล่งข้อมูล: scan `series.posterUrl`, `artists.profileImageUrl`, `users.avatarUrl`, `users.coverUrl`, `episodes.coverUrl` (กรองเฉพาะที่ชี้ R2 + legacy)
- รันซ้ำจน `nextCursor === null`

### 7. การ migrate หน้า UI (ลำดับ LCP impact)

**Phase 1 — High-impact public pages:**
- `src/lib/components/SeriesPosterCard.svelte` — core card, ใช้ทั่ว listing/home/calendar
- `src/lib/components/SeriesDetailPanel.svelte` — hero (eager + fetchpriority=high) + posters
- `src/routes/[lang=lang]/(app)/series/+page.svelte`, `/+page.svelte` (home)
- `src/lib/components/ArtistDetailPanel.svelte` + artists pages
- `src/routes/[lang=lang]/(app)/profile/+page.svelte` — cover (แก้ dimensions ที่ขาด) + avatar + favorites posters
- `src/routes/[lang=lang]/(app)/calendar/+page.svelte` + `CardScheduleBoard.svelte`

**Phase 2 — Dimensions/lazy fixes:**
- `src/routes/[lang=lang]/admin/series/[id]/+page.svelte:78` — hero ขาด width/height/lazy
- `src/routes/[lang=lang]/(app)/profile/+page.svelte:530` — cover preview ขาด dimensions

**Phase 3 — Admin pages (priority ต่ำ):** ใช้ `<Picture>` เพื่อความสม่ำเสมอ

ค่า `sizes` default ที่แนะนำ:
- Poster grid: `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"`
- Detail hero: `sizes="(max-width: 768px) 100vw, 480px"`
- Profile avatar: `sizes="96px"`

### 8. Error handling

- sharp decode/encode fail → `uploadImage` throw → endpoint คืน 500 + message ภาษาไทย (admin retry ได้)
- Backfill: error ราย URL → log + นับใน `skipped`, ไม่ abort batch → cursor เดินต่อ
- `<Picture>` กับ `src` ที่เป็น null/undefined → render nothing (caller จัด placeholder `static/placeholders/*` เอง)
- `<Picture>` กับ `src` external (non-R2) → plain `<img>` (safe)

---

## Testing

โปรเจกต์ยังไม่มี test suite → เริ่มต่ำสุดที่คุ้มค่า:

1. **Unit test (vitest):** `deriveVariantUrls` + `isLegacyImageUrl` (pure functions) — ครอบ new convention, legacy, external URL, null
2. **Manual verification checklist:**
   - อัปโหลด poster/profile ใหม่ → ตรวจ R2 มี variant ครบ (9 files poster, 6 files profile)
   - DevTools → หน้า series listing บน mobile viewport → เห็น `<picture>` โหลด `.avif`, LCP element เล็กลง
   - ตรวจ response header `Cache-Control: ...immutable`
   - รัน backfill 2 ครั้ง → ครั้งที่ 2 `updated=0` (idempotent)
   - รูปเดิมที่ยังไม่ backfill → ยังแสดงผลได้ (plain img)
3. **ไม่ทำ E2E** ในรอบนี้ (YAGNI)

---

## Out of Scope (YAGNI)

- Logos / social icons ที่เป็น URL ภายนอก/กรอก manual — ไม่ pre-process (ได้แค่ benefit จาก `<Picture>` dimensions/lazy เมื่อใช้ component)
- `episodes.coverUrl` ถ้าไม่ได้ผ่าน `uploadImage` (ตรวจระหว่าง implement; ถ้าผ่านจริงจะอยู่ใน scope)
- **LQIP / blur-up placeholder** — ทำภายหลังได้ ไม่บล็อก LCP win หลัก
- AVIF `effort` tuning / quality sweep — ใช้ค่า default ที่เลือกไว้ก่อน
- การลบไฟล์เดิมจาก R2 หลัง backfill (เก็บไว้เป็น raw backup; ลบทีหลังได้ด้วย lifecycle rule)

---

## Rollout

1. Implement config + sharp + `uploadImage` + `<Picture>` + unit test
2. Manual upload test (dev)
3. Backfill endpoint + รันจนครบ
4. Migrate UI Phase 1 → 2 → 3
5. วัด LCP บน mobile (Lighthouse / PageSpeed) เปรียบเทียบ before/after
