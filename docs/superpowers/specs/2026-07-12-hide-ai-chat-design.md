# Hide AI Chat Entry Points

## Goal

Temporarily remove public UI access to unfinished AI chat without deleting or disabling its underlying implementation.

## Scope

Remove the `/[lang]/chat` entry point from:

- Primary navigation (`src/lib/components/Navigation.svelte`)
- Menu page chat card (`src/routes/[lang=lang]/(app)/menus/+page.svelte`)
- Home-page floating chat button (`src/routes/[lang=lang]/(app)/+page.svelte`)

## Out of scope

- Direct chat routes remain available to authenticated users.
- Chat API endpoints, MiniMax configuration, database tables, persisted conversations, migrations, and tests remain unchanged.
- AI crawler and LLM SEO endpoints remain unchanged.

## Behavior

Users no longer see a navigation or page-level control that leads to AI chat. Existing non-chat navigation, menu layouts, and home-page interactions retain their current behavior.

## Validation

- Run `npm run check`.
- Confirm no visible `/[lang]/chat` entry points remain in the three scoped components.
- Confirm direct routes and server-side chat code are untouched.
