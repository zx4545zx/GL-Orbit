# Series Detail Redesign — Poster Premiere

Date: 2026-07-05

## Status

Approved design. Implementation has not started.

## Goal

Redesign the public series detail page into a cinematic, poster-first experience that makes each GL series feel like a premiere page while preserving the current data model, actions, SEO behavior, and accessibility.

## Scope

### In scope

- Redesign `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`.
- Keep the current server load and query data shape unchanged.
- Keep existing actions: favorite, watched, share, read-more synopsis, expandable episode rows, trailer embeds, stream links.
- Make the layout forward-compatible with future series cover images and a series gallery.
- Use existing data as fallbacks:
  - Poster remains the primary available image.
  - Episode covers can optionally serve as a temporary visual reel when useful.

### Out of scope

- No database migration in this phase.
- No `series.coverUrl` field in this phase.
- No `series_gallery` table in this phase.
- No admin form/API/query changes for gallery management in this phase.

## Visual Direction

Use a **Cinematic Poster Premiere** direction inspired by dark film-detail pages and editorial gallery layouts:

- Wide atmospheric hero with dark gradient overlays.
- Poster/card layered over a background wash.
- Strong title, compact metadata, and direct action cluster near the hero.
- Gallery-style image rhythm below the hero.
- GL-Orbit accents remain present through coral, lavender, and mint highlights, but the overall page should feel more cinematic and less pastel-card-heavy than the current screenshot.

The memorable detail should be: **the top of the page feels like a GL series premiere wall built from the poster artwork.**

## Data and Future Compatibility

The implementation should derive local UI candidates without changing backend contracts:

- `coverCandidate`: currently resolves to `series.poster`.
- Future behavior can switch to `series.coverUrl ?? series.poster` once a cover field exists.
- `galleryCandidates`: currently can be an empty array or derived from episode covers already present in `series.schedule`.
- Future behavior can switch to `series.gallery` once gallery data exists.

If there is no useful gallery data, the gallery section should not render rather than showing fake content.

## Page Structure

### 1. Cinematic Hero

- Full-width section inside the app layout with a dark poster-derived background wash.
- Use layered gradients, soft blur, and optional noise texture for atmosphere.
- Desktop layout:
  - Poster card on one side.
  - Title, Thai title, status, studio/year, synopsis, platforms, and actions on the other.
  - The poster and content panel should overlap or visually interlock.
- Mobile layout:
  - Poster-first stack.
  - Title and actions stay close to the poster.
  - Keep bottom nav safe-area spacing intact.

### 2. Action Cluster

- Reuse existing `FavoriteButton`, `WatchedButton`, and `ShareButton`.
- Place actions in the hero so users can save/share immediately.
- Preserve login redirect behavior and current component APIs.

### 3. Story / Synopsis Card

- Keep localized `description` and read-more behavior.
- Improve readability with a darker translucent card or high-contrast panel.
- Preserve line-clamp behavior and Thai-safe line height.

### 4. Info Chips

- Episodes, year, cast count, genres, and platforms become compact premiere metadata.
- Keep platform logos where available.
- Avoid overloading the hero; use chips that scan quickly.

### 5. Cast Reel

- Present cast as a cinematic reel:
  - Horizontal/compact cards on smaller screens.
  - Grid or staggered card row on desktop.
- Keep artist links and images.
- Preserve accessible focus styles.

### 6. Scene Gallery

- Add a forward-compatible section for future series gallery imagery.
- Render only when gallery candidates exist.
- Use an editorial grid inspired by film-board layouts:
  - A larger lead image when enough images exist.
  - Smaller supporting stills around it.
- Current phase may derive candidates from episode covers, but must not imply they are official series gallery images in copy.

### 7. Episode Schedule Timeline

- Keep existing schedule data and expand/collapse behavior.
- Restyle as a cinematic episode timeline/reel:
  - Episode number and cover thumbnail.
  - Air date and platform summary.
  - Today/Uncut badges.
  - Expanded trailer embed and stream links.
- Preserve keyboard activation, `aria-expanded`, and reduced-motion behavior.

## Accessibility and Responsive Requirements

- Mobile-first layout.
- Minimum 44px touch targets.
- Sufficient contrast over dark hero imagery.
- `prefers-reduced-motion` respected through existing global CSS.
- Keep keyboard support for expandable schedule rows.
- Avoid hiding important text behind image overlays.
- Keep focus-visible states on links/buttons.

## SEO and Head Metadata

- Keep current `<svelte:head>` behavior.
- Keep canonical URL, Open Graph image, Twitter image, and JSON-LD generation.
- No SEO data contract changes in this phase.

## Error Handling

- No new server errors are introduced because backend data is unchanged.
- Missing optional imagery should gracefully fall back:
  - Missing poster: preserve existing `Picture` behavior and layout resilience.
  - Missing gallery candidates: omit gallery section.
  - Missing episode cover: use a stylized episode-number placeholder.
- Existing trailer URL parsing behavior remains unchanged.

## Testing and Verification

After implementation, run:

```bash
npm run check
npm test
```

Manual review should cover:

- Desktop hero composition.
- Mobile hero and bottom-nav safe area.
- Long Thai and English titles.
- Long synopsis read-more/collapse.
- Series without gallery candidates.
- Episodes with and without cover images.
- Episodes with invalid external trailer URLs.
- Logged-out favorite/watched redirects.

## Implementation Notes

- Prefer local derived values in the Svelte component over backend changes.
- Use existing Tailwind v4 theme colors and fonts.
- Avoid adding large global CSS unless utility classes are genuinely reusable.
- Keep the UI text localized through existing i18n messages where text already exists. If new user-facing copy is necessary, add it through the project i18n system rather than hard-coding Thai/English strings.
