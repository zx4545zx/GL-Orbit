# Native Feed Link Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace feed iframes with polished native provider cards while retaining immediate embeds on moment detail pages.

**Architecture:** Restore the existing detail-page embed implementation, then add a feed-card branch before it. The server stores TikTok oEmbed metadata when a moment is created or updated; a one-time Node script backfills existing TikTok moments after explicit database-write approval. Feed rendering only reads stored data and lazy-loads an image.

**Tech Stack:** Svelte 5, SvelteKit, TypeScript, native `fetch`, Neon serverless driver, existing JSON embed metadata. Automated tests omitted per user instruction; validate with `npm run check` and browser inspection.

---

## File structure

- Modify `src/lib/server/embeds/resolver.ts`: store TikTok title, author, thumbnail URL, and expiry.
- Modify `src/lib/server/embeds/types.ts`: declare the optional thumbnail expiry metadata.
- Modify `src/lib/components/moments/types.ts`: map persisted metadata to view-friendly preview fields.
- Modify `src/lib/components/moments/MomentCard.svelte`: explicitly select native feed-card mode.
- Modify `src/lib/components/moments/EmbedPreview.svelte`: keep its existing detail embed branches and add feed-native cards before them.
- Create `scripts/backfill-tiktok-embed-metadata.mjs`: safe one-time update for existing TikTok rows.

### Task 1: Discard the superseded uncommitted iframe attempt

**Files:**
- Restore: `src/lib/components/moments/EmbedPreview.svelte`
- Restore: `src/lib/components/moments/MomentCard.svelte`
- Restore: `src/lib/components/moments/types.ts`
- Restore: `src/lib/server/embeds/resolver.ts`
- Delete: `src/lib/components/moments/XEmbedPlayer.svelte`

- [ ] **Step 1: Restore tracked files and remove the untracked component**

```bash
git restore src/lib/components/moments/EmbedPreview.svelte src/lib/components/moments/MomentCard.svelte src/lib/components/moments/types.ts src/lib/server/embeds/resolver.ts
rm src/lib/components/moments/XEmbedPlayer.svelte
```

- [ ] **Step 2: Confirm no superseded player changes remain**

Run: `git diff -- src/lib/components/moments/EmbedPreview.svelte src/lib/components/moments/MomentCard.svelte src/lib/components/moments/types.ts src/lib/server/embeds/resolver.ts`

Expected: no output.

### Task 2: Persist TikTok card metadata

**Files:**
- Modify: `src/lib/server/embeds/resolver.ts`
- Modify: `src/lib/server/embeds/types.ts`

- [ ] **Step 1: Extend resolved metadata**

```ts
metadata: { title?: string; authorName?: string; thumbnailUrl?: string; thumbnailExpiresAt?: string; providerName?: string };
```

- [ ] **Step 2: Add metadata extraction**

```ts
type TikTokOEmbed = { thumbnail_url?: unknown; title?: unknown; author_name?: unknown };

function getThumbnailExpiresAt(thumbnailUrl: string): string | undefined {
	try {
		const expires = Number(new URL(thumbnailUrl).searchParams.get('x-expires'));
		return Number.isFinite(expires) ? new Date(expires * 1_000).toISOString() : undefined;
	} catch {
		return undefined;
	}
}

async function getTikTokMetadata(canonicalUrl: string): Promise<ResolvedEmbed['metadata']> {
	try {
		const endpoint = new URL('https://www.tiktok.com/oembed');
		endpoint.searchParams.set('url', canonicalUrl);
		const response = await fetch(endpoint, { signal: AbortSignal.timeout(3_000) });
		if (!response.ok) return { providerName: 'TikTok' };
		const data = await response.json() as TikTokOEmbed;
		const thumbnailUrl = typeof data.thumbnail_url === 'string' && data.thumbnail_url.startsWith('https://') ? data.thumbnail_url : undefined;
		return {
			providerName: 'TikTok',
			title: typeof data.title === 'string' ? data.title : undefined,
			authorName: typeof data.author_name === 'string' ? data.author_name : undefined,
			thumbnailUrl,
			thumbnailExpiresAt: thumbnailUrl ? getThumbnailExpiresAt(thumbnailUrl) : undefined
		};
	} catch {
		return { providerName: 'TikTok' };
	}
}
```

- [ ] **Step 3: Return this metadata for a recognized TikTok URL**

```ts
if (host === 'www.tiktok.com' || host === 'tiktok.com') {
	const match = /^\/@[^/]+\/video\/(\d+)$/.exec(url.pathname);
	if (match) return { provider: 'TIKTOK', canonicalUrl, externalId: match[1], status: 'FALLBACK', metadata: await getTikTokMetadata(canonicalUrl) };
}
```

### Task 3: Map metadata and render native feed cards

**Files:**
- Modify: `src/lib/components/moments/types.ts`
- Modify: `src/lib/components/moments/MomentCard.svelte`
- Modify: `src/lib/components/moments/EmbedPreview.svelte`

- [ ] **Step 1: Add preview metadata to the view model**

```ts
embedMetadata?: { thumbnailUrl?: string; thumbnailExpiresAt?: string; title?: string; authorName?: string; providerName?: string } | null;
```

Add `previewThumbnailUrl`, `previewTitle`, and `previewAuthor` to `ProfileMoment`. In `toProfileMoment`, accept `thumbnailUrl` only when it is HTTPS and `thumbnailExpiresAt` is absent or later than `Date.now()`.

- [ ] **Step 2: Mark feed cards without changing detail behavior**

```svelte
<EmbedPreview
	provider={moment.provider}
	source={moment.source}
	thumbnailUrl={moment.previewThumbnailUrl}
	title={moment.previewTitle}
	author={moment.previewAuthor}
	feedCard={!expanded}
/>
```

- [ ] **Step 3: Add the feed-card branch before existing player branches**

```svelte
{#if embed && feedCard}
	<a href={source} target="_blank" rel="noreferrer" class="halo-focus-ring group block overflow-hidden rounded-2xl border border-[#ded8df] bg-[#f6f3f6] transition hover:-translate-y-0.5 hover:shadow-md">
		{#if previewImage}
			<img src={previewImage} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror={() => thumbnailFailed = true} class={embed.kind === 'tiktok' ? 'aspect-[9/14] w-full object-cover' : 'aspect-video w-full object-cover'} />
		{:else}
			<div class={embed.kind === 'tiktok' ? 'aspect-[9/14] bg-gradient-to-br from-plum via-coral-dark to-lavender-dark p-5 text-white' : 'aspect-video bg-gradient-to-br from-plum to-lavender-dark p-5 text-white'}>
				<span class="text-xs font-bold uppercase tracking-wider">{provider}</span>
				<p class="mt-3 text-base font-bold">{title || (isThai ? 'เปิดดูโมเมนต์ต้นฉบับ' : 'Open original moment')}</p>
				{#if author}<p class="mt-1 text-sm text-white/75">@{author}</p>{/if}
			</div>
		{/if}
		<div class="flex items-center justify-between bg-white px-4 py-3 text-xs"><span><strong class="font-medium text-plum">{title || provider}</strong>{#if author}<span class="ml-1.5 text-plum-light">· {author}</span>{/if}</span><span class="font-medium text-coral-dark">{isThai ? 'เปิดดู ↗' : 'Open ↗'}</span></div>
	</a>
{:else if embed?.kind === 'x'}
```

Set `previewImage` to the stable YouTube URL for YouTube and to `thumbnailUrl` for TikTok. X has no preview image and uses the branded text card.

- [ ] **Step 4: Run static validation**

Run: `npm run check`

Expected: 0 errors.

### Task 4: Backfill existing TikTok moments

**Files:**
- Create: `scripts/backfill-tiktok-embed-metadata.mjs`

- [ ] **Step 1: Create a bounded backfill script**

The script must:

```js
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const getExpiry = (url) => {
	try { const expires = Number(new URL(url).searchParams.get('x-expires')); return Number.isFinite(expires) ? new Date(expires * 1_000).toISOString() : undefined; }
	catch { return undefined; }
};
const rows = await sql.query("SELECT id, source_canonical_url FROM moments WHERE source_provider = 'TIKTOK' AND (embed_metadata->>'thumbnailUrl') IS NULL");
for (const row of rows) {
	const endpoint = new URL('https://www.tiktok.com/oembed');
	endpoint.searchParams.set('url', row.source_canonical_url);
	const response = await fetch(endpoint, { signal: AbortSignal.timeout(3_000) });
	if (!response.ok) continue;
	const metadata = await response.json();
	if (typeof metadata.thumbnail_url !== 'string' || !metadata.thumbnail_url.startsWith('https://')) continue;
	await sql.query(
		"UPDATE moments SET embed_metadata = coalesce(embed_metadata, '{}'::jsonb) || $1::jsonb, updated_at = now() WHERE id = $2",
		[JSON.stringify({ providerName: 'TikTok', title: metadata.title, authorName: metadata.author_name, thumbnailUrl: metadata.thumbnail_url, thumbnailExpiresAt: getExpiry(metadata.thumbnail_url) }), row.id]
	);
}
```

- [ ] **Step 2: Present update scope and obtain explicit approval**

Report the number of candidate rows and ask for consent before executing the script. Do not run it yet.

- [ ] **Step 3: Execute the approved script and verify affected rows**

Run: `node scripts/backfill-tiktok-embed-metadata.mjs`

Then query the candidate rows and confirm which received `thumbnailUrl` metadata.

### Task 5: Browser verification and commit

**Files:**
- Modify: `src/lib/server/embeds/resolver.ts`
- Modify: `src/lib/components/moments/types.ts`
- Modify: `src/lib/components/moments/MomentCard.svelte`
- Modify: `src/lib/components/moments/EmbedPreview.svelte`
- Create: `scripts/backfill-tiktok-embed-metadata.mjs`

- [ ] **Step 1: Verify mobile feed**

At a mobile viewport, confirm TikTok, YouTube, and X feed cards contain no iframe and are each one external link. Confirm a failed external image leaves the branded card visible.

- [ ] **Step 2: Verify detail pages**

Open a supported moment detail page and confirm the existing provider embed still mounts.

- [ ] **Step 3: Commit when approved**

```bash
git add src/lib/server/embeds/resolver.ts src/lib/components/moments/types.ts src/lib/components/moments/MomentCard.svelte src/lib/components/moments/EmbedPreview.svelte scripts/backfill-tiktok-embed-metadata.mjs
```
