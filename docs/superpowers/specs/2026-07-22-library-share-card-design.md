# Library Share Card Design

## Goal

Let a signed-in member create and share a polished image summarizing their GL-Orbit library from the Profile page. The first version prioritizes fast delivery, one clear action, no new server workload, and room for later customization.

## Product Decisions

- Place the feature in Profile → Library.
- Use one action labeled “แชร์คลังของฉัน” / “Share my library”.
- Generate one 1080×1350 PNG (4:5). This works well in social feeds and remains usable in stories without adding a format picker.
- Select the three most recent favorite series automatically. The user does not choose or reorder posters in this version.
- Share through the native Web Share API when file sharing is supported; otherwise download the PNG.
- Do not add a modal, editor, caption field, size selector, database table, API route, query, or dependency.

## Data and Privacy

The card uses data already returned by the Profile server load:

- display name;
- avatar URL;
- favorite-series count;
- watched-series count;
- up to three most recent favorite series, including title and poster URL.

The card must not expose email, internal user ID, account role, session details, or any other private account metadata. If the display name is absent, use the existing localized member fallback rather than an email or username.

No additional database request occurs when the user generates a card.

## Architecture

Add a focused profile component responsible for the share-card action and its interaction state. Keep drawing and export logic in a separate client utility so image composition can be unit tested without coupling it to Svelte rendering.

The Profile page passes a small typed model containing identity, counts, and the first three entries from the already date-descending favorites array. The client utility draws the model onto an off-screen Canvas at exactly 1080×1350 and exports an `image/png` Blob.

Image loading is best-effort. Avatar and poster images load with cross-origin-safe settings. A failed or canvas-unsafe image is replaced by a branded placeholder; one failed image must never prevent the rest of the card from being generated. Text is drawn directly onto Canvas with deterministic fallback font stacks already used by GL-Orbit.

The component converts the Blob to a `File` and uses `navigator.canShare({ files })` plus `navigator.share({ files, title, text })` when available. Unsupported file sharing falls back to a temporary object URL and programmatic PNG download. Object URLs are always revoked.

## Visual Design

The exported card follows Orbit Editorial rather than reproducing the live Profile DOM:

- fixed warm-paper background for consistent output in light and dark browser themes;
- sharp rectangular geometry;
- restrained plum, coral, and mint palette;
- header with GL-Orbit identity and “MY GL ORBIT”;
- member avatar and display name;
- two prominent statistics: favorites and watched;
- an editorial grid containing up to three recent favorite posters and titles;
- branded empty cells when fewer than three favorites exist;
- footer with the GL-Orbit site identity and localized creation date.

The Profile page itself shows a compact bordered feature row with a short explanation and one minimum-44px action. It does not render a full-size preview or open another step.

## Interaction States

- Idle: action enabled.
- Generating: action disabled and label changes to “กำลังสร้าง...” / “Creating...”. Duplicate activation is ignored.
- Shared or downloaded: show a concise localized success message.
- Native share canceled with `AbortError`: return to idle without showing an error.
- Generation or download failure: retain the feature row and show a localized retry message.
- Individual image failure: silently substitute its placeholder and continue.

The action must remain keyboard accessible and expose progress/success/error feedback through an appropriate live region.

## Localization

Add paired Thai and English messages for the feature title, description, action, progress, success, and retry states. Text rendered inside the image follows the active page language. The exported filename is stable and safe, for example `gl-orbit-library.png`.

## Testing

### Client utility

- limits poster input to the first three favorites;
- produces a 1080×1350 PNG Blob;
- substitutes placeholders for missing or failed avatar/poster images;
- succeeds with no favorites and no avatar;
- revokes temporary object URLs after fallback download.

### Svelte component

- passes the correct identity, counts, and latest three favorites to generation;
- disables the action and prevents duplicate generation while busy;
- shares an `image/png` file when native file sharing is supported;
- downloads when native file sharing is unavailable;
- treats `AbortError` as cancellation rather than failure;
- renders localized success and retry feedback.

### Browser verification

- Profile Library at mobile and desktop widths;
- light and dark themes;
- keyboard focus and minimum touch target;
- generated PNG dimensions, legibility, poster fallback, and absence of private data;
- native share where browser support permits and download fallback otherwise.

## Rollout and Future Extension

This version requires no migration, environment variable, external service, or production database action. Later versions may add format selection, poster selection, captions, themes, or server-rendered images, but none belong in this scope.
