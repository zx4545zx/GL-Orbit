# Ship Detail Redesign Design

Date: 2026-07-09

## Goal

Redesign the public ship detail page so it uses the same layout rhythm and spacing as the series detail page while keeping a distinct ship-focused personality.

## Scope

- Page: `src/routes/[lang=lang]/(app)/ships/[id]/+page.svelte`
- No data model, server load, SEO contract, schema, or API changes.
- Preserve existing ship detail data: image, name, description, hashtags, two artists, and linked series.

## Chosen Approach

Use a hybrid design:

- Align the page structure with `series/[id]/+page.svelte`.
- Keep ship-specific visual language through artist pairing, soft orbit connection details, hashtags, and shared-work cards.
- Avoid the current oversized split-card / heavy background-mesh composition because it diverges from the series detail layout.

## Layout

### Page Shell

- Use the same outer spacing pattern as series detail:
  - `relative -mx-4`
  - bottom-nav reserved spacing
  - `md:-mt-24`, `md:pt-24`
  - inner container `mx-auto max-w-7xl px-4 ... md:px-6`
- Back button should match series detail spacing, shape, and interaction style.

### Hero

- Use a two-column hero grid matching series detail:
  - Left: primary ship image in a poster-like card.
  - Right: ship content in a vertically arranged panel.
- Right panel content:
  - badges for `Ship`, featured state if available, and shared work count
  - ship name as the main heading
  - artist pairing line: `artist1 × artist2`
  - description card with Thai fallback text
  - meta cards for work count, connection/mood, and ship start year if available
  - hashtags as compact rounded pills

### Artist Pair Section

- Place below the hero, matching the series detail section rhythm.
- Section header should visually align with Cast/Gallery/Schedule sections in series detail.
- Show two linked artist cards with profile images, names, full names, and a subtle orbit/connection motif between them.
- Keep this lighter than the current large right-side orbit panel so the page stays consistent with series detail.

### Shared Series Section

- Place below artist pair section.
- Use a grid of linked series cards, visually similar in density to series detail content sections.
- Each card includes poster, status badge, English title, Thai title if present, and a short call-to-action text.
- Empty state remains Thai and uses a glass/card treatment consistent with the page.

## Visual Direction

- Tone: soft editorial fan archive, not maximalist landing page.
- Use the existing GL-Orbit palette: coral, lavender, mint, plum, cream.
- Use existing typography variables: display font for headings, Thai font for Thai copy.
- Maintain glassmorphism cards, but reduce large decorative gradients and floating background blobs.
- Keep motion subtle: hover lift, image scale, no large animated hero effects.

## Accessibility

- Preserve semantic structure with a single `h1`.
- Artist and series cards remain real links.
- Touch targets should meet the existing `touch-target` convention where buttons are used.
- Images require meaningful alt text using ship, artist, or series names.
- Avoid embedding decorative text that screen readers need to parse as essential content.

## Performance

- The main ship image should load eagerly with high priority.
- Secondary artist and series images should lazy load.
- Avoid adding client-side state, large animations, or extra dependencies.

## Testing / Verification

Run after implementation:

- `npm run check`
- Visual smoke-check in responsive widths if a browser preview is available:
  - mobile width
  - tablet width
  - desktop width

## Non-goals

- No changes to `+page.server.ts`.
- No new translations unless existing copy requires extraction later.
- No admin ship page changes.
- No database or SEO schema changes.
