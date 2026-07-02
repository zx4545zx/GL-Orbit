# Soft Heart Orbit Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current GL-Orbit app mark with a warm, cute, minimal Soft Heart Orbit icon.

**Architecture:** Add one source SVG asset under `static/icons/`, use it in the Svelte navigation logo, and regenerate the app icon raster assets from the same visual source. Keep the existing app manifest and UI structure intact so the change is visual-only.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, static SVG/PNG/ICO assets, `npm run check` for validation.

---

## File Map

- Create: `static/icons/gl-orbit-logo.svg` — source Soft Heart Orbit vector logo.
- Modify: `src/lib/components/Navigation.svelte:111-121` — replace the current inline gradient/G mark with the new SVG image while keeping the GL-Orbit text label.
- Modify: `src/app.html:5` — prefer the SVG favicon source so browsers can use the crisp vector icon.
- Replace: `static/icons/gl-orbit-icon.png` — 600×600 raster logo asset.
- Replace: `static/icons/pwa-192x192.png` — PWA icon.
- Replace: `static/icons/pwa-512x512.png` — PWA icon.
- Replace: `static/icons/apple-touch-icon-180x180.png` — Apple touch icon.
- Keep: `static/icons/gl-orbit-icon.ico` — legacy fallback remains because no local ICO converter is available; modern browsers use the SVG favicon.

## Task 1: Add the source SVG logo

- [x] Create `static/icons/gl-orbit-logo.svg` as the source Soft Heart Orbit mark.
- [x] Verify the SVG file exists.

## Task 2: Use the SVG in the navigation logo

- [x] Replace the old inline `G` logo block in `src/lib/components/Navigation.svelte` with an image reference to `/icons/gl-orbit-logo.svg`.
- [x] Confirm the old orbit glyph markup is removed.

## Task 3: Prefer SVG favicon in app HTML

- [x] Update `src/app.html` to reference `/icons/gl-orbit-logo.svg` as the favicon.
- [x] Confirm the SVG favicon reference exists.

## Task 4: Regenerate raster app icons from the SVG

- [x] Render and replace `static/icons/gl-orbit-icon.png` at 600×600.
- [x] Render and replace `static/icons/pwa-192x192.png` at 192×192.
- [x] Render and replace `static/icons/pwa-512x512.png` at 512×512.
- [x] Render and replace `static/icons/apple-touch-icon-180x180.png` at 180×180.
- [x] Keep `static/icons/gl-orbit-icon.ico` unchanged as a legacy fallback.
- [x] Confirm raster dimensions with `file`.

## Task 5: Validate the project

- [x] Fix baseline check by adding an `i18n:compile` script and running it before `npm run check`.
- [x] Run final `npm run check` after logo integration.
- [x] Review changed files.

---

## Self-Review

- Spec coverage: the implementation plan covers SVG source, navigation integration, favicon reference, raster icon replacement, existing color constraints, and validation.
- Placeholder scan: no placeholder work remains.
- Type consistency: this change introduces no new TypeScript APIs.
