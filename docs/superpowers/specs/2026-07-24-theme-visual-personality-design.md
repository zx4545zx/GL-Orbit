# Theme Visual Personality Design

**Status:** Approved  
**Date:** 2026-07-24

## Summary

Extend the seven predefined themes beyond color by adding theme-level visual personality through shared primitives. The implementation must remain token-driven: shared buttons, inputs, cards/panels, menus, dialogs, badges, and navigation consume semantic tokens rather than receiving theme-specific markup or route overrides.

The personalities are:

| Theme | Visual direction |
| --- | --- |
| **Fanzine** (default) | Rectangular editorial structure, crisp borders, restrained offset shadow, strong typographic hierarchy |
| **Midnight** | Dark broadcast surface, hairline borders, subtle neon glow, tight measured motion |
| **Y2K** | Glossy retro panels, hard offset shadows, square geometry, playful tech emphasis |
| **Sakura** | Soft petal surfaces, washi-like quiet texture, gentle transitions, refined serif emphasis |
| **Ocean** | Cool calm surfaces, generous rounding, soft layered depth, smooth ease-out motion |
| **Candy** | Playful rounded geometry, colored offset shadows, bouncy easing, bold label emphasis |
| **Mission** | Control-room utilitarian structure, strong borders, condensed emphasis, instant precise motion |

Color selection, persistence, and the seven-name allowlist remain defined by the approved predefined pastel themes design. This spec adds only shared visual primitives and their application contract.

## Goals

- Make each preset immediately recognizable through shape, depth, typography emphasis, texture, and motion—not only hue.
- Keep one shared component system and one semantic token contract across all seven themes.
- Preserve Orbit Editorial grids, spacing, rectangular information hierarchy, and content density.
- Apply personality consistently to shared buttons, inputs, cards/panels, menus, dialogs, badges, and navigation.
- Maintain AA contrast, visible focus, 44px minimum interactive targets, responsive layouts, and reduced-motion support.
- Keep texture and decorative accents subordinate to readable content and interaction.

## Theme Primitive Contract

The existing theme root (`data-theme`) supplies semantic CSS custom properties. Add a complete visual primitive set for every theme; components must not branch on theme names.

Required token groups:

- **Radius:** control, surface, menu/dialog, and badge radii. Fanzine stays rectangular or minimally eased; Sakura and Ocean use soft/generous values; Candy uses the roundest approved values without turning every element into a pill; Y2K and Mission stay square.
- **Border:** default, strong, interactive, and focus border treatment, including width/style where needed. Borders must remain legible on each theme surface.
- **Shadow:** surface, raised, overlay, and interactive/pressed depth. Midnight may include a low-opacity neon glow; Candy may use a colored offset shadow. Shadows must not replace structural borders.
- **Font emphasis:** display/body family usage, heading weight, label weight, letter spacing, and optional decorative emphasis. Fanzine favors editorial contrast; Midnight favors measured weight; Sakura may use gentle serif emphasis; Mission may use condensed utilitarian emphasis; Candy may use lively emphasis while preserving Thai legibility.
- **Texture:** opt-in, low-opacity surface treatment and decorative accent assets. Texture must be non-interactive, clipped to its owner, absent from text/control hit areas, and removable when unsupported or unnecessary.
- **Motion:** enter/exit, hover/press, and theme-change durations/easings. Motion is finite and state-driven; no perpetual animation is introduced.

Example semantic names (exact naming may follow existing conventions):

```css
--orbit-radius-control
--orbit-radius-surface
--orbit-border-width
--orbit-border-style
--orbit-shadow-surface
--orbit-shadow-raised
--orbit-shadow-accent
--orbit-font-heading-weight
--orbit-font-label-weight
--orbit-texture-opacity
--orbit-motion-fast
--orbit-motion-standard
--orbit-motion-ease
```

All seven themes must define the full set. Missing or malformed primitive tokens fall back to the complete fanzine default primitive set, not a partial mixture.

## Component Application

Shared primitives apply at the component boundary:

- **Buttons:** radius, border, emphasis, hover/pressed depth, disabled treatment, and finite state transitions. Primary/accent backgrounds still require readable foregrounds.
- **Inputs:** control radius, border and focus ring, placeholder/label emphasis, error/success states, and motion-safe validation feedback. Minimum touch target remains 44px.
- **Cards/panels:** surface radius, border, elevation, optional theme texture, and heading emphasis. Content grids and spacing do not change by theme.
- **Menus/dialogs:** shared surface, radius, border, overlay, elevation, focus containment, and open/close transitions. Decorative texture never reduces dialog readability.
- **Badges:** compact radius and emphasis tokens; badges may be rounded but must not become the default shape for unrelated controls. Text or icon state must not rely on color alone.
- **Navigation:** shared rail/header/bottom-nav primitives, active indicator, border, focus, and finite transitions. Keep layout, ordering, safe-area behavior, and responsive breakpoints unchanged.

Decorative personality belongs in shared primitive layers or explicitly named shared accent components, not duplicated across pages. Fanzine heart-doodle accents and Sakura petal/washi accents are optional decoration around eligible surfaces; they must not alter semantics, layout flow, hit targets, or content order. Fanzine, Midnight, Y2K, Ocean, Candy, and Mission may omit decoration entirely.

## Architecture and Data Flow

1. Keep the existing typed `ThemeName` state and root `data-theme` selection as the single source of truth.
2. Extend the global theme stylesheet with visual primitive tokens beside each palette, preserving semantic color tokens and existing layout/spacing tokens.
3. Define shared component styles/utilities against semantic primitive tokens only. No component reads `data-theme` or compares a theme string.
4. Resolve primitive tokens through CSS inheritance from the root. The server-rendered default remains fanzine so first paint is complete and stable.
5. On client theme selection, update the root attribute; all shared primitives update through CSS without route reload, data reload, or authorization changes.
6. Keep texture/decorative layers in pseudo-elements or shared decorative components with `pointer-events: none`, bounded stacking contexts, and content-safe clipping.
7. Respect `prefers-reduced-motion: reduce` by reducing durations and disabling nonessential transforms/glows. Theme changes must still complete immediately and never depend on animation.

## Component Boundary

In scope: global theme primitive definitions, shared component styling, shared decoration hooks, root reduced-motion behavior, and tests that prove all seven themes satisfy the contract.

Out of scope for this change: page-by-page markup rewrites, route-specific personality classes, direct theme-name conditionals, and wholesale migration of legacy utility classes. Existing components should adopt primitives when they already use the shared boundary; legacy one-off styling remains untouched unless required to prevent a shared component regression.

## Errors and Fallbacks

- Unknown or missing theme name: existing fanzine default fallback remains authoritative.
- Missing visual token: use fanzine's corresponding default primitive token; never expose an unset CSS value that collapses component styling.
- Invalid token value or failed stylesheet/configuration load: retain usable fanzine default geometry, borders, focus, and readable typography.
- Unsupported texture or decorative asset: omit decoration and preserve the surface/content layer.
- Storage or preference sync failure: preserve the already-applied theme and primitive styling for the current session; do not block interaction.
- Reduced-motion preference or unsupported animation: use static states without functional loss.
- Decorative layer overflow or contrast risk detected: disable that decoration at the shared boundary rather than obscuring content.

## Accessibility and Responsive Requirements

- Verify AA contrast for text, icons conveying meaning, borders where required, controls, active states, and focus indicators in all seven themes.
- Focus-visible treatment must remain obvious on every surface and must not depend on shadow, texture, or pastel color alone.
- Preserve 44px minimum targets for buttons, navigation actions, menu options, and icon controls.
- Preserve existing grids, spacing, safe-area handling, keyboard behavior, and responsive breakpoints at narrow and wide widths.
- Keep Thai and English text legible with the selected font emphasis; decorative typography cannot replace labels.
- Texture, glow, and doodles must not create horizontal overflow, trap focus, intercept pointer events, or cover content.

## Test Plan

1. **Primitive contract tests:** assert all seven themes define every required radius, border, shadow, font-emphasis, texture, and motion token.
2. **Fallback tests:** malformed/missing visual tokens resolve to fanzine default primitives without partial cross-theme leakage.
3. **Shared component tests:** render representative buttons, inputs, cards/panels, menus, dialogs, badges, and navigation under each theme; verify semantic classes/tokens, states, labels, and focus behavior remain shared.
4. **Accessibility tests:** automated contrast assertions for representative foreground/background, border, active, error, and focus combinations; verify non-color state indicators.
5. **Motion tests:** reduced-motion mode removes perpetual animation and suppresses nonessential transforms/glows while preserving open/close and pressed-state behavior.
6. **Decoration tests:** texture and accents are pointer-inert, bounded, non-obstructive, and absent when unsupported; fanzine/sakura decoration does not alter layout or accessible names.
7. **Responsive/manual checks:** inspect mobile and desktop widths, light surfaces, keyboard-only navigation, focus visibility, Thai/English labels, and overflow.
8. Run nearest Vitest tests, `npm run check`, and `git diff --check` after implementation.

## Non-goals

- New themes, dark mode, custom theme editing, theme scheduling, or system-theme detection.
- New color palette or persistence behavior.
- Per-page theme selection or route-specific theme forks.
- Wholesale migration of legacy Tailwind/utilities or one-off page styling.
- Changing grids, spacing scale, content, navigation structure, route data, permissions, localization, or business behavior.
- Perpetual animation, animated backgrounds, interaction-blocking decoration, or decoration used as the sole state signal.
- New dependencies or replacement of the existing styling framework.

## Self-review

- “Beyond colors” is bounded by six primitive groups and explicit shared component surfaces.
- Fanzine remains the structural baseline; midnight, y2k, sakura, ocean, candy, and mission add personality without changing information architecture.
- Shared token consumption prevents theme-name conditionals and avoids wholesale legacy utility migration.
- Texture, heart/petal accents, glow, motion, and fallback behavior include explicit safety boundaries.
- Accessibility, responsive behavior, reduced motion, errors, tests, and non-goals are specified.
- No unresolved implementation decision changes product behavior; exact token names may follow existing CSS naming conventions while preserving the required contract.
