# X Composer Official Embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the composer’s minimal X metadata card with the official X post embed.

**Architecture:** `MomentComposer.svelte` detects the already-resolved `X` provider and passes its external status ID and source URL to the existing `XEmbedPlayer.svelte`. All other providers keep the current compact metadata preview. `XEmbedPlayer` owns widgets-script loading, rendering, and direct-link fallback.

**Tech Stack:** Svelte 5, TypeScript, X widgets API already loaded by `src/lib/x-widgets.js`.

---

## File structure

- Modify `src/lib/components/moments/MomentComposer.svelte`: derive the X status ID from the resolved preview and branch to the official embed.
- Reuse `src/lib/components/moments/XEmbedPlayer.svelte`: preserve its loading, lazy-rendering, privacy, and fallback behavior unchanged.

### Task 1: Add the official X composer-preview branch

**Files:**
- Modify: `src/lib/components/moments/MomentComposer.svelte:12-24,171-176`

- [ ] **Step 1: Import the existing renderer and derive a valid X status ID**

```ts
import XEmbedPlayer from './XEmbedPlayer.svelte';

const xPreviewId = $derived.by(() => {
	if (linkPreview?.provider !== 'X') return null;
	try {
		return /^\d{8,24}$/.test(new URL(url).pathname.split('/').at(-1) ?? '')
			? new URL(url).pathname.split('/').at(-1) ?? null
			: null;
	} catch {
		return null;
	}
});
```

- [ ] **Step 2: Render the official embed only for a resolved X preview**

Replace the current preview card with this branch:

```svelte
{#if linkPreview && composerState === 'ready'}
	{#if xPreviewId}
		<div class="mt-3 overflow-hidden rounded-xl border border-white/80 bg-white/80">
			<XEmbedPlayer tweetId={xPreviewId} source={url.trim()} />
		</div>
	{:else}
		<div class="mt-3 flex overflow-hidden rounded-xl border border-white/80 bg-white/80">
			{#if linkPreview.metadata.thumbnailUrl}<img src={linkPreview.metadata.thumbnailUrl} alt="" class="h-14 w-20 shrink-0 object-cover" />{/if}
			<div class="min-w-0 px-3 py-2"><p class="truncate text-xs font-semibold text-plum">{linkPreview.metadata.title ?? linkPreview.metadata.providerName ?? linkPreview.provider}</p>{#if linkPreview.metadata.authorName}<p class="mt-0.5 truncate text-[11px] text-plum-light">{linkPreview.metadata.authorName}</p>{/if}</div>
		</div>
	{/if}
{/if}
```

### Task 2: Validate the user-visible X embed

**Files:**
- Verify: `src/lib/components/moments/MomentComposer.svelte`

- [ ] **Step 1: Run static validation**

Run: `npm run check`

Expected: exit code 0 with no diagnostics in `MomentComposer.svelte`.

- [ ] **Step 2: Verify in the browser**

Open: `http://localhost:5173/th/halo`

Enter a valid X status URL. Confirm that the composer replaces the plain `X` card with the official embed, shows the existing loading state while the widget initializes, and presents the original-post link if the widget cannot render. Confirm a non-X URL still uses the compact metadata card.

## Self-review

- Spec coverage: official X rendering, loading/fallback, no API key, and unchanged non-X cards are covered.
- Placeholder scan: none.
- Type consistency: `xPreviewId` is used consistently as the `XEmbedPlayer` `tweetId` prop.
