# Design: Homepage Content Expansion for SEO

Date: 2026-06-29

## Goal

Improve the homepage (`/`) content quality for SEO by increasing useful visible text and improving the text-to-code ratio, while preserving GL-Orbit's current visual style and user experience.

## Current Context

SEO checker reports for the homepage:

- Text-to-code ratio is too low: 11.98%.
- Content is too thin: 244 words.
- Recommendation: add more useful content and aim for at least 500 words.

A source inspection found that `src/routes/(app)/+page.svelte` has a large amount of UI markup, decorative SVG, cards, and dynamic sections, but relatively little static explanatory copy. The homepage currently focuses on hero text, countdown cards, featured series, and schedule previews. This is visually strong but thin from an SEO content perspective.

## Chosen Approach

Add one substantial, visible SEO content section to the homepage, focused on explaining GL-Orbit's purpose and value to users.

This is preferred over hiding text or reducing UI markup because it improves the page for both humans and crawlers.

## Content Strategy

Add a new section titled:

```text
GL-Orbit คืออะไร
```

The section should explain, in natural Thai copy with relevant English terms, that GL-Orbit is a community-focused hub for Girls' Love (GL) series discovery, broadcast schedules, streaming platforms, artists, and timezone-aware release tracking.

The new section should include:

1. A clear introduction paragraph.
2. Three informational cards:
   - Track GL series schedules.
   - Discover series, artists, and studios.
   - Check streaming links, platforms, and Uncut labels.
3. A short FAQ block with 4-6 questions and answers.

Target added visible content: approximately 350-550 Thai/English words, enough to push the homepage beyond the 500-word recommendation when combined with existing text and dynamic content.

## UX / Visual Design

- Use the existing GL-Orbit visual language: glass cards, coral/lavender/mint accents, rounded cards, and Thai-first copy.
- Place the new content after the hero section and before highly dynamic listing sections, so crawlers and readers encounter explanatory content early.
- Keep the section scannable with headings, short paragraphs, and cards.
- Do not use hidden text, keyword stuffing, or content that is irrelevant to real users.

## Technical Design

Modify only:

```text
src/routes/(app)/+page.svelte
```

Implementation details:

- Add static data arrays in the `<script lang="ts">` block for feature cards and FAQs.
- Render the new section in the markup after the Hero section.
- Use existing styling utilities and Tailwind classes.
- Avoid new inline `style=` attributes.
- Avoid new dependencies.
- Do not change database loading, countdown behavior, featured series behavior, schedule behavior, auth, or SEO endpoints.

## Content Draft Requirements

The copy should cover these concepts naturally:

- GL series / Girls' Love series.
- ตารางฉาย and timezone-aware release tracking.
- Streaming platform links.
- Uncut version labels.
- Series, artists, studios, and community discovery.
- Why users should bookmark or revisit GL-Orbit.

## Verification

After implementation:

1. Run a source-level inline style check for the homepage:

```bash
rg -n 'style=' 'src/routes/(app)/+page.svelte'
```

Expected: no matches.

2. Run a rough visible-text estimate for the homepage source to confirm content increased materially.

3. Run project validation:

```bash
npm run check
```

Expected: exit status 0. Existing unrelated warnings may remain.

4. Optionally run the dev server and visually inspect `/`.

## Out of Scope

- Expanding content on `/series`, `/calendar`, `/artists`, or `/countdown`.
- Removing decorative UI or redesigning the homepage.
- Adding CMS/database-driven homepage content.
- Adding hidden SEO-only text.
- Changing sitemap, robots, or `llms.txt`.

## Risks

- Too much text could make the homepage feel less lightweight.
- Repetitive SEO copy could feel generic or keyword-stuffed.
- Adding content in the wrong position could push dynamic content too far down.

Mitigation: keep the section useful, scannable, and visually integrated with the existing design.
