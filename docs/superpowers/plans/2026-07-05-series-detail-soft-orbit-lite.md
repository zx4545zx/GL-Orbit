# Series Detail Soft Orbit Lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public series detail page feel lighter and smoother on mobile PWA while preserving GL-Orbit branding and all existing data/actions.

**Architecture:** Keep the current SvelteKit route and server data contract. Optimize the existing page by reducing mobile paint cost, default rendered DOM, duplicate high-priority image work, and iframe creation. Add only small local state and targeted CSS utilities.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind CSS 4, existing GL-Orbit components (`Picture`, `FavoriteButton`, `WatchedButton`, `ShareButton`).

---

## File Map

- Modify `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`
  - Remove mobile full-screen blurred poster background.
  - Restyle hero/action/synopsis/cast/gallery/schedule to Soft Orbit Lite.
  - Collapse schedules by default on mobile.
  - Render trailer iframes only after an explicit user action.
- Modify `src/app.css`
  - Disable fixed background attachment on mobile.
  - Add lightweight mobile performance utility if needed.
- Do not modify server load/query files.
- Do not add database, service worker, or API changes.

## Verification Policy

The user requested to skip tests. Do not run `npm test` for this task.

Run these checks instead:

```bash
npm run check
npm run build
```

---

### Task 1: Add local mobile/performance state

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte:88-171`

- [ ] **Step 1: Add trailer activation state**

Add a Svelte state set near the existing `expandedEpisodes` state:

```ts
let expandedEpisodes = $state(new Set<number>());
let activatedTrailers = $state(new Set<number>());
let initializedSeriesId = $state<string | null>(null);
```

- [ ] **Step 2: Add trailer activation helper**

Add this helper below `toggleEpisode`:

```ts
function activateTrailer(ep: number, event: MouseEvent) {
	event.stopPropagation();
	activatedTrailers.add(ep);
	activatedTrailers = new Set(activatedTrailers);
}
```

- [ ] **Step 3: Change initial expansion behavior**

Replace the current `$effect` body that auto-expands every episode with content. Use an empty set on initialization so mobile starts light and desktop also avoids initial iframe/DOM inflation:

```ts
$effect(() => {
	if (series && initializedSeriesId !== series.id) {
		expandedEpisodes = new Set();
		activatedTrailers = new Set();
		initializedSeriesId = series.id;
	}
});
```

- [ ] **Step 4: Keep toggle-all behavior unchanged**

Leave `toggleAll()` intact so users can still expand all rows manually:

```ts
function toggleAll() {
	if (allExpanded) {
		expandedEpisodes = new Set();
	} else {
		expandedEpisodes = new Set(episodeHasContent);
	}
}
```

---

### Task 2: Replace heavy mobile hero with Soft Orbit Lite hero

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte:269-370`

- [ ] **Step 1: Replace page shell classes**

Change the outer detail wrapper from heavy radial/blur layout to a soft static mobile shell:

```svelte
<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[linear-gradient(180deg,#FFF5F7_0%,#F7EEFF_42%,#F9FFFC_100%)] pb-[calc(2rem+var(--bottom-nav-reserved-space))] text-plum md:mb-0 md:-mt-24 md:pb-12 md:pt-24">
```

- [ ] **Step 2: Remove mobile full-screen poster blur**

Delete the block that renders:

```svelte
{#if coverCandidate}
	<div class="absolute inset-0 overflow-hidden opacity-45">
		<Picture src={coverCandidate} type="posters" sizes="100vw" alt="" width={1080} height={1620} loading="eager" fetchpriority="high" class="h-full w-full scale-110 object-cover blur-2xl" />
		<div class="absolute inset-0 bg-gradient-to-b from-cream/55 via-cream/78 to-cream/92"></div>
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,107,157,0.22),transparent_34%),radial-gradient(circle_at_74%_28%,rgba(196,181,253,0.24),transparent_38%),linear-gradient(90deg,rgba(255,245,247,0.96),rgba(255,245,247,0.62),rgba(240,230,255,0.94))]"></div>
	</div>
{/if}
```

- [ ] **Step 3: Replace decorative layers with static lightweight accents**

Immediately inside the outer wrapper, add only these decorative elements:

```svelte
<div class="pointer-events-none absolute left-[-4rem] top-10 h-40 w-40 rounded-full bg-coral/10 blur-2xl md:h-72 md:w-72 md:bg-coral/15"></div>
<div class="pointer-events-none absolute right-[-5rem] top-48 h-44 w-44 rounded-full bg-lavender/14 blur-2xl md:h-80 md:w-80 md:bg-lavender/18"></div>
<div class="pointer-events-none absolute bottom-24 left-1/4 h-36 w-36 rounded-full bg-mint/10 blur-2xl md:h-72 md:w-72"></div>
```

- [ ] **Step 4: Simplify poster card visual treatment**

Replace the poster wrapper classes with lighter surfaces:

```svelte
<div class="relative mx-auto w-full max-w-[21rem] md:max-w-none">
	<div class="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-coral/18 via-lavender/16 to-mint/10 blur-xl md:-inset-4 md:blur-2xl"></div>
	<div class="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 shadow-[0_18px_48px_-28px_rgba(139,92,246,0.45)] md:rounded-[2.25rem] md:shadow-2xl md:shadow-lavender/20 perf-card">
		<Picture src={series.poster} type="posters" sizes="(max-width: 768px) 84vw, 430px" alt={series.titleEn} width={480} height={720} loading="eager" fetchpriority="high" class="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
		<div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-plum/42 to-transparent"></div>
	</div>
</div>
```

---

### Task 3: Make action strip and info cards lighter

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte:296-368`

- [ ] **Step 1: Replace action strip classes**

Use a solid soft card instead of heavy blur:

```svelte
<div class="relative z-20 -mt-4 rounded-[1.5rem] border border-white/80 bg-white/86 p-2 shadow-[0_12px_34px_-24px_rgba(139,92,246,0.55)] md:-mt-5 md:rounded-[1.75rem] md:p-2.5">
	<div class="grid grid-cols-2 gap-2">
		<FavoriteButton seriesId={series.id} className="w-full justify-start bg-white/95 text-plum" />
		<WatchedButton seriesId={series.id} className="w-full justify-start bg-white/95 text-plum" />
		<div class="col-span-2">
			<ShareButton
				title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''}`}
				text={m.series_share_text({ title })}
				url={canonicalUrl}
				ariaLabel={m.series_share_aria_label()}
				variant="command"
				className="w-full justify-start bg-white/95 text-plum"
			/>
		</div>
	</div>
</div>
```

- [ ] **Step 2: Lighten synopsis card**

Replace the synopsis wrapper class with:

```svelte
<div class="mt-6 max-w-4xl rounded-[1.5rem] border border-white/80 bg-white/82 p-4 shadow-[0_14px_38px_-30px_rgba(139,92,246,0.45)] sm:p-5 md:rounded-[1.7rem]">
```

- [ ] **Step 3: Lighten metadata stat cards**

Replace stat card classes with:

```svelte
<div class="rounded-2xl border border-white/80 bg-white/78 p-3 text-center shadow-[0_10px_28px_-24px_rgba(139,92,246,0.45)] perf-card">
```

- [ ] **Step 4: Keep value hierarchy stronger than labels**

Keep the value visually dominant:

```svelte
<div class="text-2xl font-black text-coral-dark sm:text-3xl">{item.value}</div>
<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-plum-light/65 sm:text-xs">{item.label}</div>
```

---

### Task 4: Reduce cast and gallery mobile density

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte:372-424`

- [ ] **Step 1: Convert cast grid to mobile horizontal reel**

Replace the cast list container with:

```svelte
<div class="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
```

- [ ] **Step 2: Make cast cards mobile-sized and light**

Replace cast card classes with:

```svelte
class="group relative min-w-[16rem] snap-start overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/78 p-3 shadow-[0_12px_32px_-26px_rgba(139,92,246,0.5)] transition-colors duration-200 hover:border-coral/30 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-coral sm:min-w-0 sm:p-4 perf-card"
```

- [ ] **Step 3: Limit gallery candidates on mobile through markup sizes only**

Keep `galleryCandidates` derived data unchanged at `.slice(0, 7)`, but ensure every gallery `Picture` remains lazy and async:

```svelte
<Picture src={image.src} type="posters" sizes={index === 0 ? '(max-width: 768px) 92vw, 640px' : '(max-width: 768px) 46vw, 360px'} alt={image.alt} width={index === 0 ? 640 : 360} height={index === 0 ? 360 : 203} loading="lazy" decoding="async" class="aspect-video h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
```

- [ ] **Step 4: Lighten gallery figure cards**

Replace figure classes with:

```svelte
class="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_12px_34px_-28px_rgba(139,92,246,0.5)] perf-card {index === 0 ? 'col-span-2 sm:col-span-3 sm:row-span-2' : 'sm:col-span-3 lg:col-span-2'}"
```

---

### Task 5: Make schedule collapsed and trailer opt-in

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte:426-545`

- [ ] **Step 1: Lighten schedule container**

Replace the schedule card wrapper with:

```svelte
<div class="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/80 shadow-[0_16px_42px_-30px_rgba(139,92,246,0.5)] md:rounded-[2rem] perf-card">
```

- [ ] **Step 2: Lighten row hover and row spacing**

Replace the row class with:

```svelte
<div class="transition-colors duration-200 {hasEpisodeContent ? 'hover:bg-white/75 cursor-pointer' : ''}"
```

- [ ] **Step 3: Replace direct iframe rendering with opt-in button**

Inside the expanded trailer block, replace the iframe branch with this structure:

```svelte
{#if item.trailerUrl}
	{#if trailerEmbedUrl}
		{#if activatedTrailers.has(item.episode)}
			<div class="overflow-hidden rounded-2xl border border-white/70 bg-plum/90 shadow-[0_18px_44px_-28px_rgba(45,27,46,0.55)]">
				<iframe src={trailerEmbedUrl} title={`Trailer ${item.title}`} class="aspect-video w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
			</div>
		{:else}
			<button type="button" onclick={(event) => activateTrailer(item.episode, event)} class="flex w-full items-center justify-between gap-3 rounded-2xl border border-coral/15 bg-coral/8 px-4 py-3 text-left shadow-[0_10px_28px_-24px_rgba(255,107,157,0.55)] transition-colors hover:bg-coral/12 touch-target">
				<span>
					<span class="block text-xs font-bold uppercase tracking-[0.18em] text-coral-dark">Trailer</span>
					<span class="mt-1 block text-sm font-semibold text-plum">แตะเพื่อโหลดวิดีโอ</span>
				</span>
				<svg class="h-5 w-5 flex-shrink-0 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-5.197-3.03A1 1 0 008 9.002v5.996a1 1 0 001.555.832l5.197-2.966a1 1 0 000-1.696z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			</button>
		{/if}
	{:else}
		<div class="rounded-2xl border border-white/80 bg-white/72 p-4 shadow-[0_10px_28px_-24px_rgba(139,92,246,0.45)]">
			<p class="text-xs font-bold uppercase tracking-[0.22em] text-lavender-dark/75">Trailer</p>
			<p class="mt-1 text-sm text-plum-light">{m.series_trailer_external_notice()}</p>
			<a href={item.trailerUrl} target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-bold text-white shadow-[0_12px_28px_-18px_rgba(255,107,157,0.7)] transition-colors hover:bg-coral-dark touch-target">
				{m.series_trailer_open()}
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
			</a>
		</div>
	{/if}
{/if}
```

- [ ] **Step 4: Ensure opt-in button click does not collapse row**

Confirm `activateTrailer(item.episode, event)` receives the click event and calls `event.stopPropagation()`.

---

### Task 6: Add mobile fixed-background performance rule

**Files:**
- Modify: `src/app.css:159-168`

- [ ] **Step 1: Keep desktop background behavior unchanged**

Do not remove this from `body`:

```css
background-attachment: fixed;
```

- [ ] **Step 2: Override fixed background on mobile**

Add this rule after the `body` block:

```css
@media (max-width: 767px) {
  body {
    background-attachment: scroll;
  }
}
```

---

### Task 7: Verify without test suite

**Files:**
- No code changes.

- [ ] **Step 1: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: command completes successfully. Existing unrelated warnings may remain, but no new errors should be introduced.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: command completes successfully. Existing unrelated warnings may remain, but no build failure should be introduced.

- [ ] **Step 3: Manual review targets**

Review these paths in preview/dev:

```text
/:lang/series/:id
```

Check:

- Poster and title are visible quickly on mobile width.
- Page no longer uses mobile full-screen blurred poster background.
- Favorite, Watched, and Share controls remain usable.
- Schedule rows start collapsed.
- Trailer iframe appears only after tapping the trailer load button.
- Long Thai/English titles wrap cleanly.
- Desktop remains visually acceptable.

---

## Self-Review Notes

- Spec coverage: hero, action strip, synopsis, metadata, cast, gallery, schedule, performance, accessibility, and verification are covered.
- Placeholder scan: no TODO/TBD placeholders are present.
- Type consistency: new state uses `Set<number>` and helper accepts `(ep: number, event: MouseEvent)`, matching episode numbers in the existing schedule loop.
- User requested skipping tests: plan excludes `npm test` and keeps `npm run check` + `npm run build` only.
