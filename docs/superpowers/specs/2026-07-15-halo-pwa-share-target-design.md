# Halo PWA share target design

## Goal

Let installed GL-Orbit PWAs receive a shared link and accompanying text from applications and browsers that implement the Web Share Target standard. Open a dedicated Halo compose page with the shared fields ready for review and publishing.

## Scope

- Add a Web Share Target declaration to the generated PWA manifest.
- Receive `title`, `text`, and `url` at `/[lang]/halo/compose`.
- Provide a dedicated full-page Moment composer without the Halo feed.
- Preserve the received share payload while an unauthenticated user completes login.
- Send a successfully published Moment back to the Halo feed.
- Change mobile Bottom Nav's create link from the inline composer (`/halo#compose`) to the compose page.
- Point other Halo create entry points to the compose page for a consistent flow.

## Out of scope

- Receiving shared files or images.
- Supporting browsers that do not implement Web Share Target.
- Removing the existing inline composer from the Halo feed.
- Adding automated tests.

## User flow

1. A supporting source application shares title, text, and/or URL to GL-Orbit.
2. The PWA opens `/[lang]/halo/compose`.
3. The compose page fills the Moment body from non-duplicate shared title/text and the source URL from a valid shared HTTPS URL.
4. If the user lacks a session, GL-Orbit saves the payload briefly, redirects to login, and restores it after successful login.
5. The user may edit the body and link, add supported images, tag series, or cancel.
6. Publishing uses the existing Moment creation and media-upload flow.
7. On success, the app returns to `/[lang]/halo`, where the new Moment is visible after data invalidation.

## Architecture

### PWA manifest

Configure `share_target` for a GET action targeting the localized compose page. Map the Web Share Target fields to query parameters for `title`, `text`, and `url`.

### Share payload handoff

The compose route validates and normalizes the incoming parameters before use:

- Combine non-empty title and text once in the body, preserving readable separation.
- Accept only valid `https:` URLs for the link field.
- Ignore malformed URLs rather than block composing a text-only Moment.

Persist normalized payload in a short-lived, server-managed cookie before an authentication redirect. The login return destination contains only the compose route, not the shared content. The composer consumes and clears the temporary payload after it is restored, cancelled, published, or expires.

### Dedicated compose page

Extract or extend the existing `MomentComposer` so it can accept initial body/link values and a completion destination. Render it in a new `/halo/compose` route with focused page chrome and a cancel action. The existing Halo feed keeps its inline composer with empty initial values and current behavior.

### Navigation

Update the Halo create links, including the mobile Bottom Nav control, to `/[lang]/halo/compose`. The page is available to signed-in and signed-out users; signed-out shared flows redirect directly to login before editing.

## Error behavior

- An unsupported browser does not offer GL-Orbit as a share target; normal Halo navigation remains available.
- Invalid or unsupported share fields are ignored without preventing access to the compose page.
- Preview lookup failures retain the typed/shared URL so the user can edit or remove it.
- Existing publish failures retain composer state, as today.

## Validation

No automated tests requested. Validate the implementation with the project type check and manual inspection of the supported share flow, login return, successful publish redirect, and mobile create link.
