# Series Detail Mobile Performance Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate scroll jank and slow content rendering on the series detail page for PWA/mobile users while preserving the desktop glass/pastel visual identity.

**Architecture:** Add mobile-first CSS performance utilities in `app.css` and apply them conditionally in the series detail page. Reduce GPU-heavy effects (`backdrop-blur`, `noise-overlay`, large `blur-*` orbs, heavy shadows) on narrow viewports, keep desktop experience unchanged, and add `content-visibility` / `contain` hints for off-screen sections.

**Tech Stack:** SvelteKit 2.x, Svelte 5, Tailwind CSS 4.x, custom CSS in `src/app.css`

## Global Constraints

- Mobile-first: optimize for `< 768px`; keep desktop visuals as close to current as possible.
- Preserve existing actions: favorite, watched, share, expandable episodes, trailer embeds, stream links.
- Preserve SEO: canonical URL, Open Graph, Twitter card, JSON-LD.
- Minimum 44px touch targets must remain.
- Keep keyboard support and `aria-expanded` behavior.
- Respect `prefers-reduced-motion`.
- Use Svelte 5 runes only; TypeScript NodeNext import convention.
- Use existing i18n messages (`m.*`) for all user-facing copy; no hard-coded strings.
- Stay within GL-Orbit pastel theme.

---

## File Structure

- **Modify:** `src/app.css` — add mobile performance utilities (`mobile-glass`, `mobile-no-blur`, `perf-section`, `perf-card`, `gpu-layer`).
- **Modify:** `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte` — apply the utilities to the hero section, poster card, cast/schedule/gallery sections, decorative orbs, and noise overlay.
- **No new files created.**

---

### Task 1: Add Mobile Performance CSS Utilities

**Files:**
- Modify: `src/app.css` (append near the end, after existing utilities)

**Interfaces:**
- Produces: CSS classes `.mobile-glass`, `.mobile-no-blur`, `.perf-section`, `.perf-card`, `.gpu-layer`, `.mobile-shadow`, `.reduced-motion-orb`

- [ ] **Step 1: Append performance utilities to `src/app.css`**

Add this block at the end of `src/app.css`:

```css
/* --- Mobile scroll/perf utilities --- */

/* Glass card that is cheaper on mobile: no backdrop-blur, stronger solid opacity */
@media (max-width: 767px) {
  .mobile-glass {
    background: rgba(255, 255, 255, 0.78);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-color: rgba(255, 255, 255, 0.8);
  }

  .mobile-no-blur {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .mobile-shadow {
    box-shadow:
      0 4px 6px -1px rgba(196, 181, 253, 0.08),
      0 2px 4px -2px rgba(196, 181, 253, 0.06);
  }

  .mobile-shadow-lg {
    box-shadow:
      0 10px 15px -3px rgba(196, 181, 253, 0.1),
      0 4px 6px -4px rgba(196, 181, 253, 0.08);
  }
}

@media (min-width: 768px) {
  .mobile-glass {
    /* keep original behavior on desktop */
  }
}

/* Hint browser to isolate heavy layers */
.gpu-layer {
  will-change: transform;
  transform: translateZ(0);
}

/* Reduce motion for decorative orbs automatically */
@media (prefers-reduced-motion: reduce) {
  .reduced-motion-orb {
    animation: none !important;
  }
}

/* Section-level paint containment for off-screen content */
.perf-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}

/* Card-level layout containment to limit repaint */
.perf-card {
  contain: layout paint;
}
```

- [ ] **Step 2: Verify the file still compiles**

Run:

```bash
npm run check
```

Expected: `svelte-check found 0 errors and 29 warnings in 11 files` (warnings are pre-existing).

- [ ] **Step 3: Commit**

```bash
git add src/app.css
git commit -m "perf: add mobile scroll/perf utilities"
```

---

### Task 2: Make the Hero Section and Noise Overlay Cheaper on Mobile

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

**Interfaces:**
- Consumes: `.mobile-no-blur`, `.reduced-motion-orb`, `.gpu-layer` from Task 1

- [ ] **Step 1: Locate the hero noise overlay and decorative orbs**

Find these lines (around line 277-279):

```svelte
<div class="pointer-events-none absolute inset-0 noise-overlay opacity-80"></div>
<div class="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-coral/25 blur-3xl motion-safe:animate-float"></div>
<div class="pointer-events-none absolute bottom-24 right-0 h-80 w-80 rounded-full bg-mint/20 blur-3xl motion-safe:animate-float-delayed"></div>
```

- [ ] **Step 2: Reduce noise on mobile and promote orbs to GPU layers**

Replace with:

```svelte
<div class="pointer-events-none absolute inset-0 noise-overlay opacity-80 md:opacity-80 opacity-40"></div>
<div class="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-coral/25 blur-3xl motion-safe:animate-float gpu-layer reduced-motion-orb md:h-72 md:w-72 h-48 w-48 md:blur-3xl blur-2xl md:opacity-100 opacity-60"></div>
<div class="pointer-events-none absolute bottom-24 right-0 h-80 w-80 rounded-full bg-mint/20 blur-3xl motion-safe:animate-float-delayed gpu-layer reduced-motion-orb md:h-80 md:w-80 h-52 w-52 md:blur-3xl blur-2xl md:opacity-100 opacity-50"></div>
```

This keeps the desktop look but makes the orbs smaller, less blurred, and less opaque on mobile.

- [ ] **Step 3: Verify with check**

Run:

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/[lang=lang]/(app)/series/[id]/+page.svelte
git commit -m "perf: reduce hero noise and blur orbs on mobile"
```

---

### Task 3: Apply Cheaper Glass Styles to Poster and Action Cards on Mobile

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

**Interfaces:**
- Consumes: `.mobile-glass`, `.mobile-shadow`, `.perf-card`, `.gpu-layer` from Task 1

- [ ] **Step 1: Find the poster card container**

Locate (around line 290):

```svelte
<div class="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/35 shadow-2xl shadow-lavender/25 backdrop-blur-2xl md:rounded-[2.4rem]">
```

- [ ] **Step 2: Replace with mobile-glass**

Replace with:

```svelte
<div class="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/35 shadow-2xl shadow-lavender/25 backdrop-blur-2xl md:rounded-[2.4rem] mobile-glass mobile-shadow-lg perf-card gpu-layer">
```

- [ ] **Step 3: Find the action button card**

Locate (around line 296):

```svelte
<div class="relative z-20 -mt-5 rounded-[1.75rem] border border-white/70 bg-white/65 p-2.5 shadow-2xl shadow-lavender/20 backdrop-blur-2xl">
```

- [ ] **Step 4: Replace with mobile-glass**

Replace with:

```svelte
<div class="relative z-20 -mt-5 rounded-[1.75rem] border border-white/70 bg-white/65 p-2.5 shadow-2xl shadow-lavender/20 backdrop-blur-2xl mobile-glass mobile-shadow perf-card">
```

- [ ] **Step 5: Verify with check**

Run:

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/routes/[lang=lang]/(app)/series/[id]/+page.svelte
git commit -m "perf: use cheaper glass on poster and action cards for mobile"
```

---

### Task 4: Apply Performance Hints to Off-Screen Sections

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

**Interfaces:**
- Consumes: `.perf-section`, `.perf-card` from Task 1

- [ ] **Step 1: Find the metadata section**

Locate the section containing the title/studio/status badge (around line 300):

```svelte
<section class="relative z-10 grid gap-6 pb-10 md:grid-cols-[minmax(18rem,0.84fr)_minmax(0,1.35fr)] md:items-end md:gap-10 lg:gap-14">
```

- [ ] **Step 2: Add perf-section to large below-fold blocks**

Add `perf-section` to these section tags:

1. Hero metadata section:

```svelte
<section class="relative z-10 grid gap-6 pb-10 md:grid-cols-[minmax(18rem,0.84fr)_minmax(0,1.35fr)] md:items-end md:gap-10 lg:gap-14">
```

**Do not add** `perf-section` here because it is above the fold.

2. Cast section (find `<section>` containing cast grid):

```svelte
<section class="relative z-10 mb-10 sm:mb-12 perf-section">
```

3. Scene gallery section:

```svelte
<section class="relative z-10 mb-10 sm:mb-12 perf-section">
```

4. Schedule section:

```svelte
<section class="relative z-10 perf-section">
```

- [ ] **Step 3: Add perf-card to heavy inner cards**

Locate the description card (around line 330):

```svelte
<div class="mt-6 max-w-4xl rounded-[1.7rem] border border-white/70 bg-white/70 p-4 shadow-2xl shadow-lavender/15 backdrop-blur-2xl sm:p-5">
```

Replace with:

```svelte
<div class="mt-6 max-w-4xl rounded-[1.7rem] border border-white/70 bg-white/70 p-4 shadow-2xl shadow-lavender/15 backdrop-blur-2xl sm:p-5 mobile-glass mobile-shadow perf-card">
```

Locate the platform card (around line 347):

```svelte
<div class="rounded-2xl border border-white/70 bg-white/65 p-3 text-center shadow-lg shadow-lavender/10 backdrop-blur-xl">
```

Replace with:

```svelte
<div class="rounded-2xl border border-white/70 bg-white/65 p-3 text-center shadow-lg shadow-lavender/10 backdrop-blur-xl mobile-glass mobile-shadow perf-card">
```

Locate the schedule container (around line 444):

```svelte
<div class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-2xl shadow-lavender/15 backdrop-blur-2xl">
```

Replace with:

```svelte
<div class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-2xl shadow-lavender/15 backdrop-blur-2xl mobile-glass mobile-shadow-lg perf-card">
```

- [ ] **Step 4: Verify with check and tests**

Run:

```bash
npm run check
npm test
```

Expected:
- `svelte-check found 0 errors`
- `Test Files 37 passed (37), Tests 211 passed (211)`

- [ ] **Step 5: Commit**

```bash
git add src/routes/[lang=lang]/(app)/series/[id]/+page.svelte
git commit -m "perf: add content-visibility and containment to detail sections"
```

---

### Task 5: Optimize Gallery Image Decoding and Sizes

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`

**Interfaces:**
- Consumes: existing `Picture` component

- [ ] **Step 1: Find the gallery Picture usage**

Locate the gallery `<Picture>` (around line 420):

```svelte
<Picture src={image.src} type="posters" sizes={index === 0 ? '(max-width: 768px) 100vw, 640px' : '(max-width: 768px) 50vw, 360px'} alt={image.alt} width={index === 0 ? 640 : 360} height={index === 0 ? 360 : 203} loading="lazy" class="aspect-video h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
```

- [ ] **Step 2: Add decoding and contain paint on figure**

Replace the `<figure>` container and `<Picture>` with:

```svelte
<figure class="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-xl shadow-lavender/15 perf-card {index === 0 ? 'col-span-2 sm:col-span-3 sm:row-span-2' : 'sm:col-span-3 lg:col-span-2'}">
  <Picture src={image.src} type="posters" sizes={index === 0 ? '(max-width: 768px) 100vw, 640px' : '(max-width: 768px) 50vw, 360px'} alt={image.alt} width={index === 0 ? 640 : 360} height={index === 0 ? 360 : 203} loading="lazy" decoding="async" class="aspect-video h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
  ...
</figure>
```

`decoding="async"` is already the default in `Picture`, but making it explicit is fine.

- [ ] **Step 3: Verify with check and tests**

Run:

```bash
npm run check
npm test
```

Expected: 0 errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/routes/[lang=lang]/(app)/series/[id]/+page.svelte
git commit -m "perf: add containment to gallery cards"
```

---

### Task 6: Final Verification

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Run full verification**

```bash
npm run check
npm test
npm run build
```

Expected:
- `svelte-check found 0 errors`
- `Test Files 37 passed (37), Tests 211 passed (211)`
- Build succeeds

- [ ] **Step 2: Check git status**

```bash
git status --short
```

Expected: clean working tree.

- [ ] **Step 3: Push**

```bash
git push
```

---

## Self-Review

**1. Spec coverage:**
- Mobile-first performance optimization: covered in Tasks 1-5.
- Preserve desktop visual: covered by using `md:` breakpoints to keep original styles.
- Preserve actions/SEO/accessibility: no changes to logic, markup structure, or meta tags.
- Reduced motion: covered by `.reduced-motion-orb` and existing `motion-safe` classes.

**2. Placeholder scan:**
- No TBD/TODO placeholders.
- All steps include exact code and commands.

**3. Type consistency:**
- CSS class names consistent across all tasks.
- No TypeScript type changes required.

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-05-series-detail-mobile-perf.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
