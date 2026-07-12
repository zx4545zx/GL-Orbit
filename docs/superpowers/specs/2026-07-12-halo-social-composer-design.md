# Halo social composer design

## Goal

Make the Halo composer feel like a compact social-feed publisher while preserving GL-Orbit's warm coral, lavender, and plum visual language.

## Experience

- Use the selected compact composer direction: avatar, focused text field, concise toolbar, and a rounded primary post action.
- A post may contain text, images, a source URL, or any combination. A URL is optional.
- Toolbar actions expose image selection, an emoji picker, and the optional source-link field.
- Pasting or entering a supported URL resolves a preview automatically after a short debounce. The preview is visible beneath the composer before publication.
- Chosen images appear locally as removable thumbnails. They are not uploaded during selection or preview.

## Publication flow

1. The user creates content and optionally selects images or enters a source URL.
2. The client validates image count, type, and size before enabling publication.
3. On `โพสต์`, the composer becomes busy and input is locked.
4. The application creates the moment, uploads selected image files, then associates their resulting URLs with that moment.
5. On success, clear the composer and refresh or prepend the published moment in the feed.
6. On failure, preserve text, source URL, local images, and preview state. Show an actionable Thai error and allow retry.

## Components and boundaries

- `MomentComposer.svelte`: interaction state, local image previews, URL debounce, validation feedback, and publication orchestration.
- A focused image-picker component: file selection, thumbnail rendering, removal, and accessible labels.
- A focused emoji-picker component: emits a selected emoji without owning composer content.
- Existing embed-preview/resolution code: resolves only when a URL is present; no change to the fallback-link behavior.
- Moments API: accept optional source URLs and image metadata. A dedicated upload endpoint owns file validation and storage; it is called only after the create request begins.

## States and accessibility

- Empty, composing, resolving URL, preview-ready, uploading, publishing, and failure states have explicit UI feedback.
- Toolbar buttons are 44px touch targets with visible focus states and Thai labels.
- Local images include filename-based accessible text and a clear remove action.
- Loading and failure feedback uses a polite live region.

## Error handling

- Unsupported or oversized images are rejected before post submission.
- URL-resolution failure leaves the optional URL editable and does not prevent a text/image-only post.
- Create or upload failure retains all composer input. If creation succeeds but an upload fails, report the partial failure and provide retry behavior that does not duplicate the text post.

## Verification

- Component tests cover URL debounce, optional URL behavior, local image selection/removal, and disabled/busy controls.
- API tests cover text-only, image-only, URL-only, and combined publications plus invalid uploads.
- Manual checks cover keyboard navigation, mobile layout, preview rendering, and preserved input after failure.

## Scope

This work does not add reactions, comments, or external-media uploading before the user presses `โพสต์`.
