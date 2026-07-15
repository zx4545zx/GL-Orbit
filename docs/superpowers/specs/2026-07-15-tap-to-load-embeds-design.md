# Tap-to-load feed embeds

## Goal

Reduce mobile feed startup cost by rendering lightweight provider preview cards until a visitor explicitly starts an embedded player.

## Scope

- Apply the behavior to Halo feed cards only.
- Keep detail pages on the existing immediate embed behavior.
- Support YouTube, TikTok, and X.
- Preserve the existing external-source link for every provider.

## Design

`EmbedPreview` receives a feed/detail display mode. In feed mode, recognized embeds render a provider preview card first. Activating its accessible play control replaces that card with the existing iframe or X widget.

- YouTube cards use a stable video thumbnail derived from the video ID.
- TikTok cards use a cached provider thumbnail when metadata has one; a branded provider card is the fallback when it is absent or expired.
- X cards use the existing source metadata and a text-first provider card; no provider image is fetched without an authenticated X API integration.
- The original-source link remains available both before and after player activation.

## Data and error handling

- Extend resolved embed metadata with an optional preview image URL.
- Fetch and store TikTok oEmbed metadata only when resolving a submitted TikTok URL; failure must retain the current safe fallback.
- Treat TikTok image URLs as temporary. A failed image load swaps to the branded provider card without retrying the iframe.
- Player creation is local component state only; no additional database mutation occurs when a user starts playback.

## Accessibility and performance

- Use a semantic button with an accessible provider-specific play label.
- Preserve the card aspect ratio to prevent layout shift.
- Do not request player scripts, player iframes, or X widgets until activation.
- PWA cache policy remains static-assets-only; user feed data and provider preview URLs are not precached.

## Validation

- Verify mobile feed initially contains no provider iframe for unactivated posts.
- Verify activating each provider replaces only that card with its player or widget.
- Verify source links and fallback states remain usable.
