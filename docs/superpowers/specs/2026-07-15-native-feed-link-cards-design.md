# Native feed link cards

## Goal

Replace third-party players in Halo feeds with fast, polished native link cards that use provider metadata and posters where available.

## Behavior

- Feed cards never mount provider iframes or X widgets.
- Tapping a card opens the original source in a new tab or external application.
- Moment detail pages retain the existing embedded player behavior.
- YouTube cards use a deterministic thumbnail URL from the video ID.
- TikTok cards use a thumbnail returned by oEmbed; an attractive branded card with author/title is the fallback when unavailable or expired.
- X cards are rich text cards built from stored post metadata; no unauthenticated media poster is requested.

## Data flow

1. The server resolves a submitted source URL.
2. For TikTok, the server requests the fixed official oEmbed endpoint once and persists title, author, thumbnail URL, and thumbnail expiry when present.
3. Existing TikTok moments are backfilled once with the same metadata.
4. Feed rendering reads only the stored metadata and its image URL; it does not call providers or create players.
5. An image load failure immediately retains the branded card rather than retrying or loading an iframe.

## UI and accessibility

- Cards reserve their media aspect ratio and use project coral/plum styling.
- The complete card is one accessible external link, not a nested interactive control.
- Provider label, author/title, and external-link affordance stay visible with or without a poster.
- External images are lazy-loaded, decoded asynchronously, and use `no-referrer`.

## Constraints

- Provider media stays on provider infrastructure; Halo does not copy or rehost it.
- TikTok thumbnails can expire. The fallback card must remain complete and visually intentional.
- PWA precache stays limited to static assets; mutable feed metadata and provider images are not precached.

## Validation

- Feed initial DOM contains no third-party iframe or X widget.
- TikTok, YouTube, and X feed cards show usable native previews.
- Feed cards retain a usable fallback when the external poster fails.
- Detail pages still render the existing embeds.
