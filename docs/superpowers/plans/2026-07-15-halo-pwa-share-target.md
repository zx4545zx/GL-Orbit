# Halo PWA Share Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Receive shared text and HTTPS links in the installed GL-Orbit PWA and open a dedicated Halo Moment compose page, retaining the payload through login.

**Architecture:** Add `share_target` metadata to both PWA manifest sources. A dedicated compose route normalizes Web Share Target query parameters into a short-lived HTTP-only cookie, then uses the existing composer with initial values. The composer gains optional initial-value and success-destination props, leaving the inline feed composer unchanged.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, `@vite-pwa/sveltekit`, SvelteKit cookies and redirects.

---

## File structure

- Create: `src/lib/server/moments/share-target.ts` — validates, normalizes, serializes, and deserializes the short-lived share payload.
- Create: `src/routes/[lang=lang]/(orbit-halo)/halo/compose/+page.server.ts` — receives share-target fields, preserves them through login, and loads series options.
- Create: `src/routes/[lang=lang]/(orbit-halo)/halo/compose/+page.svelte` — full-page Halo compose view with cancel navigation.
- Modify: `vite.config.ts` — declares the generated manifest share target.
- Modify: `static/manifest.webmanifest` — mirrors the share-target declaration for the static manifest.
- Modify: `src/lib/components/moments/MomentComposer.svelte` — accepts initial body/link values and an optional post-publish destination.
- Modify: `src/routes/[lang=lang]/(orbit-halo)/+layout.svelte` — routes Halo create controls, including mobile create, to the compose page.

No automated tests: explicitly excluded by product decision. Final validation is `npm run check` plus manual browser/device checks.

### Task 1: Add share-payload normalization

**Files:**
- Create: `src/lib/server/moments/share-target.ts`

- [ ] **Step 1: Create a bounded payload helper**

```ts
export const SHARE_TARGET_COOKIE = 'halo_share_target';
export const SHARE_TARGET_MAX_AGE = 10 * 60;

export type SharedMomentPayload = { body: string; sourceUrl: string };

function text(value: string | null): string {
	return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function validHttpsUrl(value: string): string {
	try {
		return new URL(value).protocol === 'https:' ? value : '';
	} catch {
		return '';
	}
}

export function normalizeSharedMoment(input: URLSearchParams): SharedMomentPayload | null {
	const title = text(input.get('title'));
	const sharedText = text(input.get('text'));
	const body = [title, sharedText]
		.filter((part, index, parts) => part && parts.indexOf(part) === index)
		.join('\n\n')
		.slice(0, 2_000);
	const sourceUrl = validHttpsUrl(text(input.get('url')));
	return body || sourceUrl ? { body, sourceUrl } : null;
}

export function readSharedMoment(value: string | undefined): SharedMomentPayload | null {
	if (!value) return null;
	try {
		const parsed = JSON.parse(value) as Partial<SharedMomentPayload>;
		const body = typeof parsed.body === 'string' ? parsed.body.slice(0, 2_000) : '';
		const sourceUrl = typeof parsed.sourceUrl === 'string' ? validHttpsUrl(parsed.sourceUrl) : '';
		return body || sourceUrl ? { body, sourceUrl } : null;
	} catch {
		return null;
	}
}
```

- [ ] **Step 2: Commit the helper**

```bash
git add src/lib/server/moments/share-target.ts
git commit -m "feat(halo): normalize shared PWA payloads"
```

### Task 2: Declare the Web Share Target and load the compose payload

**Files:**
- Modify: `vite.config.ts:17-48`
- Modify: `static/manifest.webmanifest:1-27`
- Create: `src/routes/[lang=lang]/(orbit-halo)/halo/compose/+page.server.ts`

- [ ] **Step 1: Add matching manifest declarations**

Add this object to both existing manifest objects:

```ts
share_target: {
	action: '/halo/compose',
	method: 'GET',
	enctype: 'application/x-www-form-urlencoded',
	params: {
		title: 'title',
		text: 'text',
		url: 'url'
	}
}
```

Use the JSON equivalent in `static/manifest.webmanifest`. The existing locale hook redirects the non-localized share action to `/{lang}/halo/compose` while retaining the share query parameters.

- [ ] **Step 2: Implement the server route**

```ts
import { redirect } from '@sveltejs/kit';
import { getMomentSeriesOptions } from '$lib/server/moments/queries.js';
import {
	SHARE_TARGET_COOKIE,
	SHARE_TARGET_MAX_AGE,
	normalizeSharedMoment,
	readSharedMoment
} from '$lib/server/moments/share-target.js';
import type { PageServerLoad } from './$types.js';

const cookieOptions = {
	path: '/',
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge: SHARE_TARGET_MAX_AGE
};

export const load: PageServerLoad = async ({ cookies, locals, params, url }) => {
	const composePath = `/${params.lang}/halo/compose`;
	const incoming = normalizeSharedMoment(url.searchParams);
	if (incoming) {
		cookies.set(SHARE_TARGET_COOKIE, JSON.stringify(incoming), cookieOptions);
		throw redirect(303, composePath);
	}

	const shared = readSharedMoment(cookies.get(SHARE_TARGET_COOKIE));
	if (shared && !locals.user) {
		throw redirect(303, `/${params.lang}/login?redirectTo=${encodeURIComponent(composePath)}`);
	}
	if (shared) cookies.delete(SHARE_TARGET_COOKIE, { path: '/' });

	return {
		initialBody: shared?.body ?? '',
		initialUrl: shared?.sourceUrl ?? '',
		seriesOptions: await getMomentSeriesOptions(params.lang)
	};
};
```

- [ ] **Step 3: Commit manifest and route work**

```bash
git add vite.config.ts static/manifest.webmanifest \
  "src/routes/[lang=lang]/(orbit-halo)/halo/compose/+page.server.ts"
git commit -m "feat(pwa): receive shared Halo links"
```

### Task 3: Make the existing composer usable from the compose page

**Files:**
- Modify: `src/lib/components/moments/MomentComposer.svelte:8-183`
- Create: `src/routes/[lang=lang]/(orbit-halo)/halo/compose/+page.svelte`

- [ ] **Step 1: Add controlled initial-value and completion props**

Replace the current props and initial body/link states with:

```ts
let {
	seriesOptions,
	initialBody = '',
	initialUrl = '',
	successHref
}: {
	seriesOptions: SeriesOption[];
	initialBody?: string;
	initialUrl?: string;
	successHref?: string;
} = $props();
let url = $state(initialUrl);
let body = $state(initialBody);
```

Add an initial preview effect after `queuePreview` is declared:

```ts
$effect(() => {
	if (initialUrl) queuePreview();
});
```

Replace the success tail of `publish` with:

```ts
publishedMomentId = null;
composerState = 'idle';
if (successHref) {
		await goto(successHref, { invalidateAll: true });
		return;
}
showToast(copy.shared);
await invalidateAll();
```

This preserves the inline composer's toast and refresh while the dedicated page returns to the feed.

- [ ] **Step 2: Add dedicated page chrome and reuse the composer**

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import MomentComposer from '$lib/components/moments/MomentComposer.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const thai = $derived(page.data.lang === 'th');
	const feedHref = $derived(`/${page.data.lang}/halo`);
</script>

<svelte:head><title>{thai ? 'สร้าง Moment · Orbit Halo' : 'Create Moment · Orbit Halo'}</title></svelte:head>

<header class="sticky top-[var(--pwa-safe-top)] z-30 flex items-center gap-4 border-b border-[#eee9ef] bg-white/95 px-4 py-3 backdrop-blur-md">
	<a href={feedHref} class="halo-focus-ring grid h-10 w-10 place-items-center rounded-full hover:bg-plum/[.05]" aria-label={thai ? 'ยกเลิก' : 'Cancel'}>×</a>
	<h1 class="font-display text-lg font-extrabold">{thai ? 'สร้าง Moment' : 'Create Moment'}</h1>
</header>
<MomentComposer
	seriesOptions={data.seriesOptions}
	initialBody={data.initialBody}
	initialUrl={data.initialUrl}
	successHref={feedHref}
/>
```

- [ ] **Step 3: Commit compose UI work**

```bash
git add src/lib/components/moments/MomentComposer.svelte \
  "src/routes/[lang=lang]/(orbit-halo)/halo/compose/+page.svelte"
git commit -m "feat(halo): add dedicated Moment composer"
```

### Task 4: Route Halo creation controls to the compose page

**Files:**
- Modify: `src/routes/[lang=lang]/(orbit-halo)/+layout.svelte:67,107`

- [ ] **Step 1: Replace both inline-composer links**

```svelte
<a href={`${base}/compose`} class="halo-focus-ring mt-4 flex w-full max-w-[190px] items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-bold text-white transition hover:bg-coral-dark">{m.halo_create()}</a>
```

```svelte
<a href={`${base}/compose`} class="halo-focus-ring flex min-h-14 items-center justify-center" aria-label={m.halo_create()}><span class="grid h-10 w-10 place-items-center rounded-full bg-coral text-white"><HaloIcon name="plus" size={20} /></span></a>
```

The second replacement is the mobile Bottom Nav “สร้าง” control identified in the product review.

- [ ] **Step 2: Commit navigation change**

```bash
git add "src/routes/[lang=lang]/(orbit-halo)/+layout.svelte"
git commit -m "feat(halo): route create controls to composer"
```

### Task 5: Validate manually and type-check

**Files:**
- No source changes expected.

- [ ] **Step 1: Run the project checker**

Run: `npm run check`

Expected: exit code 0; no Svelte or TypeScript diagnostics.

- [ ] **Step 2: Manually validate supported PWA sharing**

On an installed PWA in a browser that supports Web Share Target:

1. Share a HTTPS link and text to GL-Orbit; verify `/th/halo/compose` opens with body and link populated.
2. Share while signed out; verify login opens first, then the same populated compose page opens after login.
3. Publish; verify navigation returns to `/th/halo` and the new Moment appears.
4. Tap the mobile Bottom Nav “สร้าง” button; verify it opens `/th/halo/compose`.
5. Open a non-supporting browser; verify normal Halo navigation and manual link entry still work.

- [ ] **Step 3: Inspect final diff and commit validation fixes only if needed**

Run: `git diff --check && git status --short`

Expected: no whitespace errors. Do not create a commit if no validation changes are needed.
