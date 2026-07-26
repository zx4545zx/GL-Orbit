# Explore Responsive Hybrid Design

Date: 2026-07-27  
Status: Approved design; specification only

## Goal and scope

Make the existing `/th/explore` landing page responsive without changing its content, data flow, routes, carousel library, or section order. Keep the current cinematic hero on larger screens and the horizontal editorial rails, while giving narrow screens a simpler, stable composition.

No changes to explore subpages, APIs, shared navigation, dependencies, or unrelated components/refactors are included.

## Current issues

- TOP 10 uses the generic poster-rail sizing, showing two dense ranked cards on mobile; large rank numerals compete with poster and text.
- Tablet hero retains desktop-scale vertical spacing after its poster disappears, leaving excess empty space.
- Hero arrows and full-size pagination controls consume too much narrow-screen width.
- Rail arrows are decided from desktop item thresholds, so they can be missing when a smaller viewport has hidden items, or shown when all items fit.
- Pre-initialization/SSR slide widths are fixed pixels and do not match Splide's responsive `perPage`, causing a visible width change during hydration.

## Responsive behavior

Breakpoints follow the page's existing ranges: mobile `0–639px`, tablet `640–1023px`, desktop `1024px+`. Within tablet, `640–767px` is the two-item TOP 10 range and `768–1023px` is the three-item range.

### Hero

- **Mobile:** retain one full-width slide and existing content priority. Hide previous/next arrows. Keep pagination available as compact indicators with 44×44px invisible interaction boxes; the visible marks remain small. Keep swipe/drag navigation. Prevent title, metadata, actions, status, and pagination from overlapping at 320px.
- **Tablet:** retain one full-width slide, hide the side poster as today, and reduce frame spacing to `64px 24px 72px` (top, inline, bottom). Keep arrows and pagination, but use the existing 44px minimum targets and a tighter visual gap.
- **Desktop:** preserve the current two-column hero, side poster, and `90px 32px 84px` frame spacing.
- Hero motion and active-slide semantics remain unchanged. Non-active slide links stay out of tab order.

### TOP 10 rail

- **Mobile `0–639px`:** exactly 1 ranked item visible per page.
- **Small tablet `640–767px`:** exactly 2 visible.
- **Large tablet `768–1023px`:** exactly 3 visible.
- **Desktop `1024px+`:** exactly 4 visible.
- Preserve rank order, card content, horizontal drag/swipe, page-at-a-time arrow behavior, rewind behavior, and section/view-all links.

### Other rails and arrows

- Upcoming and ships retain 2 mobile / 3 tablet / 4 desktop items. Artists retain 2 mobile / 4 tablet / 6 desktop items.
- Determine arrow visibility per rail from the **current responsive visible count**, not a desktop-only threshold: show arrows only when `itemCount > visibleItemCount`.
- Continue hiding rail arrows at `0–639px` and on non-hover/coarse-pointer contexts; swipe/drag remains the mobile control. At tablet/desktop widths, arrows appear only when overflow exists.
- Recalculate arrow visibility when the responsive visible count changes. Do not show disabled or inert controls when all items fit.

### SSR and hydration stability

- SSR/pre-init CSS must use the same breakpoint ranges, visible counts, gaps, and available track width as the mounted carousel.
- Size fallback slides as a fraction of the rail track rather than fixed `232px`/`168px` widths. TOP 10 fallback follows 1/2/3/4; poster rails follow 2/3/4; artist rail follows 2/4/6.
- Preserve the first item's position and rail height through carousel mount. Small subpixel rounding is acceptable; a card-count change, card jump, or horizontal page shift is not.
- Keep SSR rail content visible and usable when JavaScript is unavailable.

## Orbit Editorial constraints

- Preserve the existing editorial hierarchy: hero first, then tabs/search/filters, upcoming, TOP 10, artists, ships, and platforms.
- Use existing `--orbit-*` tokens, structural borders, typography, and coral/lavender/mint/plum roles.
- Edited cards, controls, image frames, badges, and pagination marks remain rectangular with sharp corners. Circles remain limited to intrinsic avatar/status data marked with `.orbit-round-data`.
- No decorative pills, gradient blobs/dividers, heavy new shadows, or generic card-grid replacement.
- Do not alter localized Thai/English copy or hardcode new user-facing strings.

## Accessibility

- Every hero dot, arrow, rail arrow, tab, chip, and action keeps a minimum 44×44px interactive target.
- All interactive controls require a visible `:focus-visible` state in light and dark themes; hidden arrows must not remain focusable.
- Preserve accessible carousel/slide labels, `aria-current`, active-slide `aria-hidden`, and icon-only control names.
- Keyboard users can reach visible hero controls, links, tabs, filters, and rail actions in logical DOM order without focus entering inactive slides.
- Under `prefers-reduced-motion: reduce`, remove decorative transitions/transform movement and avoid animated scrolling; navigation and state changes remain immediate and understandable.
- Content and controls must not depend on hover, color, or motion alone.

## Validation

Check `/th/explore` with representative populated data at:

- `320px`: no overflow or hero/control overlap; TOP 10 shows 1 item; hero arrows hidden.
- `375px`: same mobile behavior; swipe/drag and compact dots usable.
- `640px` and `768px` tablet: TOP 10 changes from 2 to 3 items at 768px; hero spacing is reduced; overflow arrows match each rail's visible count.
- `1024px+` desktop: TOP 10 shows 4 items; desktop hero/poster and spacing remain intact.

At each applicable width, verify first SSR paint against hydrated layout for card-count/position shift. Also verify light and dark themes, keyboard-only traversal and focus visibility, coarse-pointer behavior, JavaScript-disabled SSR fallback, and reduced-motion mode.

## Acceptance boundary

Complete when existing `/th/explore` content follows the responsive counts and controls above without hydration jumps or accessibility regression. Do not redesign `/th/explore/series`, `/artists`, `/ships`, change server data, add dependencies, or refactor unrelated carousel/layout code.
