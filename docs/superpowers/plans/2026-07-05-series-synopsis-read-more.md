# Series Synopsis Read-More Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-more toggle to the series synopsis on the public Series Detail page, collapsing long descriptions on mobile and desktop.

**Architecture:** Keep the change inline inside the existing Series Detail page. Use CSS line-clamp for the visual collapse, a `ResizeObserver` to detect real overflow, and Svelte 5 runes for state. The toggle appears only when the text overflows, and remains available while expanded so the user can collapse again.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4.

## Global Constraints
- Use Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`); no `export let`.
- TypeScript `strict: true`, `module: NodeNext` — imports need `.js` extension.
- UI text is Thai.
- Respect `prefers-reduced-motion`.
- No schema/API changes.
- Depends on the bilingual description work populating `data.description`; verify by testing on a series with a long Thai description.

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte` | Add overflow detection, clamp CSS, and toggle button. |

---

### Task 1: Add read-more toggle to Series Detail

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

**Interfaces:**
- Consumes: `data.description` string (populated by `src/lib/server/queries/series-detail.ts`; Thai with English fallback).
- Produces: No new exports; only UI behavior changes.

- [ ] **Step 1: Add state variables**

Add near the top of the script block, after the existing `let { data } = $props();` or alongside other state declarations:

```ts
// --- Read-more state ---
let isDescriptionExpanded = $state(false);
let descriptionHasOverflow = $state(false);
let descriptionEl: HTMLParagraphElement | undefined = $state();
const showReadMoreButton = $derived(descriptionHasOverflow || isDescriptionExpanded);
```

- [ ] **Step 2: Add overflow measurement function**

Add a helper function in the script block:

```ts
function measureDescriptionOverflow() {
	if (!descriptionEl) {
		descriptionHasOverflow = false;
		return;
	}
	descriptionHasOverflow = descriptionEl.scrollHeight > descriptionEl.clientHeight;
}
```

- [ ] **Step 3: Wire up ResizeObserver in an effect**

Add an effect that observes the description paragraph and re-measures when it resizes or when the element first mounts:

```ts
$effect(() => {
	if (!descriptionEl) return;

	// Initial measurement
	measureDescriptionOverflow();

	const observer = new ResizeObserver(() => {
		if (!isDescriptionExpanded) {
			measureDescriptionOverflow();
		}
	});
	observer.observe(descriptionEl);

	return () => {
		observer.disconnect();
	};
});
```

- [ ] **Step 4: Replace the description paragraph markup**

Replace the existing description block:

```svelte
{#if description}
	<p class="relative rounded-2xl border border-white/60 bg-white/45 p-4 text-sm leading-relaxed text-plum-light shadow-sm shadow-lavender/5 sm:text-base">{description}</p>
{/if}
```

With the new collapsible block:

```svelte
{#if description}
	<div class="relative rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm shadow-lavender/5">
		<p
			bind:this={descriptionEl}
			class="text-sm leading-relaxed text-plum-light sm:text-base {isDescriptionExpanded ? '' : 'line-clamp-4 sm:line-clamp-6'} motion-safe:transition-all motion-safe:duration-300 ease-out"
		>
			{description}
		</p>
		{#if showReadMoreButton}
			<button
				type="button"
				onclick={() => (isDescriptionExpanded = !isDescriptionExpanded)}
				class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-coral-dark transition-colors hover:text-coral touch-target"
			>
				{isDescriptionExpanded ? 'ย่อ' : '...ดูเพิ่มเติม'}
			</button>
		{/if}
	</div>
{/if}
```

- [ ] **Step 5: Verify type-check**

Run:
```bash
npm run check
```

Expected: No TypeScript or Svelte errors.

- [ ] **Step 6: Manual verification**

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open a series with a short description (or no description).
   - Expected: No read-more button is shown.

3. Open a series with a long Thai description (after the bilingual description work is complete).
   - Expected: On mobile, the description is truncated to 4 lines; on desktop (`sm` and up), it is truncated to 6 lines.
   - Expected: The `...ดูเพิ่มเติม` button appears.
   - Click the button: text expands smoothly, button label changes to `ย่อ`.
   - Click again: text returns to the clamped state.

4. Resize the browser between mobile and desktop widths.
   - Expected: Button visibility updates based on real overflow when collapsed.

5. Run the production build:
   ```bash
   npm run build
   ```
   Expected: Build completes without errors.

- [ ] **Step 7: Commit**

```bash
git add src/routes/[lang=lang]/(app)/series/[id]/+page.svelte
git commit -m "feat: add read-more toggle to series synopsis"
```

---

## Spec Coverage

| Spec Requirement | Task |
|------------------|------|
| Modify only Series Detail page | Task 1 |
| Mobile threshold 4 lines / Desktop 6 lines | Task 1, Step 4 |
| CSS line-clamp + ResizeObserver | Task 1, Steps 2–3 |
| Button only on real overflow | Task 1, Steps 2–3 |
| Toggle labels `...ดูเพิ่มเติม` / `ย่อ` | Task 1, Step 4 |
| Smooth transition | Task 1, Step 4 |
| Respect `prefers-reduced-motion` | Task 1, Step 4 |
| Touch target ≥ 44×44 px | Task 1, Step 4 (`touch-target`) |

## Self-Review

- **Placeholder scan:** No TBD, TODO, or incomplete sections; all code blocks are complete.
- **Type consistency:** Variables, refs, and helper names match Svelte 5 patterns and the existing page.
- **Dependency noted:** Plan assumes `data.description` is populated by the bilingual description work. If not yet implemented, the read-more button will not appear during testing.
- **Scope check:** This plan only touches one file and does not change schema/APIs.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-05-series-synopsis-read-more.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using `superpowers:executing-plans` with checkpoints.

Which approach would you like to use?
