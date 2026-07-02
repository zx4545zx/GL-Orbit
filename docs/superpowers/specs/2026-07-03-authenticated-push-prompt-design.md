# Authenticated Push Prompt Design

## Goal

Ensure the push notification prompt appears only for logged-in users. Guests and logged-out users should never see the prompt or trigger its browser push-subscription checks.

## Approved Direction

Use root layout gating:

- Render `PushPrompt` only when `page.data.user` exists.
- Keep all existing prompt behavior inside `PushPrompt.svelte` unchanged.
- Preserve the current dismissed/subscribed/permission-denied logic.

## Behavior

- Guest or logged-out user: no prompt component is rendered.
- Logged-in user: prompt component is rendered and then applies existing checks for browser support, local dismissal, existing subscription, and notification permission.
- Logging out removes the prompt because `page.data.user` becomes null.

## Files

- Modify `src/routes/+layout.svelte` only.
- No UI copy changes.
- No API changes.

## Validation

- Confirm `PushPrompt` is wrapped in an authenticated user condition.
- Run `npm run check`.
