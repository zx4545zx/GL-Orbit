# Halo Composer Avatar Design

## Goal

Show the signed-in user's profile image in the Halo moment composer.

## Behavior

- When `page.data.user.avatarUrl` exists, render it inside the existing 40px circular avatar area.
- Size the image to fill the circle and crop it with `object-cover`.
- When no profile image exists, retain the current uppercase username-initial fallback.
- Keep the avatar decorative (`alt=""`), since the composer already identifies the current user through the signed-in session.

## Scope

Change only `src/lib/components/moments/MomentComposer.svelte`. No schema, API, upload-flow, or shared-component changes.

## Validation

Run the focused project check after the change and inspect the resulting diff.
