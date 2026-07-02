# Authenticated Push Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the push notification prompt only when a user is logged in.

**Architecture:** Gate `PushPrompt` at the root Svelte layout using `page.data.user`. Leave `PushPrompt.svelte` unchanged so its existing browser support, dismissed, subscription, and permission checks still run only after the user is authenticated.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Svelte template conditionals, `npm run check`.

---

## File Map

- Modify: `src/routes/+layout.svelte` — wrap `<PushPrompt />` with `{#if page.data.user}`.
- Create: `docs/superpowers/specs/2026-07-03-authenticated-push-prompt-design.md` — already written design spec.
- Create: `docs/superpowers/plans/2026-07-03-authenticated-push-prompt.md` — this implementation plan.

## Task 1: Gate PushPrompt by authenticated user

**Files:**
- Modify: `src/routes/+layout.svelte:161`

- [x] **Step 1: Update layout markup**

Change the bottom of `src/routes/+layout.svelte` from:

```svelte
<PushPrompt />
```

to:

```svelte
{#if page.data.user}
	<PushPrompt />
{/if}
```

- [x] **Step 2: Verify the condition exists**

Run: `rg -n "page\.data\.user|<PushPrompt" src/routes/+layout.svelte`

Expected output includes both the `{#if page.data.user}` line and `<PushPrompt />` inside it.

## Task 2: Validate the project

**Files:**
- Read-only validation across the project.

- [x] **Step 1: Run Svelte/TypeScript validation**

Run: `npm run check`

Expected: command exits with 0 errors. Existing Svelte warnings may still be printed.

- [x] **Step 2: Review changed files**

Run: `git diff -- src/routes/+layout.svelte docs/superpowers/specs/2026-07-03-authenticated-push-prompt-design.md docs/superpowers/plans/2026-07-03-authenticated-push-prompt.md`

Expected: diff only contains the authenticated `PushPrompt` gate and the design/plan docs.

---

## Self-Review

- Spec coverage: the plan prevents guest/logout rendering, keeps existing `PushPrompt.svelte` behavior unchanged, and validates with `npm run check`.
- Placeholder scan: no placeholders remain.
- Type consistency: no new TypeScript types or APIs are introduced.
