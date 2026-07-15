# Tap-to-load Feed Embeds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render inexpensive provider preview cards in Halo feeds and defer third-party players until the visitor activates one.

**Architecture:** Keep embed recognition and persistence on the server. Extend TikTok resolution with safe oEmbed thumbnail metadata, derive YouTube thumbnails from its video ID, and use text-first X cards. `MomentCard` passes feed/detail mode to `EmbedPreview`; only detail mode mounts a player immediately.

**Tech Stack:** Svelte 5 runes, SvelteKit, TypeScript, native `fetch`, existing Drizzle JSON metadata. Automated tests are intentionally omitted per user instruction; use browser verification and `npm run check`.

---

## File structure

- Modify `src/lib/server/embeds/resolver.ts`: enrich TikTok metadata with a best-effort oEmbed thumbnail URL.
- Modify `src/lib/components/moments/types.ts`: expose persisted embed metadata as a preview-thumbnail field.
- Modify `src/lib/components/moments/MomentCard.svelte`: select deferred feed mode versus immediate detail mode.
- Create `src/lib/components/moments/XEmbedPlayer.svelte`: mount the X widget only after the preview card is activated.
- Modify `src/lib/components/moments/EmbedPreview.svelte`: render accessible provider preview cards and mount players after activation.

### Task 1: Persist TikTok preview metadata

**Files:**
- Modify: `src/lib/server/embeds/resolver.ts`

- [ ] **Step 1: Add a fixed-origin TikTok oEmbed helper**

```ts
type TikTokOEmbed = { thumbnail_url?: unknown; title?: unknown; author_name?: unknown };

async function getTikTokMetadata(canonicalUrl: string): Promise<ResolvedEmbed['metadata']> {
	try {
		const endpoint = new URL('https://www.tiktok.com/oembed');
		endpoint.searchParams.set('url', canonicalUrl);
		const response = await fetch(endpoint, { signal: AbortSignal.timeout(3_000) });
		if (!response.ok) return { providerName: 'TikTok' };
		const data = await response.json() as TikTokOEmbed;
		return {
			providerName: 'TikTok',
			title: typeof data.title === 'string' ? data.title : undefined,
			authorName: typeof data.author_name === 'string' ? data.author_name : undefined,
			thumbnailUrl: typeof data.thumbnail_url === 'string' && data.thumbnail_url.startsWith('https://') ? data.thumbnail_url : undefined
		};
	} catch {
		return { providerName: 'TikTok' };
	}
}
```

- [ ] **Step 2: Use the helper for recognized TikTok videos**

```ts
if (host === 'www.tiktok.com' || host === 'tiktok.com') {
	const match = /^\/@[^/]+\/video\/(\d+)$/.exec(url.pathname);
	if (match) return {
		provider: 'TIKTOK', canonicalUrl, externalId: match[1], status: 'FALLBACK',
		metadata: await getTikTokMetadata(canonicalUrl)
	};
}
```

- [ ] **Step 3: Run static validation**

Run: `npm run check`

Expected: 0 errors. Tests intentionally omitted per user instruction.

### Task 2: Expose preview thumbnail data to the card

**Files:**
- Modify: `src/lib/components/moments/types.ts`

- [ ] **Step 1: Add metadata to API and view types**

```ts
embedMetadata?: { thumbnailUrl?: string; title?: string; authorName?: string; providerName?: string } | null;
```

Add that optional field to `MomentApiItem`, then add this to `ProfileMoment`:

```ts
previewThumbnailUrl: string | null;
```

- [ ] **Step 2: Map only valid HTTPS thumbnails**

```ts
const previewThumbnailUrl = moment.embedMetadata?.thumbnailUrl;
const safePreviewThumbnailUrl = typeof previewThumbnailUrl === 'string' && previewThumbnailUrl.startsWith('https://')
	? previewThumbnailUrl
	: null;
```

Return `previewThumbnailUrl: safePreviewThumbnailUrl` from `toProfileMoment`.

### Task 3: Select feed versus detail embed behavior

**Files:**
- Modify: `src/lib/components/moments/MomentCard.svelte:11,73`

- [ ] **Step 1: Pass deferred mode and thumbnail metadata to the preview**

```svelte
{#if moment.source}
	<div class="mt-3">
		<EmbedPreview
			provider={moment.provider}
			source={moment.source}
			thumbnailUrl={moment.previewThumbnailUrl}
			deferPlayer={!expanded}
		/>
	</div>
{/if}
```

`expanded` is already true on `halo/moments/[id]`, so detail pages retain immediate player loading.

### Task 4: Isolate deferred X widget loading

**Files:**
- Create: `src/lib/components/moments/XEmbedPlayer.svelte`
- Modify: `src/lib/components/moments/EmbedPreview.svelte`

- [ ] **Step 1: Move the existing X-specific state, `onMount` script loading, skeleton, blockquote, and CSS from `EmbedPreview.svelte` into `XEmbedPlayer.svelte`**

`XEmbedPlayer.svelte` accepts only `source: string` and `title: string`. Its component mount is the activation boundary, so `platform.x.com/widgets.js` cannot load until `EmbedPreview` renders this component.

- [ ] **Step 2: Replace the existing X branch in `EmbedPreview.svelte` with the lazy component**

```svelte
{:else if embed?.kind === 'x'}
	<XEmbedPlayer source={source} title={embed.title} />
```

### Task 5: Render a preview card before mounting a player

**Files:**
- Modify: `src/lib/components/moments/EmbedPreview.svelte`

- [ ] **Step 1: Extend component props and local state**

```ts
let {
	provider,
	source,
	thumbnailUrl = null,
	deferPlayer = false
}: {
	provider: 'YouTube' | 'TikTok' | 'X' | 'Link';
	source: string;
	thumbnailUrl?: string | null;
	deferPlayer?: boolean;
} = $props();
let playerActivated = $state(!deferPlayer);
let thumbnailFailed = $state(false);
```

- [ ] **Step 2: Derive a YouTube poster and a provider card label**

```ts
const previewImage = $derived.by(() => {
	if (thumbnailFailed) return null;
	if (embed?.kind === 'youtube') return `https://i.ytimg.com/vi/${embed.src.match(/embed\/([^?]+)/)?.[1]}/hqdefault.jpg`;
	if (embed?.kind === 'tiktok') return thumbnailUrl;
	return null;
});

const playLabel = $derived(isThai
	? `เล่น ${provider} ที่แนบมา`
	: `Play attached ${provider}`);
```

- [ ] **Step 3: Add the provider preview card before player markup**

```svelte
{#if embed && deferPlayer && !playerActivated}
	<div class="overflow-hidden rounded-2xl border border-[#ded8df] bg-[#f6f3f6]">
		<button type="button" onclick={() => playerActivated = true} class="halo-focus-ring group relative block w-full overflow-hidden text-left" aria-label={playLabel}>
			{#if previewImage}
				<img src={previewImage} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror={() => thumbnailFailed = true} class={embed.kind === 'tiktok' ? 'aspect-[9/14] w-full object-cover' : 'aspect-video w-full object-cover'} />
			{:else}
				<div class={embed.kind === 'tiktok' ? 'aspect-[9/14] bg-gradient-to-br from-plum to-coral-dark' : 'aspect-video bg-gradient-to-br from-plum to-lavender-dark'}></div>
			{/if}
			<span class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"></span>
			<span class="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-coral-dark shadow-lg">▶</span>
			<span class="absolute bottom-3 left-4 text-sm font-bold text-white">{isThai ? 'แตะเพื่อเล่น' : 'Tap to play'} · {provider}</span>
		</button>
		<a href={source} target="_blank" rel="noreferrer" class="halo-focus-ring flex items-center justify-between border-t border-[#ded8df] bg-white px-4 py-3 text-xs"><span class="font-medium text-plum">{isThai ? 'เปิดดูที่ต้นฉบับ' : 'View original'}</span><HaloIcon name="external" size={14} /></a>
	</div>
{:else if embed?.kind === 'x'}
```

- [ ] **Step 4: Run static validation and inspect the diff**

Run: `npm run check && git diff --check && git diff -- src/lib/server/embeds/resolver.ts src/lib/components/moments/types.ts src/lib/components/moments/MomentCard.svelte src/lib/components/moments/EmbedPreview.svelte`

Expected: 0 errors; feed markup has no iframe or X widget before activation.

### Task 6: Browser verification

**Files:**
- Modify: none

- [ ] **Step 1: Verify the mobile feed**

Open `/th/halo` at a mobile viewport. Confirm a TikTok, YouTube, and X post each show a poster/text card with a Thai play label and no player request before activation.

- [ ] **Step 2: Verify activation and fallback**

Tap each preview. Confirm only the activated card mounts its existing provider player, the original-source link remains available, and a failed TikTok poster displays the branded card.

- [ ] **Step 3: Verify detail page behavior**

Open `/th/halo/moments/<id>` for each supported provider. Confirm its player mounts immediately.

- [ ] **Step 4: Commit when approved**

```bash
git add src/lib/server/embeds/resolver.ts src/lib/components/moments/types.ts src/lib/components/moments/MomentCard.svelte src/lib/components/moments/XEmbedPlayer.svelte src/lib/components/moments/EmbedPreview.svelte
```
