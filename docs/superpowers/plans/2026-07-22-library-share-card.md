# Library Share Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one Profile action that creates and shares a branded 1080×1350 PNG summarizing the member’s existing GL-Orbit library data.

**Architecture:** Keep all generation client-side. A focused Canvas utility accepts a privacy-safe view model and returns a PNG Blob; a Svelte component owns busy/share/download feedback and receives data already loaded by the Profile route.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript 5.8, native Canvas and Web Share APIs, Paraglide i18n, Vitest 4, Testing Library Svelte.

## Global Constraints

- Do not add dependencies, API routes, database queries, tables, migrations, or environment variables.
- Generate exactly one 1080×1350 `image/png` card.
- Use only display name, avatar, favorite count, watched count, and the first three already date-descending favorites.
- Never render email, username, internal user ID, role, or account/session metadata into the image.
- Native file sharing is preferred; unsupported sharing falls back to `gl-orbit-library.png` download.
- A failed avatar or poster must use a placeholder and must not abort generation.
- Keep Profile UI rectangular, localized in Thai and English, keyboard accessible, and at least 44px high.
- Do not add format selection, poster selection, captions, themes, previews, or modals in this version.

---

## File Structure

- Create `src/lib/client/library-share-card.ts`: typed Canvas composition, image fallback, PNG export, native share, and download fallback.
- Create `src/lib/client/library-share-card.test.ts`: deterministic Canvas/share/download unit coverage.
- Create `src/lib/components/profile/LibraryShareCard.svelte`: compact Profile action and interaction feedback.
- Create `src/lib/components/profile/LibraryShareCard.test.ts`: component state and privacy-safe input coverage.
- Modify `src/routes/[lang=lang]/(app)/profile/+page.svelte`: pass existing Profile data into the new component.
- Modify `messages/th.json` and `messages/en.json`: paired feature labels and Canvas text.

### Task 1: Canvas generation and delivery utility

**Files:**
- Create: `src/lib/client/library-share-card.ts`
- Create: `src/lib/client/library-share-card.test.ts`

**Interfaces:**
- Consumes: browser `document`, `Image`, `HTMLCanvasElement`, `navigator.share`, and `navigator.canShare`.
- Produces: `LibraryShareCardInput`, `createLibraryShareCard(input): Promise<Blob>`, and `shareLibraryCard(blob, copy): Promise<'shared' | 'downloaded' | 'cancelled'>`.

- [ ] **Step 1: Write failing tests for fixed output, safe fallbacks, and delivery behavior**

Create Canvas mocks whose `measureText()` returns deterministic widths, `toBlob()` yields `new Blob(['png'], { type: 'image/png' })`, and drawing methods are spies. Cover this exact contract:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	LIBRARY_CARD_HEIGHT,
	LIBRARY_CARD_WIDTH,
	createLibraryShareCard,
	shareLibraryCard,
	type LibraryShareCardInput
} from './library-share-card.js';

const input: LibraryShareCardInput = {
	lang: 'th',
	displayName: 'Orbit Member',
	avatarUrl: null,
	favoriteCount: 4,
	watchedCount: 2,
	favorites: [
		{ title: 'First', poster: '/first.jpg' },
		{ title: 'Second', poster: '/second.jpg' },
		{ title: 'Third', poster: '/third.jpg' },
		{ title: 'Must not render', poster: '/fourth.jpg' }
	],
	createdAt: new Date('2026-07-22T00:00:00.000Z')
};

describe('createLibraryShareCard', () => {
	it('exports a 1080×1350 PNG and limits favorites to three', async () => {
		const blob = await createLibraryShareCard(input);
		expect(LIBRARY_CARD_WIDTH).toBe(1080);
		expect(LIBRARY_CARD_HEIGHT).toBe(1350);
		expect(blob.type).toBe('image/png');
	});

	it('still exports when avatar, posters, and favorites are unavailable', async () => {
		await expect(createLibraryShareCard({
			...input,
			avatarUrl: null,
			favorites: []
		})).resolves.toMatchObject({ type: 'image/png' });
	});
});

describe('shareLibraryCard', () => {
	it('shares an image/png file when native file sharing is supported', async () => {
		await expect(shareLibraryCard(new Blob(['png'], { type: 'image/png' }), {
			title: 'My GL Orbit', text: 'My library'
		})).resolves.toBe('shared');
	});

	it('downloads and revokes its object URL when file sharing is unsupported', async () => {
		await expect(shareLibraryCard(new Blob(['png'], { type: 'image/png' }), {
			title: 'My GL Orbit', text: 'My library'
		})).resolves.toBe('downloaded');
		expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
	});

	it('returns cancelled for AbortError without downloading', async () => {
		await expect(shareLibraryCard(new Blob(['png'], { type: 'image/png' }), {
			title: 'My GL Orbit', text: 'My library'
		})).resolves.toBe('cancelled');
	});
});
```

The test setup must retain the created Canvas instance and assert `width`, `height`, `toBlob('image/png')`, at most three poster load attempts, placeholder drawing after rejected image loads, native `File.type`, anchor `download`, and URL cleanup.

- [ ] **Step 2: Run the utility test and confirm the missing-module failure**

Run: `npm test -- src/lib/client/library-share-card.test.ts`

Expected: FAIL because `library-share-card.ts` does not exist.

- [ ] **Step 3: Implement the typed Canvas utility**

Use these public types and constants exactly:

```ts
export const LIBRARY_CARD_WIDTH = 1080;
export const LIBRARY_CARD_HEIGHT = 1350;

export interface LibraryShareFavorite {
	title: string;
	poster: string | null;
}

export interface LibraryShareCardInput {
	lang: 'th' | 'en';
	displayName: string;
	avatarUrl: string | null;
	favoriteCount: number;
	watchedCount: number;
	favorites: LibraryShareFavorite[];
	createdAt: Date;
}

export interface LibraryShareCopy {
	title: string;
	text: string;
}
```

Implement generation with this control flow:

```ts
export async function createLibraryShareCard(input: LibraryShareCardInput): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = LIBRARY_CARD_WIDTH;
	canvas.height = LIBRARY_CARD_HEIGHT;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas 2D context unavailable');

	drawBackground(context);
	drawHeader(context, input.lang);
	await drawIdentity(context, input.displayName, input.avatarUrl);
	drawStats(context, input.favoriteCount, input.watchedCount, input.lang);
	await drawFavorites(context, input.favorites.slice(0, 3), input.lang);
	drawFooter(context, input.createdAt, input.lang);

	return await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png');
	});
}
```

`loadImage(url)` must set `image.crossOrigin = 'anonymous'` before `image.src`, resolve on load, and reject on error. `drawIdentity` and each `drawFavorites` cell catch image errors independently, draw a paper/lavender placeholder, and continue. Draw a fixed warm-paper card with plum/coral/mint rectangular regions, “MY GL ORBIT”, localized stat labels, member name, three poster cells, localized date, and `GL-ORBIT`. Clamp long member/title text with an ellipsis based on `measureText()`.

Implement delivery exactly as a native-share-or-download decision:

```ts
export async function shareLibraryCard(
	blob: Blob,
	copy: LibraryShareCopy
): Promise<'shared' | 'downloaded' | 'cancelled'> {
	const file = new File([blob], 'gl-orbit-library.png', { type: 'image/png' });
	if (typeof navigator.share === 'function' &&
		typeof navigator.canShare === 'function' &&
		navigator.canShare({ files: [file] })) {
		try {
			await navigator.share({ files: [file], title: copy.title, text: copy.text });
			return 'shared';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
			throw error;
		}
	}

	const url = URL.createObjectURL(blob);
	try {
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'gl-orbit-library.png';
		anchor.click();
		return 'downloaded';
	} finally {
		URL.revokeObjectURL(url);
	}
}
```

- [ ] **Step 4: Run focused tests and static checks**

Run: `npm test -- src/lib/client/library-share-card.test.ts && npm run check`

Expected: utility tests pass; Svelte/TypeScript check reports 0 errors, with only known unrelated warnings if still present.

- [ ] **Step 5: Commit the isolated utility**

```bash
git add src/lib/client/library-share-card.ts src/lib/client/library-share-card.test.ts
git commit -m "feat(profile): generate library share card"
```

### Task 2: Profile action component and localization

**Files:**
- Create: `src/lib/components/profile/LibraryShareCard.svelte`
- Create: `src/lib/components/profile/LibraryShareCard.test.ts`
- Modify: `messages/th.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `createLibraryShareCard`, `shareLibraryCard`, `FavoriteSeriesItem`, and active `th | en` language.
- Produces: a compact rectangular action row with one button and live-region feedback.

- [ ] **Step 1: Add paired Thai and English message keys**

Add these exact semantic keys with natural translations:

```json
"profile_library_share_title": "แชร์คลังของฉัน",
"profile_library_share_description": "สร้างภาพสรุปรายการโปรดและเรื่องที่ดูแล้ว",
"profile_library_share_action": "แชร์คลังของฉัน",
"profile_library_share_creating": "กำลังสร้าง...",
"profile_library_share_success": "พร้อมแชร์คลังของคุณแล้ว",
"profile_library_share_downloaded": "ดาวน์โหลดการ์ดแล้ว",
"profile_library_share_error": "สร้างการ์ดไม่สำเร็จ ลองอีกครั้ง",
"profile_library_share_native_title": "คลัง GL ของฉัน",
"profile_library_share_native_text": "นี่คือคลัง GL ของฉันบน GL-Orbit",
"profile_library_share_card_favorites": "รายการโปรด",
"profile_library_share_card_watched": "ดูแล้ว",
"profile_library_share_card_empty": "ยังรอเรื่องโปรดของคุณ",
"profile_library_share_member_fallback": "สมาชิก GL-Orbit"
```

The English file uses: “Share my library”, “Create an image of your favorites and watched series”, “Creating...”, “Your library card is ready to share”, “Library card downloaded”, “Could not create the card. Try again”, “My GL library”, “Here is my GL library on GL-Orbit”, “Favorites”, “Watched”, “Your next favorite belongs here”, and “GL-Orbit member”.

- [ ] **Step 2: Write failing component tests**

Mock `$lib/client/library-share-card.js`. Render with four favorites and assert generation receives only the first three, exact counts, display name, avatar, and active language. Add tests for:

```ts
it('prevents duplicate generation while busy', async () => {
	// Keep createLibraryShareCard pending, click twice, and expect one call.
});

it('shows success after native share and download-specific feedback after fallback', async () => {
	// Resolve shareLibraryCard as "shared", then as "downloaded".
});

it('shows no error after native share cancellation', async () => {
	// Resolve shareLibraryCard as "cancelled" and expect idle state.
});

it('retains the action and exposes retry feedback after failure', async () => {
	// Reject generation, assert localized error and enabled action.
});
```

Also assert the rendered DOM contains no email, username, role, or user ID prop because the component interface does not accept them.

- [ ] **Step 3: Run the component test and confirm failure**

Run: `npm test -- src/lib/components/profile/LibraryShareCard.test.ts`

Expected: FAIL because `LibraryShareCard.svelte` does not exist.

- [ ] **Step 4: Implement the Svelte 5 component**

Use this prop boundary so private profile fields cannot reach the generator:

```svelte
<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import {
		createLibraryShareCard,
		shareLibraryCard
	} from '$lib/client/library-share-card.js';
	import type { FavoriteSeriesItem } from '$lib/types.js';

	let {
		lang,
		displayName,
		avatarUrl,
		favoriteCount,
		watchedCount,
		favorites
	}: {
		lang: 'th' | 'en';
		displayName: string;
		avatarUrl: string | null;
		favoriteCount: number;
		watchedCount: number;
		favorites: FavoriteSeriesItem[];
	} = $props();

	let busy = $state(false);
	let status = $state<'idle' | 'shared' | 'downloaded' | 'error'>('idle');

	async function handleShare() {
		if (busy) return;
		busy = true;
		status = 'idle';
		try {
			const blob = await createLibraryShareCard({
				lang,
				displayName,
				avatarUrl,
				favoriteCount,
				watchedCount,
				favorites: favorites.slice(0, 3).map(({ title, poster }) => ({ title, poster })),
				createdAt: new Date()
			});
			const result = await shareLibraryCard(blob, {
				title: m.profile_library_share_native_title(),
				text: m.profile_library_share_native_text()
			});
			if (result !== 'cancelled') status = result;
		} catch {
			status = 'error';
		} finally {
			busy = false;
		}
	}
</script>
```

Render one `border border-[var(--orbit-line-strong)] bg-[var(--orbit-surface)]` row. Use a compact title/description region and one coral action button with `type="button"`, `onclick={handleShare}`, `disabled={busy}`, visible focus styles, and `min-h-11`. Render status text in `aria-live="polite"`; cancellation renders no message. Do not use rounded utilities, a modal, or a full card preview.

- [ ] **Step 5: Compile messages and run focused tests**

Run: `npm run i18n:compile && npm test -- src/lib/components/profile/LibraryShareCard.test.ts src/lib/client/library-share-card.test.ts && npm run check`

Expected: both suites pass; check reports 0 errors.

- [ ] **Step 6: Commit component and copy**

```bash
git add messages/th.json messages/en.json src/lib/components/profile/LibraryShareCard.svelte src/lib/components/profile/LibraryShareCard.test.ts
git commit -m "feat(profile): add library share action"
```

### Task 3: Profile integration and end-to-end verification

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/profile/+page.svelte`
- Test: `src/lib/components/profile/LibraryShareCard.test.ts`

**Interfaces:**
- Consumes: existing `profileUser`, `favoriteSeries`, `watchedSeries`, and `page.data.lang` values.
- Produces: the share action above the Favorite/Watched toggle inside Profile → Library.

- [ ] **Step 1: Import and mount the component without expanding Profile data flow**

Add the import:

```ts
import LibraryShareCard from '$lib/components/profile/LibraryShareCard.svelte';
```

Mount it immediately inside the `activeTab === 'library'` branch, above the sub-toggle:

```svelte
<LibraryShareCard
	lang={page.data.lang}
	displayName={profileUser.displayName || m.profile_library_share_member_fallback()}
	avatarUrl={profileUser.avatarUrl}
	favoriteCount={favoriteSeries.length}
	watchedCount={watchedSeries.length}
	favorites={favoriteSeries}
/>
```

Do not fall back to `profileUser.username` because the exported image must not reveal it.

- [ ] **Step 2: Run focused and full static validation**

Run:

```bash
npm test -- src/lib/client/library-share-card.test.ts src/lib/components/profile/LibraryShareCard.test.ts
npm run check
git diff --check
```

Expected: focused tests pass; check reports 0 errors; diff check is clean.

- [ ] **Step 3: Browser-check the compact Profile interaction**

Open `/th/profile` while authenticated. In Profile → Library verify:

- one compact rectangular feature row appears before the Favorite/Watched toggle;
- there is one action and no picker, editor, modal, or full-size preview;
- the action is keyboard focusable and at least 44px tall;
- busy state disables duplicate activation;
- generated file is named `gl-orbit-library.png`, MIME `image/png`, and measures 1080×1350;
- the image contains display name, counts, at most three latest favorites, branded empty cells where needed, and no email/username/ID/role;
- failed poster loading still produces the PNG;
- mobile 320–390px and desktop layouts have no horizontal overflow;
- light and dark browser themes produce the same readable warm-paper image.

Repeat the copy check on `/en/profile`. Exercise native share on a supporting browser if available; otherwise verify download fallback and report native share as platform-limited rather than failed.

- [ ] **Step 4: Run final project validation**

Run:

```bash
npm test -- --run
npm run check
git diff --check
```

Expected: full Vitest suite passes; Svelte/TypeScript reports 0 errors; only established unrelated warnings may remain; diff check is clean.

- [ ] **Step 5: Commit Profile integration**

```bash
git add src/routes/[lang=lang]/\(app\)/profile/+page.svelte messages/th.json messages/en.json
git commit -m "feat(profile): expose library share card"
```

Stop after local verification. Do not push, merge, or alter database state unless explicitly requested.
