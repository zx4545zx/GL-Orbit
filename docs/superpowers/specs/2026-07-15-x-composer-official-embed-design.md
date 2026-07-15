# X Composer Official Embed Design

## Goal

Render a real official X post embed in the Moment composer preview after a valid X status URL resolves.

## Approach

Reuse the existing `XEmbedPlayer.svelte` component, which lazily loads X’s official widgets script and renders a status ID with `twttr.widgets.createTweet`. The composer passes its resolved X source URL into this component instead of the generic metadata card.

## Behavior

- A valid `x.com/<handle>/status/<id>` URL shows the official X embed in the composer preview.
- The component displays a compact loading state while X’s widget script renders.
- If X blocks or fails to render, it shows the existing direct link to the original post.
- Non-X previews retain the current lightweight metadata-card behavior.
- No X API credentials, database changes, or new dependencies are required.

## Accessibility and performance

- The rendered embed is only mounted after URL resolution succeeds.
- The existing direct-link fallback remains keyboard-accessible and uses `rel="noreferrer"`.
- The embed uses X’s existing `dnt: true` option.

## Verification

- Open the Halo composer, add a valid X status URL, and confirm the official embed replaces the `X` metadata card.
- Confirm invalid/blocked X embeds show the original-post fallback.
- Run `npm run check`; automated unit tests are out of scope per user request.
