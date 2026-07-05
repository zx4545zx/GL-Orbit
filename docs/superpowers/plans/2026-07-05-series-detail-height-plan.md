# Series Detail Hero Height – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `/series/[id]` hero row height determined solely by the left column (poster + actions), with only the synopsis scrolling inside the constrained right column.

**Architecture:** Convert the right column into a CSS Grid item whose wrapper has no intrinsic height (its content is inside an absolutely-positioned inner container). The grid row therefore sizes to the left column only, the right wrapper stretches to that height, and the inner flex column lets the synopsis area absorb any remaining height with `overflow-y-auto`.

**Tech Stack:** Svelte 5, Tailwind CSS 4, TypeScript.

---

### File Map
- `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte` — main series detail page; only file that changes.

---

### Task 1: Remove the JS height-sync code

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

- [ ] **Step 1: Delete the height-sync state variables**

Remove these lines from the script block:

```ts
	let leftColEl: HTMLDivElement | undefined = $state();
	let rightColEl: HTMLDivElement | undefined = $state();
```

- [ ] **Step 2: Delete the height-sync effect**

Remove this entire `$effect` block:

```ts
	$effect(() => {
		if (!leftColEl || !rightColEl) return;

		function syncHeroHeight() {
			if (!leftColEl || !rightColEl) return;
			if (window.innerWidth < 768) {
				rightColEl.style.minHeight = '';
				return;
			}
			rightColEl.style.height = `${leftColEl.clientHeight}px`;
		}

		syncHeroHeight();

		const observer = new ResizeObserver(syncHeroHeight);
		observer.observe(leftColEl);

		window.addEventListener('resize', syncHeroHeight);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', syncHeroHeight);
			if (rightColEl) rightColEl.style.height = '';
		};
	});
```

- [ ] **Step 3: Remove the `bind:this` attributes from the hero columns**

In the template, change:

```svelte
<div bind:this={leftColEl} class="relative mx-auto w-full max-w-[21rem] md:max-w-none">
```

to:

```svelte
<div class="relative mx-auto w-full max-w-[21rem] md:max-w-none">
```

And change:

```svelte
<div bind:this={rightColEl} class="min-w-0 pb-1 md:h-full md:min-h-0 md:flex md:flex-col md:overflow-hidden">
```

to start the right-column refactor (will be finished in Task 2):

```svelte
<div class="relative min-w-0 pb-1 md:overflow-hidden">
```

---

### Task 2: Refactor the right column into an absolute inner container

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

- [ ] **Step 1: Wrap right-column content in an absolute inner shell**

The right column should look like this after editing (replace everything from the opening `<div class="relative min-w-0 pb-1 md:overflow-hidden">` through its closing `</div>`):

```svelte
<div class="relative min-w-0 pb-1 md:overflow-hidden">
	<div class="md:absolute md:inset-0 md:flex md:flex-col md:overflow-hidden">
		<div class="flex-shrink-0">
			<div class="mb-4 flex flex-wrap items-center gap-2">
				{#if s}
					<span class="rounded-full border border-mint/25 bg-mint/18 px-3 py-1.5 text-xs font-bold text-mint-dark sm:text-sm">{s.text}</span>
				{/if}
				<span class="rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-xs font-semibold text-plum-light sm:text-sm">{series.studio}{#if series.year} • {series.year}{/if}</span>
			</div>

			<h1 class="max-w-full break-words font-[family-name:var(--font-display)] text-[clamp(1.9rem,3.6vw,3.65rem)] font-extrabold leading-[1.16] tracking-[-0.025em] text-plum [overflow-wrap:anywhere]">
				{series.titleEn}
			</h1>
			{#if series.titleTh}
				<p class="mt-3 max-w-3xl font-[family-name:var(--font-thai)] text-lg font-semibold text-plum-light sm:text-xl md:text-2xl">{series.titleTh}</p>
			{/if}
		</div>

		{#if description}
			<div class="mt-6 max-w-4xl rounded-[1.5rem] border border-white/80 bg-white/82 p-4 sm:p-5 md:rounded-[1.7rem] md:flex-1 md:min-h-0 md:flex md:flex-col md:overflow-hidden">
				<div class="relative md:flex-1 md:min-h-0 md:overflow-hidden">
					<p
						bind:this={descriptionEl}
						onscroll={handleDescriptionScroll}
						class="font-[family-name:var(--font-thai)] text-sm leading-8 text-plum-light sm:text-base sm:leading-9 md:h-full md:overflow-y-auto"
					>
						{description}
					</p>
					{#if descriptionHasOverflow && !descriptionScrolledToBottom}
						<div class="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/90 to-transparent" aria-hidden="true"></div>
					{/if}
				</div>
			</div>
		{/if}

		<div class="mt-6 grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3 md:flex-shrink-0">
			{#each primaryMeta as item}
				<div class="rounded-2xl border border-white/80 bg-white/78 p-3 text-center perf-card">
					<div class="text-2xl font-black text-coral-dark sm:text-3xl">{item.value}</div>
					<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-plum-light/65 sm:text-xs">{item.label}</div>
				</div>
			{/each}
		</div>

		{#if series.genres.length > 0 || series.platforms.length > 0}
			<div class="mt-5 flex flex-wrap gap-2 md:flex-shrink-0">
				{#each series.genres as genre}
					<span class="rounded-full border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral-dark sm:text-sm">{genre}</span>
				{/each}
				{#each series.platforms as platform}
					<span class="inline-flex max-w-full items-center gap-2 rounded-full border border-lavender/25 bg-white/75 px-3 py-1.5 text-xs font-semibold text-plum-light sm:text-sm">
						{#if platform.logo}
							<img src={platform.logo} alt={platform.name} width={20} height={20} loading="lazy" decoding="async" class="h-5 w-5 shrink-0 rounded-full border border-white/20 object-cover" />
						{/if}
						<span class="truncate">{platform.name}</span>
					</span>
				{/each}
			</div>
		{/if}
	</div>
</div>
```

Key changes:
- Outer right wrapper: `relative min-w-0 pb-1 md:overflow-hidden` (no `md:h-full`, no flex, no intrinsic height driver).
- Inner shell: `md:absolute md:inset-0 md:flex md:flex-col md:overflow-hidden`.
- Header block wraps status/title/Thai title and gets `flex-shrink-0`.
- Meta grid gets `md:flex-shrink-0`.
- Genre/platform chip wrapper gets `md:flex-shrink-0`.
- Synopsis card keeps `md:flex-1 md:min-h-0 md:flex md:flex-col md:overflow-hidden` so it absorbs leftover height and scrolls.

- [ ] **Step 2: Confirm the left column is unchanged**

The left column should remain exactly as it was (poster + action strip). No `bind:this` should remain.

---

### Task 3: Verify the build

**Files:**
- (none; verification only)

- [ ] **Step 1: Run type check**

```bash
npm run check
```

Expected: passes with no new errors (existing warnings are acceptable).

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: completes successfully.

- [ ] **Step 3: Manual visual check (dev server)**

```bash
npm run dev
```

Open a series detail page on a desktop viewport. Confirm:
1. The right column top edge aligns with the poster top edge.
2. The right column bottom edge aligns with the action-strip bottom edge.
3. Long synopsis text scrolls inside the description card only; title, meta, and chips remain fixed.
4. On mobile, the layout returns to the natural stacked flow.

---

### Self-Review

1. **Spec coverage:**
   - Hero height driven by left column only → Task 2 removes intrinsic height from right wrapper.
   - Right column scroll only synopsis → Task 2 wraps header/meta/chips in `flex-shrink-0` and gives synopsis card `flex-1` + `overflow-y-auto`.
   - No JS sync → Task 1 removes all `ResizeObserver`/height-sync code.

2. **Placeholder scan:** No TBD/TODO/fill-in sections; every snippet is exact.

3. **Type consistency:** No new variables or props; removed `leftColEl`/`rightColEl` states. `descriptionEl` and the description-overflow helpers remain untouched.
