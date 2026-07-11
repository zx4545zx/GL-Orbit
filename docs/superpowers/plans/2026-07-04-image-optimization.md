# Image Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ยกระดับ LCP / Core Web Vitals โดยประมวลผลรูป poster/profile เป็นหลายขนาด + AVIF/WebP ตอนอัปโหลด (sharp) เก็บใน R2 แล้ว render ผ่าน `<picture>`/srcset

**Architecture:** `uploadImage()` รับไฟล์ → `sharp` สร้าง variants → PUT ทุกขนาด/ฟอร์แมตลง R2 ใต้ `images/{type}/{uuid}/{w}.{ext}` (พร้อม `Cache-Control: immutable`) → DB เก็บ canonical URL ตัวเดียว → `<Picture>` component derive variant URLs ตาม convention ส่งออก `<picture>`/srcset รูปเดิมที่ยังไม่ backfill แสดงผลได้ผ่าน fallback

**Tech Stack:** SvelteKit 2, Svelte 5 (Runes), TypeScript (NodeNext, `.js` imports), Drizzle ORM, Cloudflare R2 (`aws4fetch`), `sharp`, vitest (ติดตั้งแล้ว), Vercel (Node serverless)

**Spec:** `docs/superpowers/specs/2026-07-04-image-optimization-design.md`

---

## File Structure

**Create:**
- `src/lib/images/config.ts` — variant config + URL convention helpers (shared server+client, pure, testable)
- `src/lib/images/config.test.ts` — vitest unit tests for helpers
- `src/lib/server/images/sharp.ts` — sharp variant generator (server-only)
- `src/lib/server/images/sharp.test.ts` — vitest test (synthetic image, no fixture file)
- `src/lib/server/images/backfill.ts` — legacy→new migration logic
- `src/lib/components/Picture.svelte` — `<picture>`/srcset component
- `src/routes/api/admin/images/backfill/+server.ts` — ADMIN-guarded backfill endpoint

**Modify:**
- `src/lib/server/r2.ts` — rewrite `uploadImage` to generate+PUT variants; export `putObject`; remove `generateImageKey`
- `package.json` — add `test` scripts
- UI `.svelte` files (Phase 1/2/3) — swap `<img>` → `<Picture>` + fix missing dimensions/lazy

**Naming convention (สำคัญ):** ทั้งระบบใช้คำว่า **`type: 'posters' | 'profiles'`** (พหูพจน์, ตรงกับ R2 path และ `uploadImage` เดิม) ไม่ใช่ `kind` แบบ singular

---

## Task 1: Image config + URL helpers (TDD)

**Files:**
- Create: `src/lib/images/config.ts`
- Create: `src/lib/images/config.test.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Add test scripts to package.json**

ใน `package.json` เพิ่มใน `"scripts"` (หลัง `"preview"`):

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 2: Write the failing test**

สร้าง `src/lib/images/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
	IMAGE_VARIANTS,
	isLegacyImageUrl,
	isManagedImageUrl,
	deriveVariantUrls,
	parseLegacyUrl
} from './config.js';

const BASE = 'https://cdn.example.com/images';

describe('isLegacyImageUrl', () => {
	it('true for old single-file key', () => {
		expect(isLegacyImageUrl(`${BASE}/posters/11111111-2222-3333-4444-555555555555.jpg`)).toBe(true);
	});
	it('false for new convention', () => {
		expect(isLegacyImageUrl(`${BASE}/posters/11111111-2222-3333-4444-555555555555/1080.jpg`)).toBe(false);
	});
	it('false for external url', () => {
		expect(isLegacyImageUrl('https://imgur.com/abc.png')).toBe(false);
	});
});

describe('isManagedImageUrl', () => {
	it('true for any /images/{posters|profiles}/ path', () => {
		expect(isManagedImageUrl(`${BASE}/profiles/11111111-2222-3333-4444-555555555555/640.jpg`)).toBe(true);
		expect(isManagedImageUrl(`${BASE}/posters/11111111-2222-3333-4444-555555555555.jpg`)).toBe(true);
	});
	it('false for external', () => {
		expect(isManagedImageUrl('https://example.com/foo.jpg')).toBe(false);
	});
});

describe('deriveVariantUrls', () => {
	const canonical = `${BASE}/posters/11111111-2222-3333-4444-555555555555/1080.jpg`;

	it('returns entries ordered by widths for each format', () => {
		const v = deriveVariantUrls(canonical, 'posters');
		expect(v).not.toBeNull();
		expect(v!.avif.map((e) => e.width)).toEqual([480, 768, 1080]);
		expect(v!.avif[0]).toEqual({ url: `${BASE}/posters/11111111-2222-3333-4444-555555555555/480.avif`, width: 480 });
		expect(v!.webp.map((e) => e.width)).toEqual([480, 768, 1080]);
		expect(v!.jpg.map((e) => e.width)).toEqual([480, 768, 1080]);
	});

	it('null for legacy url', () => {
		expect(deriveVariantUrls(`${BASE}/posters/11111111-2222-3333-4444-555555555555.jpg`, 'posters')).toBeNull();
	});

	it('null for external url', () => {
		expect(deriveVariantUrls('https://imgur.com/abc.jpg', 'posters')).toBeNull();
	});

	it('handles profiles type', () => {
		const v = deriveVariantUrls(`${BASE}/profiles/11111111-2222-3333-4444-555555555555/640.jpg`, 'profiles');
		expect(v!.avif.map((e) => e.width)).toEqual([320, 640]);
	});
});

describe('parseLegacyUrl', () => {
	it('extracts base, type, uuid', () => {
		const p = parseLegacyUrl(`${BASE}/posters/11111111-2222-3333-4444-555555555555.webp`);
		expect(p).toEqual({
			base: BASE,
			type: 'posters',
			uuid: '11111111-2222-3333-4444-555555555555',
			ext: 'webp'
		});
	});
	it('null for new convention', () => {
		expect(parseLegacyUrl(`${BASE}/posters/11111111-2222-3333-4444-555555555555/1080.jpg`)).toBeNull();
	});
	it('null for external', () => {
		expect(parseLegacyUrl('https://imgur.com/abc.jpg')).toBeNull();
	});
});

describe('IMAGE_VARIANTS', () => {
	it('has expected widths and fallback', () => {
		expect(IMAGE_VARIANTS.posters.widths).toEqual([480, 768, 1080]);
		expect(IMAGE_VARIANTS.posters.fallback).toBe(1080);
		expect(IMAGE_VARIANTS.profiles.widths).toEqual([320, 640]);
		expect(IMAGE_VARIANTS.profiles.fallback).toBe(640);
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './config.js'`

- [ ] **Step 4: Write minimal implementation**

สร้าง `src/lib/images/config.ts`:

```ts
export type ImageType = 'posters' | 'profiles';
export type ImageExt = 'avif' | 'webp' | 'jpg';

export const IMAGE_VARIANTS = {
	posters: { widths: [480, 768, 1080], formats: ['avif', 'webp', 'jpg'] as const, fallback: 1080 },
	profiles: { widths: [320, 640], formats: ['avif', 'webp', 'jpg'] as const, fallback: 640 }
} as const satisfies Record<ImageType, { widths: number[]; formats: readonly ImageExt[]; fallback: number }>;

export type SrcEntry = { url: string; width: number };
export type VariantSet = { avif: SrcEntry[]; webp: SrcEntry[]; jpg: SrcEntry[] };

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
// New convention: .../images/{type}/{uuid}/{w}.{ext}
const CANONICAL_RE = new RegExp(`^(.*\\/images)\\/(posters|profiles)\\/(${UUID})\\/\\d+\\.(jpg|png|webp)$`);
// Legacy:        .../images/{type}/{uuid}.{ext}
const LEGACY_RE = new RegExp(`^(.*\\/images)\\/(posters|profiles)\\/(${UUID})\\.(jpg|png|webp)$`);

export function isManagedImageUrl(url: string): boolean {
	return /\/images\/(posters|profiles)\//.test(url);
}

export function isLegacyImageUrl(url: string): boolean {
	return LEGACY_RE.test(url);
}

export function parseLegacyUrl(
	url: string
): { base: string; type: ImageType; uuid: string; ext: ImageExt | 'png' } | null {
	const m = LEGACY_RE.exec(url);
	if (!m) return null;
	const [, base, type, uuid, ext] = m;
	return { base, type: type as ImageType, uuid, ext: ext as ImageExt | 'png' };
}

export function deriveVariantUrls(canonicalUrl: string, type: ImageType): VariantSet | null {
	const m = CANONICAL_RE.exec(canonicalUrl);
	if (!m) return null;
	const [, base, t, uuid] = m;
	if (t !== type) return null;
	const widths = IMAGE_VARIANTS[type].widths;
	const make = (ext: ImageExt): SrcEntry[] =>
		widths.map((w) => ({ url: `${base}/${type}/${uuid}/${w}.${ext}`, width: w }));
	return { avif: make('avif'), webp: make('webp'), jpg: make('jpg') };
}

// --- server-side key/url builders (used by upload + backfill) ---

export function buildVariantKey(type: ImageType, uuid: string, width: number, ext: ImageExt): string {
	return `images/${type}/${uuid}/${width}.${ext}`;
}

export function buildVariantUrl(
	publicBaseUrl: string,
	type: ImageType,
	uuid: string,
	width: number,
	ext: ImageExt
): string {
	return `${publicBaseUrl.replace(/\/$/, '')}/images/${type}/${uuid}/${width}.${ext}`;
}

export function mimeForExt(ext: ImageExt): string {
	return ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all describe blocks green)

- [ ] **Step 6: Type check**

Run: `npm run check`
Expected: no new errors in `src/lib/images/` (pre-existing errors elsewhere may remain)

- [ ] **Step 7: Commit**

```bash
git add src/lib/images/config.ts src/lib/images/config.test.ts package.json
git commit -m "feat(images): variant config + URL convention helpers"
```

---

## Task 2: sharp variant generator (TDD)

**Files:**
- Create: `src/lib/server/images/sharp.ts`
- Create: `src/lib/server/images/sharp.test.ts`
- Install: `sharp` dependency

- [ ] **Step 1: Install sharp**

Run: `npm install sharp`
Then: `npm install -D @types/sharp`

> Vercel Node serverless รองรับ sharp native binary. หากลงแล้ว `npm run check` ฟ้อง types ไม่ได้ ให้ลอง `npm install -D @types/sharp` หรือใช้ types ที่ bundle มากับ sharp รุ่นใหม่ (ส่วนใหญ่มีให้แล้ว)

- [ ] **Step 2: Write the failing test**

สร้าง `src/lib/server/images/sharp.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { generateVariants } from './sharp.js';

// synthetic 2000x2000 jpeg — no fixture file needed
async function synthInput(): Promise<Buffer> {
	return sharp({ create: { width: 2000, height: 2000, channels: 3, background: '#ff6b9d' } })
		.jpeg()
		.toBuffer();
}

describe('generateVariants', () => {
	it('produces every width×format for posters', async () => {
		const variants = await generateVariants(await synthInput(), 'posters');
		// 3 widths × 3 formats = 9
		expect(variants).toHaveLength(9);
		const widths = [...new Set(variants.map((v) => v.width))].sort((a, b) => a - b);
		expect(widths).toEqual([480, 768, 1080]);
		expect(variants.filter((v) => v.ext === 'avif')).toHaveLength(3);
		expect(variants.filter((v) => v.ext === 'webp')).toHaveLength(3);
		expect(variants.filter((v) => v.ext === 'jpg')).toHaveLength(3);
	});

	it('respects withoutEnlargement when source smaller than requested', async () => {
		const small = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#fff' } })
			.jpeg().toBuffer();
		const variants = await generateVariants(small, 'profiles');
		// source 400px → all requested (320, 640) clamp to ≤400; 640 becomes 400
		const widths = [...new Set(variants.map((v) => v.width))].sort((a, b) => a - b);
		expect(widths[widths.length - 1]).toBeLessThanOrEqual(400);
	});

	it('each variant buffer is a valid image of correct mime', async () => {
		const variants = await generateVariants(await synthInput(), 'profiles');
		for (const v of variants) {
			const meta = await sharp(v.buffer).metadata();
			expect(meta.format).toBe(v.ext === 'jpg' ? 'jpeg' : v.ext);
		}
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './sharp.js'`

- [ ] **Step 4: Write minimal implementation**

สร้าง `src/lib/server/images/sharp.ts`:

```ts
import sharp from 'sharp';
import { IMAGE_VARIANTS, type ImageExt, type ImageType } from '$lib/images/config.js';

export type Variant = { width: number; ext: ImageExt; buffer: Buffer };

export async function generateVariants(input: Buffer, type: ImageType): Promise<Variant[]> {
	const { widths, formats } = IMAGE_VARIANTS[type];
	const meta = await sharp(input).metadata();
	const sourceWidth = meta.width ?? Math.max(...widths);
	const variants: Variant[] = [];

	for (const width of widths) {
		const w = Math.min(width, sourceWidth);
		for (const ext of formats) {
			const buffer = await encode(
				sharp(input).rotate().resize({ width: w, withoutEnlargement: true }),
				ext
			);
			variants.push({ width: w, ext, buffer });
		}
	}
	return variants;
}

async function encode(img: sharp.Sharp, ext: ImageExt): Promise<Buffer> {
	if (ext === 'avif') return img.avif({ quality: 50, effort: 4 }).toBuffer();
	if (ext === 'webp') return img.webp({ quality: 72 }).toBuffer();
	return img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (config + sharp suites green)

- [ ] **Step 6: Commit**

```bash
git add src/lib/server/images/sharp.ts src/lib/server/images/sharp.test.ts package.json package-lock.json
git commit -m "feat(images): sharp variant generator (resize + avif/webp/jpg)"
```

---

## Task 3: R2 variant upload (rewrite `uploadImage`)

**Files:**
- Modify: `src/lib/server/r2.ts`

- [ ] **Step 1: Rewrite `src/lib/server/r2.ts`**

แทนที่เนื้อหาทั้งไฟล์ด้วย:

```ts
import 'dotenv/config';
import { AwsClient } from 'aws4fetch';
import { generateVariants } from './images/sharp.js';
import {
	IMAGE_VARIANTS,
	buildVariantKey,
	buildVariantUrl,
	mimeForExt,
	type ImageExt,
	type ImageType
} from '$lib/images/config.js';

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

const aws = new AwsClient({
	accessKeyId: accessKeyId ?? '',
	secretAccessKey: secretAccessKey ?? '',
	service: 's3',
	region: 'auto'
});

export class ImageUploadValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ImageUploadValidationError';
	}
}

async function detectImage(file: File): Promise<{ mime: string; ext: string } | null> {
	const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return { mime: 'image/jpeg', ext: 'jpg' };
	}
	if (
		bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
		bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
	) {
		return { mime: 'image/png', ext: 'png' };
	}
	if (
		bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
		bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
	) {
		return { mime: 'image/webp', ext: 'webp' };
	}
	return null;
}

/** PUT a single object to R2 with immutable cache headers. Exported for backfill reuse. */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
	if (!endpoint || !bucketName) throw new Error('Cloudflare R2 is not configured');

	const baseEndpoint = endpoint.replace(/\/+$/, '');
	const objectBase = baseEndpoint.endsWith(`/${bucketName}`)
		? baseEndpoint
		: `${baseEndpoint}/${bucketName}`;
	const objectUrl = `${objectBase}/${key}`;

	const signed = await aws.sign(objectUrl, {
		method: 'PUT',
		body,
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});

	const res = await fetch(signed);
	if (!res.ok) {
		const text = await res.text().catch(() => 'Unknown error');
		throw new Error(`Upload failed: ${res.status} ${text}`);
	}
}

/** HEAD an object to check existence (used by backfill for idempotency). */
export async function objectExists(key: string): Promise<boolean> {
	if (!endpoint || !bucketName) return false;
	const baseEndpoint = endpoint.replace(/\/+$/, '');
	const objectBase = baseEndpoint.endsWith(`/${bucketName}`)
		? baseEndpoint
		: `${baseEndpoint}/${bucketName}`;
	const objectUrl = `${objectBase}/${key}`;
	const signed = await aws.sign(objectUrl, { method: 'HEAD' });
	const res = await fetch(signed);
	return res.ok;
}

export async function uploadImage(
	file: File,
	type: ImageType
): Promise<{ url: string; key: string }> {
	if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
		throw new Error('Cloudflare R2 is not configured');
	}

	const detected = await detectImage(file);
	if (!detected) {
		throw new ImageUploadValidationError('ไฟล์ต้องเป็นรูปภาพ (JPEG, PNG, WebP)');
	}

	const maxSize = 4 * 1024 * 1024;
	if (file.size > maxSize) {
		throw new ImageUploadValidationError('ไฟล์ต้องมีขนาดไม่เกิน 4 MB');
	}

	const input = Buffer.from(await file.arrayBuffer());
	const variants = await generateVariants(input, type);
	const id = crypto.randomUUID();

	// PUT all variants in parallel (variant keys are content-addressed by uuid → immutable)
	await Promise.all(
		variants.map((v) => putObject(buildVariantKey(type, id, v.width, v.ext), v.buffer, mimeForExt(v.ext)))
	);

	const fallback = IMAGE_VARIANTS[type].fallback;
	const canonicalKey = buildVariantKey(type, id, fallback, 'jpg');
	const canonicalUrl = buildVariantUrl(publicUrl, type, id, fallback, 'jpg');
	return { url: canonicalUrl, key: canonicalKey };
}
```

> เปลี่ยน: ลบ `generateImageKey` เดิม; `uploadImage` สร้าง+อัปโหลด variants ทั้งหมด; เพิ่ม `putObject`/`objectExists` exports; `type` parameter เป็น `ImageType` (ยังเท่ากับ `'posters'|'profiles'` จึงเข้ากับ caller เดิมได้)

- [ ] **Step 2: Verify caller still type-checks**

`src/routes/api/admin/upload/image/+server.ts` เรียก `uploadImage(file, type)` โดย `type` เป็น `string` จาก formData — ยังคงเข้ากับ `ImageType` ได้ผ่าน guard `type !== 'posters' && type !== 'profiles'` ที่มีอยู่ ไม่ต้องแก้

Run: `npm run check`
Expected: no new errors

- [ ] **Step 3: Manual verify upload (dev)**

Run: `npm run dev`
1. login as admin → `/th/admin/artists` → เลือกรูปใหม่ผ่าน `ImageUpload`
2. ดู response ใน Network → `url` ควรเป็น `…/images/profiles/{uuid}/640.jpg`
3. เปิด R2 (หรือ Drizzle Studio / คำสั่ง aws cli) → ตรวจว่ามี objects ครบ 6 ไฟล์: `{uuid}/320.avif`, `320.webp`, `320.jpg`, `640.avif`, `640.webp`, `640.jpg`
4. curl หนึ่ง variant → ตรวจ response header มี `Cache-Control: public, max-age=31536000, immutable`

- [ ] **Step 4: Commit**

```bash
git add src/lib/server/r2.ts
git commit -m "feat(images): uploadImage generates + stores all variants in R2"
```

---

## Task 4: `<Picture>` component

**Files:**
- Create: `src/lib/components/Picture.svelte`

- [ ] **Step 1: Create the component**

สร้าง `src/lib/components/Picture.svelte`:

```svelte
<script lang="ts">
	import { deriveVariantUrls, type ImageType } from '$lib/images/config.js';

	let {
		src,
		type,
		sizes,
		alt,
		width = undefined,
		height = undefined,
		loading = 'lazy',
		fetchpriority = undefined,
		class: cls = '',
		decoding = 'async'
	}: {
		src: string | null | undefined;
		type: ImageType;
		sizes?: string;
		alt: string;
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
		fetchpriority?: 'high' | 'low' | 'auto';
		class?: string;
		decoding?: 'async' | 'sync' | 'auto';
	} = $props();

	const variants = $derived(src ? deriveVariantUrls(src, type) : null);

	const toSrcset = (entries: { url: string; width: number }[]) =>
		entries.map((e) => `${e.url} ${e.width}w`).join(', ');
</script>

{#if !src}
	<!-- no source; caller renders its own placeholder -->
{:else if variants}
	<picture>
		{#if variants.avif.length}
			<source type="image/avif" srcset={toSrcset(variants.avif)} {sizes} />
		{/if}
		{#if variants.webp.length}
			<source type="image/webp" srcset={toSrcset(variants.webp)} {sizes} />
		{/if}
		<img {src} {alt} {width} {height} {loading} {decoding} {fetchpriority} class={cls} {sizes} />
	</picture>
{:else}
	<img {src} {alt} {width} {height} {loading} {decoding} {fetchpriority} class={cls} />
{/if}
```

> พฤติกรรม: `src` ใหม่ convention → `<picture>`/srcset; `src` legacy หรือ external → plain `<img>` (graceful fallback); `src` ว่าง → render nothing (caller จัด placeholder เอง)

- [ ] **Step 2: Type check**

Run: `npm run check`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Picture.svelte
git commit -m "feat(images): Picture component (picture/srcset with graceful fallback)"
```

---

## Task 5: Wire `<Picture>` into Phase 1 public pages

> **Pattern (exemplar):** ทุกจุดที่เปลี่ยนคือ แทน `<img src={...} ... />` ด้วย `<Picture src={...} type="posters|profiles" sizes="..." ... />` โดย **ย้าย `class`/`alt`/`width`/`height`/`loading`/`decoding`/`fetchpriority` ที่มีอยู่เดิมไปยัง `<Picture>`** (ห้ามทิ้ง) และเพิ่ม `sizes` ตามตาราง ถ้า `<img>` เดิมมี wrapper placeholder (เช่น `{#if !item.poster}<fallback>{/if}`) ให้คงไว้ `<Picture` จัดการเฉพาะตอนมี `src`

- [ ] **Step 1: Exemplar — `SeriesPosterCard.svelte`**

ไฟล์ `src/lib/components/SeriesPosterCard.svelte` line 18 — แทน:

```svelte
<img src={item.poster} alt={item.title} width={400} height={533} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
```

ด้วย:

```svelte
<Picture src={item.poster} type="posters" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" alt={item.title} width={400} height={533} loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
```

และเพิ่ม import บนสุดของ `<script>`:

```ts
import Picture from '$lib/components/Picture.svelte';
```

- [ ] **Step 2: Verify exemplar in dev**

Run: `npm run dev` → เปิด `/th/series` บน DevTools (mobile viewport 390px) → ตรวจ card poster:
- Elements ต้องเป็น `<picture>` มี `<source type="image/avif">` + `<source type="image/webp">`
- Network → โหลด `.avif` (ขนาดเล็กกว่า `.jpg` ต้นฉบับ)
- หากใช้รูปที่ยังไม่ได้ backfill (legacy) → ต้องเห็น `<img>` ธรรมดา ไม่พัง

- [ ] **Step 3: Apply migration table (remaining Phase 1 files)**

สำหรับแต่ละไฟล์: เพิ่ม `import Picture from '$lib/components/Picture.svelte';` แล้วแทน `<img>` ที่บรรทัดที่ระบุ (ย้าย attrs เดิมไปด้วย) ใส่ `type` + `sizes` ตามตาราง:

| File | Line | type | sizes | loading | fetchpriority | note |
|---|---|---|---|---|---|---|
| `src/lib/components/SeriesDetailPanel.svelte` | 119 (hero poster) | `posters` | `(max-width: 768px) 100vw, 480px` | `eager` | `high` | LCP element |
| `src/lib/components/SeriesDetailPanel.svelte` | 165 (poster) | `posters` | `(max-width: 768px) 100vw, 480px` | `lazy` | — | |
| `src/lib/components/SeriesDetailPanel.svelte` | 220 (artist img) | `profiles` | `96px` | `lazy` | — | |
| `src/lib/components/SeriesDetailPanel.svelte` | 256 (platform logo) | — | — | — | — | **skip** (logo = external URL, คง `<img>` แต่เติม width/height ถ้าขาด) |
| `src/lib/components/ArtistDetailPanel.svelte` | 51 (profile img) | `profiles` | `(max-width: 768px) 40vw, 320px` | `lazy` | — | |
| `src/lib/components/ArtistDetailPanel.svelte` | 75 (social icon) | — | — | — | — | **skip** (icon = external) |
| `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte` | 170 (poster) | `posters` | `(max-width: 768px) 100vw, 480px` | `lazy` | — | duplicate-render ของ panel? ดู context |
| `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte` | 224,298,326 (artist/platform) | `profiles`/skip | `96px` | `lazy` | — | platform logo skip |
| `src/routes/[lang=lang]/(app)/+page.svelte` | 296,412 (home posters) | `posters` | `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw` | `lazy` | — | ใช้ `SeriesPosterCard` แล้วอาจไม่ต้องแก้ (ตรวจก่อน) |
| `src/routes/[lang=lang]/(app)/series/+page.svelte` | 255 | `posters` | `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw` | `lazy` | — | ใช้ `SeriesPosterCard` แล้ว? |
| `src/routes/[lang=lang]/(app)/artists/+page.svelte` | 185 | `profiles` | `(max-width: 640px) 40vw, 200px` | `lazy` | — | |
| `src/routes/[lang=lang]/(app)/artists/[id]/+page.svelte` | 158 (profile), 235/282 (related posters) | `profiles`/`posters` | `320px`/`(max-width:640px) 50vw, 25vw` | `lazy` | — | |
| `src/routes/[lang=lang]/(app)/profile/+page.svelte` | 185 (favorites poster), 255 (cover), 283 (avatar) | `posters`/`posters`/`profiles` | grid `25vw` / `(max-width:768px) 100vw, 960px` / `96px` | `lazy` | — | cover: `width=960 height=320` |
| `src/routes/[lang=lang]/(app)/calendar/+page.svelte` | 484,616,710 | `posters` | `(max-width: 640px) 45vw, 200px` | `lazy` | — | |
| `src/lib/components/.../CardScheduleBoard.svelte` | 169,239 | `posters` | `(max-width: 640px) 45vw, 200px` | `lazy` | — | |

> **กฎเกณฑ์:**
> - ก่อนแก้แต่ละไฟล์ เปิดอ่านบรรทัดนั้นเพื่อยืนยันตำแหน่งจริง (line อาจเลื่อน) และเก็บ attrs/class เดิมไว้ครบ
> - logo/social-icon ที่เป็น **external URL** = skip `<Picture>` (คง `<img>`) แต่ถ้าขาด `width`/`height`/`loading="lazy"` ให้เติม
> - ถ้าไฟล์เดียวกันใช้ `SeriesPosterCard` (ที่แก้แล้วใน Step 1) ก็ไม่ต้องแก้ซ้ำที่ poster นั้น

- [ ] **Step 4: Type check + dev smoke**

Run: `npm run check` → no new errors
Run: `npm run dev` → ท่องหน้า series listing, series detail, home, artists, profile, calendar → ทุกหน้าภาพขึ้นปกติ ไม่มี layout shift ใหม่

- [ ] **Step 5: Commit (per logical batch — แยก commit ตามความเหมาะสมได้)**

```bash
git add -A
git commit -m "feat(images): use Picture component on Phase 1 public pages"
```

---

## Task 6: Phase 2 — dimensions/lazy fixes

**Files:**
- Modify: `src/routes/[lang=lang]/admin/series/[id]/+page.svelte` (hero ~line 78)
- Modify: `src/routes/[lang=lang]/(app)/profile/+page.svelte` (cover preview ~line 530)

- [ ] **Step 1: Fix admin series hero**

ไฟล์ `src/routes/[lang=lang]/admin/series/[id]/+page.svelte` ~line 78 — ค้น `<img` ของ hero poster เติม attributes ที่ขาด:
`loading="lazy" decoding="async" width={480} height={720}` (หรือสัดส่วนจริงของ poster) ถ้ายังไม่มี
(หน้า admin priority ต่ำ จึงใช้ `<img>` ธรรมดาก็ได้ หรือใช้ `<Picture type="posters">` ถ้าอยากสม่ำเสมอ)

- [ ] **Step 2: Fix profile cover preview**

ไฟล์ `src/routes/[lang=lang]/(app)/profile/+page.svelte` ~line 530 — cover preview ขาด dimensions → เติม `width={960} height={320} loading="lazy"` (ถ้า Task 5 ยังไม่ได้ครอบด้วย `<Picture>`)

- [ ] **Step 3: Verify + commit**

Run: `npm run check` → no new errors
Run: `npm run dev` → หน้า admin series detail และ profile ไม่มี CLS ตอนโหลดภาพ

```bash
git add -A
git commit -m "fix(images): add missing dimensions/lazy on admin hero + profile cover"
```

---

## Task 7: Backfill legacy images

**Files:**
- Create: `src/lib/server/images/backfill.ts`
- Create: `src/routes/api/admin/images/backfill/+server.ts`

- [ ] **Step 1: Create the backfill module**

สร้าง `src/lib/server/images/backfill.ts`:

```ts
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';
import {
	IMAGE_VARIANTS,
	parseLegacyUrl,
	buildVariantKey,
	buildVariantUrl,
	mimeForExt,
	type ImageType
} from '$lib/images/config.js';
import { generateVariants } from './sharp.js';
import { putObject, objectExists } from '../r2.js';

export type BackfillResult = {
	processed: number;
	updated: number;
	skipped: number;
	errors: { url: string; message: string }[];
};

type EntitySpec = {
	type: ImageType;
	select: () => Promise<{ id: string; url: string }[]>;
	update: (id: string, canonical: string) => Promise<unknown>;
};

export async function backfillLegacyImages(): Promise<BackfillResult> {
	const db = await getDb();
	const result: BackfillResult = { processed: 0, updated: 0, skipped: 0, errors: [] };

	const entities: EntitySpec[] = [
		{
			type: 'posters',
			select: async () =>
				(await db
					.select({ id: schema.series.id, url: schema.series.posterUrl })
					.from(schema.series))
					.filter((r) => r.url !== null) as { id: string; url: string }[],
			update: (id, canonical) =>
				db.update(schema.series).set({ posterUrl: canonical }).where(eq(schema.series.id, id))
		},
		{
			type: 'profiles',
			select: async () =>
				(await db
					.select({ id: schema.artists.id, url: schema.artists.profileImageUrl })
					.from(schema.artists))
					.filter((r) => r.url !== null) as { id: string; url: string }[],
			update: (id, canonical) =>
				db.update(schema.artists)
					.set({ profileImageUrl: canonical })
					.where(eq(schema.artists.id, id))
		},
		{
			type: 'profiles',
			select: async () =>
				(await db.select({ id: schema.users.id, url: schema.users.avatarUrl }).from(schema.users))
					.filter((r) => r.url !== null) as { id: string; url: string }[],
			update: (id, canonical) =>
				db.update(schema.users).set({ avatarUrl: canonical }).where(eq(schema.users.id, id))
		},
		{
			type: 'posters',
			select: async () =>
				(await db.select({ id: schema.users.id, url: schema.users.coverUrl }).from(schema.users))
					.filter((r) => r.url !== null) as { id: string; url: string }[],
			update: (id, canonical) =>
				db.update(schema.users).set({ coverUrl: canonical }).where(eq(schema.users.id, id))
		},
		{
			type: 'posters',
			select: async () =>
				(await db.select({ id: schema.episodes.id, url: schema.episodes.coverUrl }).from(schema.episodes))
					.filter((r) => r.url !== null) as { id: string; url: string }[],
			update: (id, canonical) =>
				db.update(schema.episodes)
					.set({ coverUrl: canonical })
					.where(eq(schema.episodes.id, id))
		}
	];

	for (const entity of entities) {
		const rows = (await entity.select()).filter((r) => parseLegacyUrl(r.url) !== null);
		for (const row of rows) {
			result.processed++;
			try {
				await backfillOne(row, entity, result);
			} catch (err) {
				result.errors.push({
					url: row.url,
					message: err instanceof Error ? err.message : 'unknown error'
				});
			}
		}
	}
	return result;
}

async function backfillOne(
	row: { id: string; url: string },
	entity: EntitySpec,
	result: BackfillResult
): Promise<void> {
	const parsed = parseLegacyUrl(row.url);
	if (!parsed) {
		result.skipped++;
		return;
	}
	const { base, type, uuid } = parsed;
	const fallback = IMAGE_VARIANTS[type].fallback;
	const canonicalKey = buildVariantKey(type, uuid, fallback, 'jpg');

	// idempotency: skip if canonical already exists
	if (await objectExists(canonicalKey)) {
		// still ensure DB points at canonical (in case prior run PUT but failed to UPDATE)
		await entity.update(row.id, buildVariantUrl(base, type, uuid, fallback, 'jpg'));
		result.updated++;
		return;
	}

	const res = await fetch(row.url);
	if (!res.ok) throw new Error(`download failed: ${res.status}`);
	const input = Buffer.from(await res.arrayBuffer());
	const variants = await generateVariants(input, type);

	for (const v of variants) {
		await putObject(buildVariantKey(type, uuid, v.width, v.ext), v.buffer, mimeForExt(v.ext));
	}
	await entity.update(row.id, buildVariantUrl(base, type, uuid, fallback, 'jpg'));
	result.updated++;
}
```

- [ ] **Step 2: Create the endpoint**

สร้าง `src/routes/api/admin/images/backfill/+server.ts`:

```ts
import { json, error } from '@sveltejs/kit';
import { backfillLegacyImages } from '$lib/server/images/backfill.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	try {
		const result = await backfillLegacyImages();
		return json({ success: true, ...result });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'backfill ไม่สำเร็จ';
		return json({ success: false, error: message }, { status: 500 });
	}
};
```

- [ ] **Step 3: Type check**

Run: `npm run check`
Expected: no new errors

- [ ] **Step 4: Manual verify — idempotency**

Run: `npm run dev`
1. login as admin
2. `curl -X POST -b "session=<token>" http://localhost:5173/api/admin/images/backfill` (หรือเรียกผ่าน fetch ในคอนโซล)
3. ดู `result`: `processed` = จำนวนรูป legacy ทั้งหมด, `updated` = ที่อัปเดต, `errors: []`
4. ตรวจ R2 → รูปเดิมมี variants ครบแล้ว; DB field เปลี่ยนเป็น `…/{uuid}/{fallback}.jpg`
5. **รันครั้งที่ 2** → `processed: 0, updated: 0` (idempotent — ไม่มี legacy URL เหลือ)
6. เปิดหน้า series listing/detail → ตอนนี้ `<Picture>` ส่ง srcset จริง (เพราะ URL เป็น convention ใหม่แล้ว)

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/images/backfill.ts src/routes/api/admin/images/backfill/+server.ts
git commit -m "feat(images): admin backfill endpoint (legacy → variants, idempotent)"
```

---

## Task 8: Phase 3 — admin pages (lower priority)

**Files:** `src/routes/[lang=lang]/admin/**/+page.svelte` ที่ render poster/profile `<img>` (artists, studios, platforms, series list/detail, episodes)

- [ ] **Step 1: Swap admin `<img>` → `<Picture>`**

ใช้ pattern เดียวกับ Task 5 (type=`posters`/`profiles`, sizes เล็กๆ เช่น `160px` เพราะ thumbnail เล็ก, `loading="lazy"`) สำหรับ thumbnail ในหน้า list ของ admin artists/studios/platforms/series/episodes และ `ImageUpload.svelte` preview (line 163 — `<img src={url}>`)

> สำหรับ `ImageUpload.svelte` preview (line 163) เป็นกรณีพิเศษ: `url` อาจเป็น canonical ใหม่หรือ legacy → `<Picture>` จัดการ fallback ให้ ใช้ `<Picture src={url} type={type} ...>` โดยส่ง `type` prop ที่ component รับเข้ามา (`type` ของ ImageUpload คือ `'posters'|'profiles'` ตรงกันพอดี)

- [ ] **Step 2: Verify + commit**

Run: `npm run check` → no new errors
Run: `npm run dev` → ทุกหน้า admin thumbnail ขึ้นปกติ

```bash
git add -A
git commit -m "feat(images): use Picture component on admin pages"
```

---

## Task 9: Final LCP verification

- [ ] **Step 1: Capture before/after LCP**

ก่อน merge ทั้งหมด (หรือใช้ branch เปรียบเทียบ):
1. เปิด `/th/series` และ `/th/series/{id}` บน Chrome DevTools → Lighthouse → Mobile
2. บันทึก **LCP** และ **Total image bytes** ก่อน/หลัง
3. คาดว่า LCP ลดลงชัดเจน (รูป AVIF 480w บนมือถือ แทน jpg 1080w ต้นฉบับ) + image bytes ลดมาก

- [ ] **Step 2: Regression smoke**

- อัปโหลดรูปใหม่ผ่าน admin → variants ครบ + DB URL canonical
- รูปเดิมที่ backfill แล้ว → `<picture>` srcset
- รูป external (logo/social) → plain `<img>` ไม่พัง
- หน้าที่ไม่มีรูป → render nothing, placeholder ของ caller ทำงานปกติ

- [ ] **Step 3: Final commit (docs/notes ถ้ามี)**

```bash
git add -A
git commit -m "chore(images): post-verification"
```

---

## Self-Review Notes

- **Spec coverage:** config (T1) ✓ · sharp (T2) ✓ · uploadImage rewrite + cache headers (T3) ✓ · `<Picture>` (T4) ✓ · UI Phase 1 (T5) ✓ · dimensions/lazy Phase 2 (T6) ✓ · backfill idempotent (T7) ✓ · admin Phase 3 (T8) ✓ · verify (T9) ✓
- **Type consistency:** `ImageType = 'posters'|'profiles'` ใช้ตลอด; `Variant`/`SrcEntry`/`VariantSet` shapes ตรงกันระหว่าง config/sharp/Picture; `putObject`/`objectExists` export จาก r2.ts ใช้ใน backfill
- **Naming:** ใช้ `type` (พหูพจน์) ทุกที่ตาม codebase เดิม ไม่ใช่ `kind`
