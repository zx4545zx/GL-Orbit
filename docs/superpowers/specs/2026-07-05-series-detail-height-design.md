# Series Detail Hero Height – Design

## Problem
On `/series/[id]`, the two-column hero (poster + actions on the left, title / meta / synopsis on the right) ends up with the right column taller than the left, even after previous `ResizeObserver`/`style.height` fixes. The cause is the current CSS Grid using `align-items: stretch`: the right column's intrinsic content height still influences the grid row track, so the left column is stretched to match the taller right side, or the right side visually overflows below the intended hero boundary.

## Goal
Make the hero row height determined **only by the left column** (poster + action strip). The right column must never exceed that height. When right content is taller, only the synopsis area scrolls; title, meta chips, and platform/genre tags stay visible.

## Decision
Use **Approach B: CSS Grid with an absolutely-positioned right-column inner content**.

## Design

### Layout structure (md+ only)
```
<section class="grid md:grid-cols-[minmax(18rem,0.84fr)_minmax(0,1.35fr)] md:items-stretch">
  <!-- Left column: intrinsic height driver -->
  <div class="...">
    <Picture aspect-[2/3] />
    <ActionStrip />
  </div>

  <!-- Right column wrapper: no intrinsic height, stretches to row height -->
  <div class="relative min-w-0 overflow-hidden">
    <!-- Scrollable inner: fills wrapper height -->
    <div class="absolute inset-0 flex flex-col overflow-hidden">
      <!-- Header: always visible -->
      <div class="flex-shrink-0">
        status/studio chips
        <h1>title</h1>
        <p>Thai title</p>
      </div>

      <!-- Synopsis: scrollable, fills remaining height -->
      <div class="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] ...">
        <p class="flex-1 overflow-y-auto ...">{description}</p>
      </div>

      <!-- Footer: always visible -->
      <div class="flex-shrink-0">
        meta grid
        genre / platform chips
      </div>
    </div>
  </div>
</section>
```

### Why this works
- The right-column wrapper has **no padding and no in-flow content**; its intrinsic height contribution to the grid track is effectively zero.
- The grid row therefore sizes to the left column (poster + actions), which is the only in-flow content with real height.
- `align-items: stretch` then stretches the right wrapper to that exact row height.
- The inner content is absolutely positioned with `inset-0` and uses flex column so the synopsis card fills the available height and scrolls independently.

### Mobile (< md)
Keep the existing single-column flow. The absolute-positioned inner layout is only active at `md:` breakpoint.

### Scroll behavior
- Scroll target: only the synopsis paragraph (`overflow-y-auto`).
- Title, status/studio chips, meta grid, and genre/platform chips remain fixed at top/bottom.
- Keep the existing bottom fade when overflow exists and the user has not scrolled to the bottom.

### Accessibility / motion
- Respect `prefers-reduced-motion` for any scroll-related transitions.
- Keep `aria-label` on scrollable region if needed.

## Files affected
- `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte` — hero section layout and right column structure.

## Out of scope
- No changes to action buttons, Picture component, or lower sections (cast, gallery, schedule).
- No JavaScript height synchronization; this design removes it.
