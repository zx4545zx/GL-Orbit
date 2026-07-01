# Calendar Today/This Week-first Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/calendar` default to a mobile-first weekly experience that quickly answers what airs today or this week.

**Architecture:** Keep the existing SvelteKit page and data flow. Promote the existing `card` weekly board to default, add a page-level hero summary, simplify view switching hierarchy, and polish the shared weekly header and card board states without changing backend contracts.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind CSS 4, existing GL-Orbit design tokens.

## Global Constraints

- Thai UI copy for user-facing labels.
- Use Svelte 5 runes only; no `export let`.
- Preserve existing server data flow through `+page.server.ts` and `getCalendarData(query)`.
- Do not modify database schema or API contracts.
- User requested skipping tests for this pass; do not claim test verification.

---

### Task 1: Promote Weekly View and Add Hero Summary

**Files:**
- Modify: `src/routes/(app)/calendar/+page.svelte`

**Interfaces:**
- Consumes: `calendar.scheduleByDay`, `viewMode`, `goToThisWeek`, `getViewUrl()`.
- Produces: Default `viewMode = 'card'`, `todaySummary`, `weekEventCount`, `nextEvent`, and a new hero section.

- [ ] Change default `viewMode` from `grid` to `card`.
- [ ] Add derived summary values for today, week total, and next event from `weekScheduleByDay`.
- [ ] Replace the old centered title block with a hero card containing title, description, stats, and a primary link to this week.
- [ ] Keep view toggle rendered outside loading blocks.

### Task 2: Simplify View Switcher Hierarchy

**Files:**
- Modify: `src/routes/(app)/calendar/+page.svelte`

**Interfaces:**
- Consumes: existing `viewButtons` and `viewToggle()` snippet.
- Produces: Reordered, clearer labels: weekly default first, list/month/table secondary.

- [ ] Reorder view buttons to `card`, `list`, `calendar`, `grid`.
- [ ] Rename labels to make purpose clearer in Thai.
- [ ] Restyle toggle as a secondary segmented control rather than the main visual focus.
- [ ] Keep unconditional `goto(getViewUrl(btn.key, ...))` behavior.

### Task 3: Polish Weekly Navigation Header

**Files:**
- Modify: `src/routes/(app)/calendar/CalendarWeekHeader.svelte`

**Interfaces:**
- Consumes: `currentWeek`, `onPrevWeek`, `onNextWeek`, `onThisWeek` props.
- Produces: Same props and behavior with improved layout and copy.

- [ ] Restyle the header as a compact weekly navigation card.
- [ ] Add small contextual label `สัปดาห์ที่กำลังดู`.
- [ ] Make mobile controls easier to scan while preserving 44px tap targets.

### Task 4: Improve Weekly Card Board Mobile UX

**Files:**
- Modify: `src/routes/(app)/calendar/CardScheduleBoard.svelte`

**Interfaces:**
- Consumes: `scheduleByDay`, `weekStart`, existing tab selection state.
- Produces: Better tab event counts, selected-day header count, and improved empty state.

- [ ] Add event counts to day tabs where space allows.
- [ ] Show selected day event count in the mobile selected-day card.
- [ ] Improve empty day copy with guidance to check another day or week.
- [ ] Keep desktop 7-column board behavior intact.

### Task 5: Align CTA and Notes With New Hierarchy

**Files:**
- Modify: `src/routes/(app)/calendar/+page.svelte`

**Interfaces:**
- Consumes: existing countdown CTA and notes section.
- Produces: Lower visual prominence so weekly content remains primary.

- [ ] Move supporting CTA/notes copy toward the end with softer visual weight.
- [ ] Ensure the default screen at mobile width prioritizes hero, view controls, and weekly board.
- [ ] Do not run tests per user request.
