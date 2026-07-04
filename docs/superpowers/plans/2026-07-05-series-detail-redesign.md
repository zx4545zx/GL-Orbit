# Series Detail Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the series detail page into a cinematic poster-first experience while keeping the existing DB/query/action contracts unchanged.

**Architecture:** This is a UI-only refactor of `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`. The page keeps current Svelte 5 state/effects, SEO head, favorite/watched/share components, description measurement, trailer parsing, and schedule expand behavior, while adding local derived image candidates and replacing the visible markup with a cinematic hero, cast reel, optional visual gallery, and episode timeline.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind CSS v4, existing GL-Orbit i18n via `$lib/i18n/paraglide.js`, existing `Picture`, `FavoriteButton`, `WatchedButton`, and `ShareButton` components.

## Global Constraints

- UI language remains localized; use existing i18n messages for user-facing labels where available.
- No database migration in this phase.
- No `series.coverUrl` field in this phase.
- No `series_gallery` table in this phase.
- No admin form/API/query changes for gallery management in this phase.
- Preserve existing actions: favorite, watched, share, read-more synopsis, expandable episode rows, trailer embeds, stream links.
- Preserve current `<svelte:head>` SEO behavior: canonical URL, Open Graph image, Twitter image, and JSON-LD generation.
- Mobile-first layout with minimum 44px touch targets.
- Preserve keyboard support for expandable schedule rows and `aria-expanded`.
- Respect existing `prefers-reduced-motion` handling from global CSS.
- Use Svelte 5 runes only; do not use `export let`.
- TypeScript imports must follow the project’s NodeNext convention.

---

## File Structure

- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`
  - Responsibility: local derived image candidates, cinematic hero markup, action placement, synopsis/read-more markup, cast reel, optional visual gallery from current data, and restyled episode schedule timeline.
  - Keep in file because this route is already a page-level composition and the redesign is layout-specific.
- No new files required.
- No backend, schema, API, or admin files change.

---

### Task 1: Add Forward-Compatible Visual Candidates and Replace the Hero

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

**Interfaces:**
- Consumes: existing `series`, `title`, `description`, `s`, `canonicalUrl`, `descriptionEl`, `isDescriptionExpanded`, `showReadMoreButton`, existing imported `Picture`, `FavoriteButton`, `WatchedButton`, `ShareButton`.
- Produces: local derived values used by later tasks:
  - `coverCandidate: string | null`
  - `episodeCoverCandidates: { src: string; alt: string; episode: number; title: string }[]`
  - `galleryCandidates: { src: string; alt: string; episode: number; title: string }[]`
  - `primaryMeta: { label: string; value: string | number | null }[]`

- [ ] **Step 1: Add local derived visual candidates below `const seriesJsonLd = ...`**

Insert this block after the existing `seriesJsonLd` derived block and before `// --- Collapsible schedule state ---`:

```svelte
	const coverCandidate = $derived(series?.poster ?? null);
	const episodeCoverCandidates = $derived(
		series
			? series.schedule
					.filter((item) => Boolean(item.coverUrl))
					.map((item) => ({
						src: item.coverUrl as string,
						alt: m.series_episode_cover_alt({ episode: item.episode }),
						episode: item.episode,
						title: item.title
					}))
			: []
	);
	const galleryCandidates = $derived(episodeCoverCandidates.slice(0, 7));
	const primaryMeta = $derived([
		{ label: m.common_episodes(), value: series?.episodes ?? null },
		{ label: m.common_year(), value: series?.year ?? null },
		{ label: m.common_cast(), value: series?.artists.length ?? null }
	].filter((item) => item.value !== null));
```

- [ ] **Step 2: Run Svelte check to catch type errors early**

Run:

```bash
npm run check
```

Expected: if the only change is the derived block, the command should either pass or report precise TypeScript/Svelte issues in `+page.svelte`. Fix only issues caused by the new block before continuing.

- [ ] **Step 3: Replace the existing hero block with cinematic poster-first markup**

In `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`, replace the current `{:else}` top wrapper through the end of the `<!-- Hero -->` block. Keep the later `<!-- Artists -->` and `<!-- Schedule with collapsible rows -->` sections for now. The new top wrapper must start like this:

```svelte
{:else}
	<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[#08070b] pb-[calc(2rem+var(--bottom-nav-reserved-space))] text-white md:mb-0 md:-mt-24 md:pb-12 md:pt-24">
		{#if coverCandidate}
			<div class="absolute inset-x-0 top-0 h-[42rem] overflow-hidden opacity-70">
				<Picture src={coverCandidate} type="posters" sizes="100vw" alt="" width={1080} height={1620} loading="eager" fetchpriority="high" class="h-full w-full scale-110 object-cover blur-2xl" />
				<div class="absolute inset-0 bg-gradient-to-b from-plum/65 via-[#08070b]/82 to-[#08070b]"></div>
				<div class="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,107,157,0.32),transparent_34%),radial-gradient(circle_at_74%_28%,rgba(196,181,253,0.24),transparent_38%),linear-gradient(90deg,rgba(8,7,11,0.92),rgba(8,7,11,0.42),rgba(8,7,11,0.9))]"></div>
			</div>
		{/if}
		<div class="pointer-events-none absolute inset-0 noise-overlay opacity-80"></div>
		<div class="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-coral/20 blur-3xl motion-safe:animate-float"></div>
		<div class="pointer-events-none absolute bottom-24 right-0 h-80 w-80 rounded-full bg-mint/10 blur-3xl motion-safe:animate-float-delayed"></div>

		<div class="relative mx-auto max-w-7xl px-4 pt-5 sm:pt-8 md:px-6">
			<button onclick={() => history.back()} class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white/80 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:-translate-x-1 hover:border-coral/40 hover:bg-white/15 hover:text-white sm:mb-8 sm:text-base touch-target">
				<svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
				<span>{m.common_back()}</span>
			</button>

			<section class="relative z-10 grid gap-6 pb-10 md:grid-cols-[minmax(18rem,0.84fr)_minmax(0,1.35fr)] md:items-end md:gap-10 lg:gap-14">
				<div class="relative mx-auto w-full max-w-[22rem] md:max-w-none">
					<div class="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-coral/45 via-lavender/25 to-mint/15 blur-2xl"></div>
					<div class="group relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl shadow-black/45 backdrop-blur-2xl md:rounded-[2.4rem]">
						<Picture src={series.poster} type="posters" sizes="(max-width: 768px) 88vw, 430px" alt={series.titleEn} width={480} height={720} loading="eager" fetchpriority="high" class="aspect-[2/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
						<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5"></div>
						<div class="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
							<span class="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur-xl">GL-Orbit</span>
							{#if s}
								<span class="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-xl">{s.text}</span>
							{/if}
						</div>
					</div>

					<div class="relative z-20 -mt-5 rounded-[1.75rem] border border-white/15 bg-black/35 p-2.5 shadow-2xl shadow-black/30 backdrop-blur-2xl">
						<div class="grid grid-cols-2 gap-2">
							<FavoriteButton seriesId={series.id} className="w-full justify-start bg-white/90 text-plum" />
							<WatchedButton seriesId={series.id} className="w-full justify-start bg-white/90 text-plum" />
							<div class="col-span-2">
								<ShareButton
									title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''}`}
									text={m.series_share_text({ title })}
									url={canonicalUrl}
									ariaLabel={m.series_share_aria_label()}
									variant="command"
									className="w-full justify-start bg-white/90 text-plum"
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="min-w-0 pb-1 md:pb-8">
					<div class="mb-4 flex flex-wrap items-center gap-2">
						{#if s}
							<span class="rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-black/20 backdrop-blur-xl sm:text-sm">{s.text}</span>
						{/if}
						<span class="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/75 backdrop-blur-xl sm:text-sm">{series.studio}{#if series.year} • {series.year}{/if}</span>
					</div>

					<h1 class="font-[family-name:var(--font-display)] text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.92] tracking-[-0.07em] text-white drop-shadow-2xl">
						{series.titleEn}
					</h1>
					{#if series.titleTh}
						<p class="mt-4 max-w-3xl font-[family-name:var(--font-thai)] text-xl font-semibold text-white/82 sm:text-2xl md:text-3xl">{series.titleTh}</p>
					{/if}

					{#if description}
						<div class="mt-6 max-w-4xl rounded-[1.7rem] border border-white/12 bg-white/[0.08] p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-5">
							<p
								bind:this={descriptionEl}
								class="font-[family-name:var(--font-thai)] text-sm leading-8 text-white/76 sm:text-base sm:leading-9 {isDescriptionExpanded ? '' : 'line-clamp-2'} motion-safe:transition-all motion-safe:duration-300 ease-out"
							>
								{description}
							</p>
							{#if showReadMoreButton}
								<button type="button" onclick={() => (isDescriptionExpanded = !isDescriptionExpanded)} class="mt-3 inline-flex items-center gap-1 rounded-full bg-coral/15 px-3 py-1.5 text-sm font-bold text-coral-light transition-colors hover:bg-coral/25 hover:text-white touch-target">
									{isDescriptionExpanded ? m.series_description_collapse() : m.series_description_read_more()}
								</button>
							{/if}
						</div>
					{/if}

					<div class="mt-6 grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3">
						{#each primaryMeta as item}
							<div class="rounded-2xl border border-white/12 bg-white/[0.08] p-3 text-center shadow-lg shadow-black/10 backdrop-blur-xl">
								<div class="text-2xl font-black text-white sm:text-3xl">{item.value}</div>
								<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 sm:text-xs">{item.label}</div>
							</div>
						{/each}
					</div>

					{#if series.genres.length > 0 || series.platforms.length > 0}
						<div class="mt-5 flex flex-wrap gap-2">
							{#each series.genres as genre}
								<span class="rounded-full border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral-light shadow-lg shadow-coral/10 sm:text-sm">{genre}</span>
							{/each}
							{#each series.platforms as platform}
								<span class="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-xl sm:text-sm">
									{#if platform.logo}
										<img src={platform.logo} alt={platform.name} width={20} height={20} loading="lazy" decoding="async" class="h-5 w-5 shrink-0 rounded-full border border-white/20 object-cover" />
									{/if}
									<span class="truncate">{platform.name}</span>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</section>
```

The page must still close with the existing two `</div>` wrappers near the end of the file. Do not remove the existing Artists and Schedule sections in this task.

- [ ] **Step 4: Run check and fix Svelte structure issues**

Run:

```bash
npm run check
```

Expected: PASS. If it fails with mismatched blocks/tags, fix the `{:else}` wrapper boundaries before continuing.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add 'src/routes/[lang=lang]/(app)/series/[id]/+page.svelte'
git commit -m "feat: redesign series hero"
```

Expected: commit succeeds.

---

### Task 2: Restyle Cast Reel and Add Optional Scene Gallery

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

**Interfaces:**
- Consumes: `galleryCandidates`, `series.artists`, `Picture`, `m.common_cast()`, `m.common_people()`.
- Produces: cast section and optional gallery section styled for the dark cinematic page.

- [ ] **Step 1: Replace the current Artists section with a dark cast reel**

Replace the whole `<!-- Artists -->` section with:

```svelte
		<!-- Artists -->
		{#if series.artists.length > 0}
			<section class="relative z-10 mb-10 sm:mb-12">
				<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
					<div>
						<p class="text-[10px] font-bold uppercase tracking-[0.28em] text-coral-light/70">Cast constellation</p>
						<h2 class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white sm:text-4xl">{m.common_cast()}</h2>
					</div>
					<span class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/65 shadow-lg shadow-black/10 backdrop-blur-xl">{series.artists.length} {m.common_people()}</span>
				</div>

				<div class="flex snap-x gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
					{#each series.artists as artist}
						<a
							href={`/artists/${artist.id}`}
							class="group relative min-w-[16rem] snap-start overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/[0.07] p-3 shadow-xl shadow-black/15 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-coral/30 hover:bg-white/[0.11] focus-visible:outline-2 focus-visible:outline-coral sm:min-w-0 sm:p-4"
						>
							<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,107,157,0.2),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
							<div class="relative flex items-center gap-3 sm:gap-4">
								<Picture src={artist.image} type="profiles" sizes="96px" alt={artist.name} width={64} height={64} loading="lazy" class="h-14 w-14 flex-shrink-0 rounded-2xl border border-white/20 object-cover shadow-lg shadow-black/20 transition-transform duration-300 group-hover:rotate-[-2deg] group-hover:scale-105 sm:h-16 sm:w-16" />
								<div class="min-w-0">
									<div class="truncate text-sm font-extrabold text-white sm:text-base">{artist.name}</div>
									<div class="mt-1 text-xs font-medium text-white/58 sm:text-sm">{artist.role}</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
```

- [ ] **Step 2: Insert optional Scene Gallery after Artists and before Schedule**

Add this block immediately after the Artists section and before `<!-- Schedule with collapsible rows -->`:

```svelte
		<!-- Scene gallery: forward-compatible with future series.gallery; currently derived from episode covers when available. -->
		{#if galleryCandidates.length >= 3}
			<section class="relative z-10 mb-10 sm:mb-12">
				<div class="mb-4 text-center sm:mb-6">
					<p class="text-[10px] font-bold uppercase tracking-[0.34em] text-mint-light/65">Scene reel</p>
					<h2 class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white sm:text-4xl">Gallery</h2>
				</div>

				<div class="grid grid-cols-2 gap-2 sm:grid-cols-6 sm:gap-3">
					{#each galleryCandidates as image, index}
						<figure class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl shadow-black/20 {index === 0 ? 'col-span-2 sm:col-span-3 sm:row-span-2' : 'sm:col-span-3 lg:col-span-2'}">
							<Picture src={image.src} type="posters" sizes={index === 0 ? '(max-width: 768px) 100vw, 640px' : '(max-width: 768px) 50vw, 360px'} alt={image.alt} width={index === 0 ? 640 : 360} height={index === 0 ? 360 : 203} loading="lazy" class="aspect-video h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
							<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-75"></div>
							<figcaption class="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/78 sm:bottom-3 sm:left-3 sm:right-3">
								<span>EP {image.episode}</span>
								<span class="truncate text-right normal-case tracking-normal">{image.title}</span>
							</figcaption>
						</figure>
					{/each}
				</div>
			</section>
		{/if}
```

- [ ] **Step 3: Run check**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 4: Commit Task 2**

Run:

```bash
git add 'src/routes/[lang=lang]/(app)/series/[id]/+page.svelte'
git commit -m "feat: add cinematic cast and scene reel"
```

Expected: commit succeeds.

---

### Task 3: Restyle Episode Schedule as a Cinematic Timeline

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

**Interfaces:**
- Consumes: existing `series.schedule`, `expandedEpisodes`, `toggleAll`, `toggleEpisode`, `scheduleSummary`, `firstAirDate`, `isToday`, `hasUncut`, `youtubeEmbedUrl`, `m.common_schedule()`, `m.common_expand_all()`, `m.common_collapse_all()`, `m.common_today()`, `m.series_trailer_external_notice()`.
- Produces: same accessible schedule functionality with cinematic styling.

- [ ] **Step 1: Replace the schedule section header and container classes**

Within the `<!-- Schedule with collapsible rows -->` section, change the section opening/header/container to this structure while preserving the existing `{#each series.schedule as item}` loop body for the next step:

```svelte
		<!-- Schedule with collapsible rows -->
		{#if series.schedule.length > 0}
			<section class="relative z-10">
				<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
					<div>
						<p class="text-[10px] font-bold uppercase tracking-[0.28em] text-lavender-light/70">Episode orbit</p>
						<h2 class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white sm:text-4xl">{m.common_schedule()}</h2>
					</div>
					<button onclick={toggleAll} class="inline-flex items-center gap-1 rounded-full border border-coral/30 bg-coral/10 py-1 pl-2 pr-3 text-xs font-bold text-coral-light shadow-lg shadow-coral/10 transition-all duration-200 hover:border-coral/50 hover:bg-coral/20 active:scale-95 touch-target whitespace-nowrap" aria-label={allExpanded ? m.common_collapse_all() : m.common_expand_all()}>
						{#if allExpanded}
							<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 15 12 7 20 15"/><line x1="4" y1="19" x2="20" y2="19"/></svg>
							<span>{m.common_collapse_all()}</span>
						{:else}
							<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 9 12 17 20 9"/><line x1="4" y1="5" x2="20" y2="5"/></svg>
							<span>{m.common_expand_all()}</span>
						{/if}
					</button>
				</div>
				<div class="overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.07] shadow-2xl shadow-black/20 backdrop-blur-2xl">
					<div class="divide-y divide-white/10">
```

- [ ] **Step 2: Replace each episode row body**

Inside the existing `{#each series.schedule as item}` block, keep the `{@const ...}` declarations and replace the interactive `<div class="transition-all..."> ... </div>` body with:

```svelte
							<div class="transition-all duration-300 {hasEpisodeContent ? 'hover:bg-white/[0.08] cursor-pointer' : ''}"
								role="button"
								tabindex={hasEpisodeContent ? 0 : undefined}
								onclick={hasEpisodeContent ? () => toggleEpisode(item.episode) : undefined}
								onkeydown={hasEpisodeContent ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEpisode(item.episode); } } : undefined}
								aria-expanded={hasEpisodeContent ? expandedEpisodes.has(item.episode) : undefined}
							>
								<div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
									<div class="flex min-w-0 items-center gap-3 sm:gap-4">
										{#if item.coverUrl}
											<div class="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-white/12 bg-white/10 shadow-lg shadow-black/20 sm:h-16 sm:w-28">
												<Picture src={item.coverUrl} type="posters" sizes="(max-width: 768px) 40vw, 220px" alt={m.series_episode_cover_alt({ episode: item.episode })} width={220} height={124} loading="lazy" class="h-full w-full object-cover" />
												<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
													<span class="text-[10px] font-black text-white">EP {item.episode}</span>
												</div>
											</div>
										{:else}
											<div class="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl border border-white/12 bg-white/10 shadow-lg shadow-black/10 sm:h-14 sm:w-14">
												<span class="text-sm font-black text-coral-light">{item.episode}</span>
											</div>
										{/if}
										<div class="min-w-0">
											<div class="truncate text-sm font-extrabold text-white sm:text-base">{item.title}</div>
											<div class="mt-1 truncate text-xs font-medium text-white/55 sm:text-sm">{scheduleSummary(item)}</div>
										</div>
									</div>
									<div class="flex flex-shrink-0 items-center gap-2 sm:gap-3">
										{#if isToday(item.schedules)}
											<span class="rounded-full border border-coral/30 bg-coral/15 px-2 py-0.5 text-[10px] font-bold text-coral-light whitespace-nowrap">{m.common_today()}</span>
										{/if}
										{#if hasUncut(item.schedules)}
											<span class="hidden rounded-full border border-amber-300/30 bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold text-amber-100 sm:inline-flex">Uncut</span>
										{/if}
										<span class="text-xs font-semibold text-white/65 sm:text-sm whitespace-nowrap">{firstAirDate(item)}</span>
										{#if hasEpisodeContent}
											<svg class="h-4 w-4 text-white/55 transition-transform duration-200 sm:h-5 sm:w-5 {expandedEpisodes.has(item.episode) ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
											</svg>
										{/if}
									</div>
								</div>

								{#if hasEpisodeContent && expandedEpisodes.has(item.episode)}
									<div class="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5 animate-fade-in">
										{#if item.trailerUrl}
											{#if trailerEmbedUrl}
												<div class="overflow-hidden rounded-2xl border border-white/12 bg-black/40 shadow-xl shadow-black/20">
													<iframe src={trailerEmbedUrl} title={`Trailer ${item.title}`} class="aspect-video w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
												</div>
											{:else}
												<div class="rounded-2xl border border-white/12 bg-white/[0.08] p-4 shadow-lg shadow-black/10">
													<p class="text-xs font-bold uppercase tracking-[0.22em] text-lavender-light/75">Trailer</p>
													<p class="mt-1 text-sm text-white/65">{m.series_trailer_external_notice()}</p>
													<a href={item.trailerUrl} target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-bold text-white shadow-lg shadow-coral/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-coral-dark touch-target">
														เปิด Trailer
														<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
													</a>
												</div>
											{/if}
										{/if}

										{#each item.schedules as sch}
											{@const hasStreamLink = sch.streamLink && sch.streamLink.length > 0}
											<div class="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-2 sm:px-4">
												<div class="flex min-w-0 items-center gap-2 sm:gap-3">
													{#if sch.platformLogo}
														<img src={sch.platformLogo} alt={sch.platform} width={28} height={28} loading="lazy" decoding="async" class="h-6 w-6 flex-shrink-0 rounded-full border border-white/20 object-cover sm:h-7 sm:w-7" />
													{:else}
														<div class="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 sm:h-7 sm:w-7"><span class="text-[10px] font-bold text-lavender-light">{sch.platform.charAt(0)}</span></div>
													{/if}
													<div class="min-w-0">
														<div class="flex items-center gap-1.5">
															<span class="truncate text-sm font-semibold text-white sm:text-base">{sch.platform}</span>
															{#if sch.isUncut}
																<span class="flex-shrink-0 rounded-md border border-amber-200/25 bg-amber-200/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-100">Uncut</span>
															{/if}
														</div>
														<div class="text-xs text-white/50">{sch.airDate}</div>
													</div>
												</div>
												{#if hasStreamLink}
													<a href={sch.streamLink} target="_blank" rel="noopener noreferrer" class="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-coral to-coral-dark px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-coral/20 transition-all duration-200 hover:from-coral-dark hover:to-coral touch-target sm:text-sm">
														ดูเลย
														<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
													</a>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
```

- [ ] **Step 3: Run check and unit tests**

Run:

```bash
npm run check
npm test
```

Expected: both commands PASS.

- [ ] **Step 4: Commit Task 3**

Run:

```bash
git add 'src/routes/[lang=lang]/(app)/series/[id]/+page.svelte'
git commit -m "feat: restyle series episode timeline"
```

Expected: commit succeeds.

---

### Task 4: Manual Visual QA and Final Polish

**Files:**
- Modify if needed: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

**Interfaces:**
- Consumes: completed page from Tasks 1-3.
- Produces: final verified page and clean branch state.

- [ ] **Step 1: Start local dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite starts and prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 2: Manually inspect a series detail page**

Open an existing route matching the app language prefix, for example:

```text
http://127.0.0.1:5173/th/series/<existing-series-id>
```

Expected:

- Hero background is dark and cinematic, not washed out.
- Poster remains crisp and not over-blurred.
- Title remains readable on desktop and mobile widths.
- Action buttons are visible and clickable.
- Synopsis read-more expands and collapses.
- Cast reel scrolls horizontally on small screens and grids on desktop.
- Scene gallery appears only if at least 3 episode covers exist.
- Schedule rows expand by click and keyboard.
- Trailer embeds and external trailer links still work.
- Mobile bottom navigation does not cover the final schedule content.

- [ ] **Step 3: Apply targeted polish if manual QA finds issues**

If text contrast is low, adjust only opacity classes on the affected text or panel. Use these concrete replacements as the first choices:

```diff
- text-white/55
+ text-white/65

- bg-white/[0.07]
+ bg-white/[0.1]

- border-white/10
+ border-white/15
```

If the title is too large on mobile, adjust the hero title class from:

```svelte
text-[clamp(3rem,8vw,7.5rem)]
```

to:

```svelte
text-[clamp(2.55rem,7vw,7rem)]
```

- [ ] **Step 4: Run final verification**

Run:

```bash
npm run check
npm test
git status --short
```

Expected:

- `npm run check` passes.
- `npm test` passes.
- `git status --short` shows no uncommitted changes after the final commit.

- [ ] **Step 5: Commit final polish if any files changed**

If `git status --short` shows modified files, run:

```bash
git add 'src/routes/[lang=lang]/(app)/series/[id]/+page.svelte'
git commit -m "polish: tune series detail cinematic layout"
```

Expected: commit succeeds. If there are no modified files, skip this commit.

---

## Self-Review

- Spec coverage: The plan covers UI-only redesign, no schema/API/admin changes, future cover/gallery compatibility through local derived values, current actions, synopsis read-more, cast, optional gallery, schedule timeline, SEO preservation, accessibility, and verification.
- Placeholder scan: The plan contains no placeholders or incomplete requirements.
- Type consistency: `coverCandidate`, `episodeCoverCandidates`, `galleryCandidates`, and `primaryMeta` are introduced in Task 1 and consumed by later tasks with matching names.
