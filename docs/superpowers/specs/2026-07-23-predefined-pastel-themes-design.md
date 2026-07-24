# Predefined Pastel Themes Design

**Status:** Approved
**Date:** 2026-07-23

## Summary

Replace the current light/dark switch with a rectangular header **Theme** swatch menu. The menu offers exactly four predefined, full-palette pastel light themes:

| Theme | Palette direction |
| --- | --- |
| **Orbit** (default) | cream, coral, lavender, mint |
| **Space** | powder blue, periwinkle, lilac, soft cyan |
| **Sakura** | blush, pale pink, lavender, soft rose |
| **Love** | peach cream, baby pink, soft red-coral, lilac |

There is no dark theme and no user-created/custom theme flow. Every theme uses the same semantic design tokens, with readable plum/gray text and borders selected to meet contrast requirements.

## Goals

- Give users four cohesive pastel visual modes without exposing arbitrary color controls.
- Make theme choice discoverable and usable from the global header.
- Persist the selected theme across visits and authenticated surfaces.
- Apply the active palette globally, including admin and chat routes.
- Keep component styling token-based so themes do not require per-component overrides.
- Preserve rectangular Orbit Editorial geometry and accessible interaction states.

## User Experience

The header contains a rectangular `Theme` control. Activating it opens a compact swatch menu with one option per theme. Each option shows a representative palette swatch, theme name, and selected/current indicator.

- Current theme is identified by text and a non-color indicator; color alone is never the only state signal.
- The control and options have visible hover, focus-visible, pressed, and disabled states.
- Keyboard behavior follows a standard menu pattern: `Enter`/`Space` opens or selects, `ArrowUp`/`ArrowDown` moves, `Home`/`End` jumps, `Escape` closes and restores focus to the trigger, and `Tab` exits the menu.
- Focus remains visibly contained and never depends on a pastel background for visibility.
- Selecting a theme applies it immediately and closes the menu. Selection is announced through an accessible status message or equivalent state change.
- The menu is usable at narrow widths without covering essential navigation or creating horizontal overflow.

## Theme Contract

Themes are named values, not arbitrary color maps:

```ts
type ThemeName = 'orbit' | 'space' | 'sakura' | 'love';
```

Each theme supplies the complete semantic token set required by the application. At minimum, the contract covers:

- page/background and elevated surface colors;
- primary, secondary, and accent colors;
- readable plum and gray foregrounds;
- default and strong borders/dividers;
- links, focus rings, selection, success, warning, and error states;
- interactive control backgrounds/foregrounds;
- overlays and muted text.

Raw palette values may exist only in the theme definitions. Components consume semantic CSS custom properties such as `--orbit-paper`, `--orbit-surface`, `--orbit-line`, `--orbit-line-strong`, and semantic accent tokens. Every foreground/background pairing used for text, controls, icons conveying meaning, and focus indicators must be contrast-checked for all four themes. Pastel accents must not be used as the sole text color when contrast is insufficient; use plum or gray foreground tokens instead.

## Architecture and Data Flow

1. Define the four theme palettes and semantic token mapping in the existing global styling/theme layer.
2. Add a small typed theme state utility/store that exposes the allowed `ThemeName` values, current selection, setter, and fallback behavior. No API accepts arbitrary color values.
3. Render the theme state on the root document element (for example, a `data-theme` attribute) so global CSS variables switch consistently before descendants render.
4. Mount the header Theme swatch menu in the shared application/header layout used by localized public pages, admin, and chat. It must not be duplicated per route.
5. On first client startup, read the persisted theme key. Validate it against the four-value allowlist; invalid, missing, or unavailable values resolve to `orbit`.
6. Apply the validated theme immediately, then persist later user selections in the existing client preference mechanism (local storage or the project’s established preference path). Persistence failures do not block theme application.
7. If authenticated preference synchronization already exists, it may mirror the same allowlisted theme name; client startup must remain functional when the network or server is unavailable. The server must never trust or render arbitrary token input.

Theme changes are presentation-only. They must not reload the page, alter route data, change authorization, or affect chat/admin behavior beyond visual tokens.

## Components

- **Theme state utility:** typed allowlist, default, read/validate/write operations, and a stable reactive value.
- **Header Theme control:** rectangular button with accessible name and expanded state.
- **Theme swatch menu:** four keyboard-navigable options, swatch plus text label, selected marker, and focus management.
- **Global theme stylesheet:** complete semantic token definitions for each theme and shared contrast-safe component tokens.
- **Root/layout integration:** applies the active theme across all route groups, including `/admin` and `/chat`.

Avoid adding a new generic card/pill system. Swatches may use compact rectangular color blocks; surrounding controls remain rectangular and use existing borders/focus treatments.

## Error and Fallback Behavior

- Unknown persisted value → use Orbit and overwrite the invalid value when persistence is available.
- Missing browser storage, storage quota/security exception, or unavailable preference endpoint → apply the selected theme for the current session and continue without a blocking error.
- Malformed theme configuration at build/runtime → use the complete Orbit token set; do not partially mix palettes.
- Theme menu rendering failure → retain Orbit CSS defaults and keep the rest of the header/application usable.
- A failed remote preference save must not revert an already-applied local selection; surface only a non-blocking status if the product’s notification pattern supports it.

## Scope

### In scope

- Four complete pastel light palettes listed above.
- Replacement of the existing light/dark switch with the global rectangular Theme swatch menu.
- Keyboard/focus/current-state accessibility behavior.
- Persisted selection and allowlist validation.
- Global token application across public, admin, and chat surfaces.
- Contrast-safe plum/gray typography, borders, controls, and focus indicators.
- Tests for state, persistence, menu behavior, token coverage, and representative route coverage.

### Non-goals

- Dark theme support.
- User-generated, custom, or arbitrary color themes.
- Per-page or per-component theme selection.
- Theme scheduling, automatic system-theme detection, or time-based switching.
- Changing content, layout architecture, permissions, localization, chat behavior, or admin workflows.
- Introducing a new dependency or replacing the existing styling framework.

## Test Plan

1. **Theme state unit tests:** Orbit default; all four valid names; invalid/missing values; storage read/write failures; no arbitrary value accepted.
2. **Menu component tests:** accessible name/role/state; open/close; selected marker; keyboard navigation; Escape focus restoration; Tab exit; activation by Enter and Space; all four options selectable.
3. **Persistence tests:** selection survives remount/reload simulation; failed persistence still updates the active document theme.
4. **Token tests:** each theme defines every required semantic token; root theme attribute maps only to known palettes; no incomplete palette fallback or cross-theme leakage.
5. **Contrast/accessibility checks:** automated contrast assertions for representative text, controls, borders, links, and focus states in all themes; verify non-color current-state indicator and visible keyboard focus.
6. **Integration checks:** switch themes on a public page, admin route, and chat route; confirm the same root theme and readable styling apply without navigation or authorization changes.
7. **Responsive/manual checks:** narrow and desktop widths, light pastel surfaces, keyboard-only use, reduced motion, and both Thai/English labels where localized.
8. Run the nearest Vitest tests, `npm run check`, and `git diff --check` after implementation.

## Self-review

- “Orbit default” is explicit: it is the fallback and first-run selection.
- “Full-palette” is defined as complete semantic token coverage, avoiding partial accent swaps.
- The four themes are light-only; no system dark-mode branch or custom editor is implied.
- Persistence is specified without requiring a new backend contract; existing project preference infrastructure remains authoritative where present, with a client-safe fallback.
- Admin and chat are explicitly included in shared root/layout application and integration tests.
- Accessibility does not rely on pastel color contrast alone; text, borders, focus, labels, and current-state indicators are separately required.
