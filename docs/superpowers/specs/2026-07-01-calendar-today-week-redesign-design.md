# Calendar Today/This Week-first Redesign

## Context

The current `/calendar` page supports four views: `grid`, `calendar`, `list`, and `card`. The default is the dense monthly grid, which is useful on large screens but creates a poor first impression on mobile because users must scan many cells or scroll horizontally before finding what airs soon.

The redesign should make the primary question answerable immediately: **what GL series airs today or this week, at what time, and on which platform?**

## Goals

- Make the calendar page mobile-first and easier to scan.
- Promote the weekly card experience as the default view.
- Keep monthly and dense table views available as secondary tools.
- Preserve existing server data flow and URL-based navigation.
- Avoid database or API contract changes.

## Non-goals

- No schema changes.
- No new admin workflow.
- No removal of existing calendar data sources.
- No visual companion/mockup artifact for this iteration.

## UX Approach

Adopt a **Today / This Week-first** structure:

1. Hero summary at the top with the page title, short description, and lightweight stats such as today's count and this week's count.
2. Default view is the weekly card board (`card`) instead of the dense monthly grid.
3. Week controls are prominent and thumb-friendly: previous week, this week, next week.
4. View switching becomes secondary and simpler: weekly cards first, then list/month/table for users who need alternatives.
5. Monthly calendar remains available for planning but is not the primary experience.
6. Empty states should guide the user instead of feeling blank.

## Components and Boundaries

- `src/routes/(app)/calendar/+page.svelte`
  - Owns page-level state, view mode, month/week navigation, SEO, hero summary, and view composition.
  - Default view should become `card`.
  - Existing monthly/list/table views can stay, but their hierarchy should be visually reduced.

- `src/routes/(app)/calendar/CalendarWeekHeader.svelte`
  - Can be restyled to feel like a compact weekly navigation card.
  - Keep the current callback props and no API changes unless necessary.

- `src/routes/(app)/calendar/CardScheduleBoard.svelte`
  - Remains the primary weekly experience.
  - Improve mobile visual hierarchy where possible: today indicator, count, clearer event cards, stronger empty state.

## Data Flow

- Continue using `+page.server.ts` and `getCalendarData(query)`.
- URL params continue to drive monthly and weekly ranges.
- If no explicit params are present, the server can still load the current month; the client default view can show the current week using the existing `scheduleByDay` data.
- No backend contract changes are required.

## Visual Design Direction

- Use existing GL-Orbit tokens: coral, lavender, mint, plum, cream.
- Follow an 8-point spacing rhythm.
- Use one clear visual hierarchy:
  - Biggest: page title and current week range.
  - Next: today/this week summary.
  - Next: event time, series title, episode, platform.
- Keep strong coral usage for primary action, today markers, and Uncut badges only.
- Use softer lavender/mint surfaces for secondary cards and empty states.

## Loading, Empty, and Error States

- Loading states should match the active default weekly card view first.
- Empty day state should say there is no airing today and nudge users to check another day/week.
- Existing content-loading behavior during same-path navigation should remain.
- No new error boundary is required for this iteration.

## Accessibility

- Maintain 44px minimum tap targets.
- Preserve Thai UI copy.
- Keep semantic links for series details.
- Use `aria-label`, `role="tablist"`, and `aria-selected` patterns already present in the weekly board.
- Avoid relying only on color for today's state; include labels or dots.

## Testing and Verification

Run at minimum:

```bash
npm run check
```

If time allows, also run relevant calendar tests:

```bash
npm test -- calendar
```

Manual checks:

- Mobile width around 375px: default page shows weekly content without horizontal scrolling.
- Desktop width: weekly board remains readable.
- Week navigation updates URL and loading skeleton appears without hiding controls.
- Monthly/table/list views remain reachable.
