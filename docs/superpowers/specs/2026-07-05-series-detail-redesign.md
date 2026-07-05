# Series Detail Redesign — Soft Orbit Lite

Date: 2026-07-05

## Status

Approved design direction. Implementation has not started.

## Goal

Redesign the public series detail page for mobile PWA performance while preserving the GL-Orbit identity. The page should feel soft, light, and app-like, with clear hierarchy and much lower paint/decode cost on phones.

## Problem Summary

The current detail page feels sluggish on mobile because it renders a heavy visual stack immediately:

- A full-screen blurred poster/cover background loads eagerly at high priority.
- The main poster also loads eagerly at high priority.
- Large backdrop blur, heavy shadows, animated blur orbs, and noise overlays increase repaint cost.
- Episode rows with content are expanded by default, increasing DOM size.
- Trailer iframes can appear inside expanded rows instead of being explicitly requested.
- The global fixed background can hurt mobile scrolling, especially in standalone PWA mode.

This redesign fixes the root cause by reducing initial image work, paint work, and rendered DOM on mobile.

## Design Direction

Use **Soft Orbit Lite**:

- Keep GL-Orbit colors: coral, lavender, mint, plum, cream.
- Replace cinematic blur-heavy atmosphere with soft static surfaces.
- Use rounded cards, tinted borders, and small accent glows sparingly.
- Prefer clarity and rhythm over visual density.
- Mobile baseline is 375px width.

The memorable detail should be: **a calm mobile series profile where the poster and save/watch actions feel immediate, polished, and fast.**

## UX Priorities

1. User immediately understands the series: poster, title, status, studio/year.
2. User can save, mark watched, or share without hunting.
3. User can read synopsis and scan cast/schedule without jank.
4. User only loads rich media like trailer embeds when they ask for it.

## Page Structure

### 1. Mobile-first soft hero

- Remove the full-screen blurred poster background on mobile.
- Use a lightweight static pastel gradient or flat cream surface with tiny accent shapes.
- Keep one eager/high image: the primary poster.
- Put status and studio/year near the title.
- Keep back navigation visible and lightweight.

Desktop may keep a richer hero, but should still avoid duplicated high-priority image decode when possible.

### 2. Poster and action strip

- Poster remains the main visual anchor.
- Under or near the poster, render Favorite, Watched, and Share as compact touch-friendly controls.
- Minimum touch target: 44px.
- Use soft tinted button surfaces rather than heavy glass blur.
- Keep existing component APIs and auth behavior.

### 3. Synopsis card

- Keep localized description and read-more behavior.
- Use a light card with solid/translucent background, no heavy mobile backdrop blur.
- Preserve Thai-safe line height and current overflow measurement behavior.
- Keep transition subtle and respect reduced-motion settings.

### 4. Metadata and tags

- Show episodes, year, and cast count as small stat cards/chips.
- Genres and platforms remain scannable chips.
- Avoid making labels visually heavier than values.
- Use 8-point spacing: 8, 12, 16, 24, 32.

### 5. Cast section

- On mobile, use a horizontal reel or compact two-column cards to reduce vertical density.
- Keep artist images lazy-loaded.
- Keep links and accessible focus states.
- Avoid heavy hover-only effects on mobile.

### 6. Gallery section

- Render only when there are useful gallery candidates.
- On mobile, limit visible candidates and lazy-load all gallery images.
- Do not use gallery images as eager/high resources.
- Keep future compatibility with official gallery data.

### 7. Schedule section

- On mobile, episode rows should start collapsed by default.
- Show episode number/cover, title, first air date, and platform summary in each row.
- Keep Expand all / Collapse all, but the default initial state should not inflate the DOM.
- Expanded content shows stream links and trailer entry points.
- Trailer iframe should render only after an explicit user action, not merely because the row is expanded.
- Preserve keyboard activation and `aria-expanded`.

## Performance Requirements

- Mobile initial render must not include a full-screen blurred image.
- Mobile initial render should use only one eager/high image: the primary poster.
- All non-hero images use `loading="lazy"` and `decoding="async"`.
- Reduce or remove mobile `backdrop-blur-*`, especially `backdrop-blur-2xl`.
- Avoid large animated blur orbs on mobile.
- Use `content-visibility: auto` on lower sections where appropriate.
- Disable `background-attachment: fixed` for mobile/PWA contexts.
- Keep service worker behavior unchanged in this redesign unless a separate caching task is approved.

## Accessibility Requirements

- Minimum 44px touch targets.
- Text contrast remains readable on pastel surfaces.
- Focus-visible styles remain on links/buttons.
- Schedule rows keep keyboard support.
- Motion remains subtle and compatible with `prefers-reduced-motion`.
- Important content must not rely on hover.

## Data and API Scope

### In scope

- Redesign `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`.
- Use existing `Picture`, `FavoriteButton`, `WatchedButton`, and `ShareButton` components.
- Use existing server load data shape.
- Adjust local Svelte state for mobile-friendly default schedule expansion.
- Add small local state for trailer iframe activation if needed.

### Out of scope

- Database migrations.
- Query contract changes.
- Admin changes.
- New service worker runtime caching.
- Broad app-wide redesign beyond the mobile fixed-background performance rule if needed.

## Error Handling and Fallbacks

- Missing poster keeps existing placeholder behavior.
- Missing artist image keeps existing avatar fallback.
- Missing episode cover uses a lightweight episode-number tile.
- Invalid trailer URLs keep existing external-link fallback.
- Empty gallery candidates omit the gallery section.

## Testing and Verification

After implementation, run:

```bash
npm run check
npm run build
```

Manual verification should cover:

- Mobile PWA/standalone scroll smoothness.
- iPhone SE width layout.
- Long Thai and English titles.
- Description read-more/collapse.
- Favorite, watched, and share controls.
- Schedule collapsed initial state on mobile.
- Trailer iframe appears only after explicit user action.
- Series with no gallery candidates.
- Episodes with and without cover images.
- Desktop layout remains acceptable.

## Implementation Notes

- Use existing Tailwind v4 theme and project fonts.
- Keep UI copy localized through existing i18n when new text is required.
- Prefer targeted component/page changes over broad CSS refactors.
- Do not flatten the GL-Orbit feel into generic minimalism; the page should remain softly branded, just lighter.
