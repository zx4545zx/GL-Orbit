# Theme Visual Personality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Extend the existing fanzine, midnight, y2k, sakura, ocean, candy, and mission theme roots with complete visual primitive tokens and apply those tokens at shared component boundaries without changing layout, theme selection, or semantics.

**Architecture:** Keep `ThemeName`, `THEME_NAMES`, `data-theme`, and fanzine SSR defaults in `src/lib/theme.svelte.ts` unchanged. Add one complete semantic primitive contract to `src/app.css`; every theme block defines or intentionally inherits every token. Component CSS consumes semantic tokens with non-cyclic fallbacks: each token has a concrete fanzine baseline, and theme-specific rules either override that baseline or inherit it from the root. Never use a token as its own fallback. Keep optional decoration in shared pseudo-elements/hooks with `pointer-events: none`, bounded clipping, and reduced-motion overrides.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript 5.8, Tailwind CSS 4, Vitest 4, Testing Library Svelte.

## Global Constraints

- Use exactly seven existing theme names: `fanzine`, `midnight`, `y2k`, `sakura`, `ocean`, `candy`, `mission`; do not add theme persistence, color, routing, or markup branches.
- Shared components must not read `data-theme`, compare theme strings, or receive theme-specific route classes.
- Preserve Orbit Editorial rectangular information hierarchy, existing grids, spacing, safe-area behavior, responsive breakpoints, keyboard behavior, and content density.
- Keep minimum interactive target `44px`, obvious `:focus-visible`, AA contrast, Thai/English legibility, and non-color state indicators.
- Texture, glow, hearts, and petals are optional, low-opacity, clipped, non-interactive, and must not affect layout, hit targets, accessible names, or overflow.
- Respect `prefers-reduced-motion: reduce`: remove perpetual animation and nonessential transforms/glows; keep state changes, open/close, and pressed behavior functional and immediate.
- Do not add dependencies, rewrite pages, migrate unrelated utilities, change business behavior, or commit.

## Current Shared Primitive Baseline

- `src/app.css` currently defines palette tokens in `:root` and `[data-theme='space']`, `[data-theme='sakura']`, `[data-theme='love']`; `src/lib/theme-css.test.ts` checks 22 palette tokens but no visual primitive contract.
- Existing shared recipes are `.orbit-surface`, `.orbit-control`, `.orbit-action`, `.glass-card`, `.glass-card-strong`, `.orbit-rail`, `.orbit-index`, `.touch-target`, `.noise-overlay`, and the global `:is(a, button, select, textarea):focus-visible` rule.
- `body * { border-radius: 0 !important; }` currently forces rectangular geometry; `.orbit-round-data` is the only current opt-in circle. The implementation must replace this with token-driven geometry while preserving Orbit’s rectangular values and circular-data exception.
- `ThemeMenu.svelte` owns menu keyboard behavior and currently uses palette utilities; `ConfirmDialog.svelte` owns portal, Escape, initial focus, and dialog semantics; `BottomNav.svelte` owns ordering, active path, safe-area layout, and responsive visibility; `NotificationBadge.svelte` owns the count label; `PasswordInput.svelte` owns label/input/toggle semantics.

### Bounded shared-category inventory

Apply personality only at these shared boundaries. This inventory is not a broad legacy migration:

| Required category | Existing primitive/recipe or explicit new recipe | Concrete boundary |
| --- | --- | --- |
| Buttons | `.orbit-control`, `.orbit-action`, `.touch-target` | `ThemeMenu.svelte` controls and `PasswordInput.svelte` toggle |
| Inputs | `.orbit-control` + explicit new `.orbit-input` recipe | `PasswordInput.svelte` input only |
| Cards/panels | `.orbit-surface`, `.glass-card`, `.glass-card-strong` | existing shared surfaces; no page-by-page migration |
| Menus | explicit new `.orbit-menu` recipe | `ThemeMenu.svelte` menu container/items |
| Dialogs | explicit new `.orbit-dialog` recipe | `ConfirmDialog.svelte` dialog/overlay |
| Badges | `.orbit-index` + explicit new `.orbit-badge` recipe | `NotificationBadge.svelte` count element |
| Nav | `.orbit-rail` + explicit new `.orbit-navigation`, `.orbit-nav-item`, `.orbit-nav-indicator` recipes | `BottomNav.svelte` and `Navigation.svelte` only |

Every explicit recipe must be token-driven and limited to the named boundary components.

---

### Task 1: Define and test the complete visual primitive contract

**Files:**
- Modify: `src/app.css` — add primitive tokens beside each existing theme palette and shared semantic recipes/reduced-motion rules.
- Modify: `src/lib/theme-css.test.ts` — extend CSS contract and fallback assertions.
- Test: `src/lib/theme-css.test.ts`

**Interfaces:**
- Produces these exact semantic tokens for every theme: `--orbit-radius-control`, `--orbit-radius-surface`, `--orbit-radius-menu-dialog`, `--orbit-radius-badge`, `--orbit-border-width`, `--orbit-border-style`, `--orbit-border-default`, `--orbit-border-strong`, `--orbit-border-interactive`, `--orbit-border-focus`, `--orbit-shadow-surface`, `--orbit-shadow-raised`, `--orbit-shadow-overlay`, `--orbit-shadow-interactive`, `--orbit-shadow-accent`, `--orbit-font-display`, `--orbit-font-body`, `--orbit-font-heading-weight`, `--orbit-font-label-weight`, `--orbit-font-letter-spacing`, `--orbit-font-decorative`, `--orbit-texture-opacity`, `--orbit-texture-image`, `--orbit-accent-image`, `--orbit-motion-fast`, `--orbit-motion-standard`, `--orbit-motion-theme`, `--orbit-motion-ease` (28 tokens).
- Components consume semantic values with concrete, non-cyclic fallbacks; Orbit root values are authoritative when a theme block is malformed or missing. Theme blocks may inherit a root token intentionally, but must never self-reference.

- [x] **Step 1: Write failing contract tests.** Add `primitiveTokens` containing the exact 28 names above, assert the Orbit root contains every token, assert each themed block either defines each token or intentionally inherits it from the root, and assert `src/app.css` contains a concrete non-cyclic Orbit declaration for every primitive token.

```ts
const primitiveTokens = [
  '--orbit-radius-control', '--orbit-radius-surface', '--orbit-radius-menu-dialog', '--orbit-radius-badge',
  '--orbit-border-width', '--orbit-border-style', '--orbit-border-default', '--orbit-border-strong',
  '--orbit-border-interactive', '--orbit-border-focus', '--orbit-shadow-surface', '--orbit-shadow-raised',
  '--orbit-shadow-overlay', '--orbit-shadow-interactive', '--orbit-shadow-accent', '--orbit-font-display',
  '--orbit-font-body', '--orbit-font-heading-weight', '--orbit-font-label-weight', '--orbit-font-letter-spacing',
  '--orbit-font-decorative', '--orbit-texture-opacity', '--orbit-texture-image', '--orbit-accent-image',
  '--orbit-motion-fast', '--orbit-motion-standard', '--orbit-motion-theme', '--orbit-motion-ease'
] as const;

it.each(themes)('%s defines every visual primitive', (theme) => {
  const selector = theme === 'orbit' ? ':root' : `[data-theme='${theme}']`;
  const block = css.match(new RegExp(`${selector.replace('[', '\\[').replace(']', '\\]')}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
  for (const token of primitiveTokens) expect(block).toContain(token);
});

it('keeps Orbit fallbacks for every visual primitive', () => {
  for (const token of primitiveTokens) expect(css).toMatch(new RegExp(`${token}\\s*:\\s*[^;]+;`));
});
```

- [x] **Step 2: Run the focused test and verify it fails for missing primitive tokens.**

Run: `npm test -- src/lib/theme-css.test.ts`

Expected: FAIL because current theme blocks do not define the visual primitive tokens.

- [x] **Step 3: Add Orbit baseline tokens and complete values or intentional root inheritance to all four theme blocks.** Use Orbit rectangular/minimally eased values; Space medium radii/cool low-opacity glow; Sakura soft radii/quiet texture; Love the roundest non-pill radii and restrained colored offset shadow. Set unsupported decoration to `none`, keep `--orbit-texture-opacity` low, and keep all motion finite.

```css
:root {
  --orbit-radius-control: 0.125rem;
  --orbit-radius-surface: 0.125rem;
  --orbit-radius-menu-dialog: 0.125rem;
  --orbit-radius-badge: 0.25rem;
  --orbit-border-width: 1px;
  --orbit-border-style: solid;
  --orbit-border-default: var(--orbit-line);
  --orbit-border-strong: var(--orbit-line-strong);
  --orbit-border-interactive: var(--orbit-coral);
  --orbit-border-focus: var(--orbit-focus);
  --orbit-shadow-surface: var(--orbit-shadow);
   --orbit-shadow-raised: 0 6px 18px rgba(36, 21, 31, 0.12);
  --orbit-shadow-overlay: 0 12px 40px rgba(36, 21, 31, 0.16);
  --orbit-shadow-interactive: 0 2px 5px rgba(36, 21, 31, 0.12);
  --orbit-shadow-accent: none;
  --orbit-font-display: var(--font-display);
  --orbit-font-body: var(--font-body);
  --orbit-font-heading-weight: 700;
  --orbit-font-label-weight: 600;
  --orbit-font-letter-spacing: 0;
  --orbit-font-decorative: normal;
  --orbit-texture-opacity: 0;
  --orbit-texture-image: none;
  --orbit-accent-image: none;
  --orbit-motion-fast: 120ms;
  --orbit-motion-standard: 200ms;
  --orbit-motion-theme: 180ms;
  --orbit-motion-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [x] **Step 4: Add semantic shared recipes.** Update `.orbit-surface`, `.orbit-control`, `.orbit-action`, `.glass-card`, `.glass-card-strong`, `.orbit-rail`, focus-visible, and `.noise-overlay` to consume border/radius/shadow/font/texture tokens; add `.orbit-decoration` with `pointer-events: none`, `overflow: clip`, and `aria-hidden` usage contract. Preserve `.orbit-round-data` as the only circular data override.

- [x] **Step 5: Add reduced-motion and fallback safety rules.** Set primitive transitions to `0.01ms`, `--orbit-shadow-accent: none`, and remove transform/glow for `.orbit-decoration` under `prefers-reduced-motion: reduce`; keep existing animation suppression. Add `@supports not (overflow: clip)` fallback to `overflow: hidden`.

- [x] **Step 6: Run tests and CSS diff validation.**

Run: `npm test -- src/lib/theme-css.test.ts && git diff --check`

Expected: PASS; no whitespace errors.

### Task 2: Apply tokens to shared controls, inputs, cards, menus, dialogs, and badges

**Files:**
- Modify: `src/lib/components/ThemeMenu.svelte` — consume shared menu/control tokens without theme-name branches.
- Modify: `src/lib/components/ConfirmDialog.svelte` — consume shared dialog/overlay/focus tokens while retaining portal and keyboard behavior.
- Modify: `src/lib/components/PasswordInput.svelte` — consume control, label, focus, and touch-target tokens.
- Modify: `src/lib/components/NotificationBadge.svelte` — consume badge radius/emphasis/interactive shadow tokens and preserve count label.
- Modify: `src/lib/components/ThemeMenu.test.ts` — assert shared semantics and keyboard behavior remain unchanged.
- Modify: `src/lib/components/ConfirmDialog.test.ts` — render the dialog and assert role, modal state, labels, focus, and confirm/cancel behavior.
- Modify: `src/lib/components/PasswordInput.test.ts` — render the input and assert label association, control class, toggle name, and password visibility behavior.
- Modify: `src/lib/components/NotificationBadge.test.ts` — assert badge semantics and non-color count state.
- Test: `src/lib/components/ThemeMenu.test.ts`, `src/lib/components/ConfirmDialog.test.ts`, `src/lib/components/PasswordInput.test.ts`, `src/lib/components/NotificationBadge.test.ts`

**Interfaces:**
- `ThemeMenu` remains `{ className?: string }` and continues to call `setTheme(theme)` with `ThemeName` values.
- `ConfirmDialog` remains `Props { open: boolean; title?: string; message?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onconfirm?: () => void; oncancel?: () => void }`.
- `NotificationBadge` remains `{ count?: number }` and exposes `aria-label={m.notifications_badge_aria({ count })}`.

- [x] **Step 1: Add failing assertions that rendered shared components contain semantic boundary classes and retain labels/roles.** In executable rendered tests, assert menu role/menuitemradio and `aria-checked`, ConfirmDialog role/`aria-modal` plus visible title/message and confirm/cancel callbacks, PasswordInput label association/toggle name plus visibility toggle, and badge `aria-label`; assert no component source contains `data-theme` or `ThemeName` comparisons.

```ts
expect(screen.getByRole('menu')).toHaveClass('orbit-menu');
expect(screen.getByRole('dialog')).toHaveClass('orbit-dialog');
expect(screen.getByLabelText(/password/i)).toHaveClass('orbit-control');
expect(screen.getByLabelText(/notifications/i)).toHaveClass('orbit-badge');
```

- [x] **Step 2: Run focused component tests and verify the new boundary assertions fail.**

Run: `npm test -- src/lib/components/ThemeMenu.test.ts src/lib/components/ConfirmDialog.test.ts src/lib/components/PasswordInput.test.ts src/lib/components/NotificationBadge.test.ts`

Expected: FAIL only on missing semantic boundary classes before implementation.

- [x] **Step 3: Add `.orbit-menu`, `.orbit-dialog`, `.orbit-input`, `.orbit-badge`, and `.orbit-focusable` classes in `src/app.css` and apply them to the existing component elements.** Use token-driven `border`, `border-radius`, `box-shadow`, `transition`, `font-weight`, and focus styles; keep `min-h-11`/`.touch-target`, existing accessible labels, and existing state colors.

- [x] **Step 4: Remove direct component geometry/depth utilities only at these shared boundaries.** Replace `rounded-*`, `shadow-xl`, `shadow-lg`, and direct border color utilities in the named shared elements with semantic classes; do not touch unrelated page markup or legacy utilities.

- [x] **Step 5: Add decoration hooks only to eligible surfaces.** Add an `aria-hidden="true"` `.orbit-decoration` pseudo-element or child to shared card/dialog surfaces where the current component already has a decorative layer; decoration must not enter flex/grid flow, intercept pointer events, or change accessible names. Do not add decoration to controls or text hit areas.

- [x] **Step 6: Run focused tests and type checking.**

Run: `npm test -- src/lib/components/ThemeMenu.test.ts src/lib/components/ConfirmDialog.test.ts src/lib/components/PasswordInput.test.ts src/lib/components/NotificationBadge.test.ts && npm run check`

Expected: PASS; Svelte/TypeScript checker reports no new errors.

### Task 3: Apply tokens to shared responsive navigation

**Files:**
- Modify: `src/lib/components/BottomNav.svelte` — preserve item order, active path, safe-area spacing, and mobile breakpoint while consuming navigation tokens.
- Modify: `src/lib/components/Navigation.svelte` — apply the same shared rail/header/active/focus token boundary to desktop navigation without changing route structure.
- Modify: `src/lib/components/BottomNav` nearest existing tests or add `src/lib/components/BottomNav.test.ts` only if no current test covers active navigation — verify exact current accessible links and responsive classes.
- Test: `src/lib/components/BottomNav.test.ts` or nearest existing navigation test.

**Interfaces:**
- `BottomNav` remains `{ bottomNavHidden?: boolean }`.
- Navigation links retain existing `href`, `aria-current`, localized labels, `data-sveltekit-preload-data="hover"`, ordering, and safe-area classes.

- [x] **Step 1: Write failing navigation assertions.** Render the existing nav data and assert every interactive link has `touch-target`, shared focus class, and token boundary class; assert active state uses an indicator plus text/icon state, not color alone; assert `bottomNavHidden` still adds `translate-y-full`.

```ts
expect(screen.getByRole('link', { name: /home/i })).toHaveClass('orbit-nav-item', 'touch-target');
expect(screen.getByRole('link', { current: 'page' })).toHaveAttribute('aria-current', 'page');
expect(screen.getByRole('navigation')).toHaveClass('orbit-navigation');
```

- [x] **Step 2: Run the navigation test and verify it fails on missing token classes.**

Run: `npm test -- src/lib/components/BottomNav.test.ts`

Expected: FAIL on missing shared navigation classes, with existing route assertions still passing.

- [x] **Step 3: Add `.orbit-navigation`, `.orbit-nav-item`, `.orbit-nav-active`, and `.orbit-nav-indicator` semantic styles.** Use tokenized borders, surface/rail colors, focus border, active indicator, finite transitions, and `touch-target`; do not alter `md:hidden`, fixed positioning, safe-area padding, item ordering, or hide/show transform.

- [x] **Step 4: Apply the classes to both navigation components.** Remove only direct shared-boundary shadow/radius/focus utilities; retain localized labels, SVG state changes, `aria-current`, unread badge placement, and keyboard-native link behavior.

- [x] **Step 5: Add reduced-motion navigation assertions and run focused checks.** Confirm CSS disables nonessential transitions/transforms while active state and `aria-current` remain present.

Run: `npm test -- src/lib/components/BottomNav.test.ts src/lib/components/ThemeMenu.test.ts && npm run check && git diff --check`

Expected: PASS; no new checker or whitespace errors.

### Task 4: Add contract, fallback, accessibility, motion, and decoration coverage

**Files:**
- Modify: `src/lib/theme-css.test.ts` — validate complete token blocks, Orbit fallback shape, reduced-motion rules, and no dark/system branch.
- Create: `src/lib/components/theme-visual-personality.test.ts` — source-level shared-boundary and decoration safety tests.
- Test: `src/lib/components/theme-visual-personality.test.ts`, plus rendered `ConfirmDialog.test.ts` and `PasswordInput.test.ts` from Task 2.

**Interfaces:**
- Test fixtures use `THEME_NAMES` from `src/lib/theme.svelte.ts` and the exact `primitiveTokens` list from Task 1.
- Shared component source must contain no `data-theme` selector, theme-name comparison, `pointer-events-auto` on decoration, or perpetual animation declaration.

- [x] **Step 1: Write failing source-contract tests.** Assert all four themes define or inherit all 28 tokens; each primitive has a non-empty, non-self-referential Orbit declaration; `.orbit-decoration` has `pointer-events: none`, bounded overflow, and reduced-motion suppression; component source uses semantic classes and not theme-name conditionals. Keep rendered ConfirmDialog and PasswordInput behavior assertions in their dedicated executable tests; do not replace them with source-only checks.

```ts
it('keeps decoration inert and bounded', () => {
  expect(css).toMatch(/\.orbit-decoration[\s\S]*pointer-events:\s*none/);
  expect(css).toMatch(/\.orbit-decoration[\s\S]*overflow:\s*(clip|hidden)/);
  expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*\.orbit-decoration/);
});

it.each(['ThemeMenu.svelte', 'ConfirmDialog.svelte', 'PasswordInput.svelte', 'NotificationBadge.svelte', 'BottomNav.svelte'])('%s has no theme branch', (file) => {
  const source = readFileSync(`src/lib/components/${file}`, 'utf8');
  expect(source).not.toMatch(/data-theme|theme\s*===|theme\s*!==/);
});
```

- [x] **Step 2: Run the new test and verify it fails before the safety rules/classes are complete.**

Run: `npm test -- src/lib/components/theme-visual-personality.test.ts src/lib/theme-css.test.ts`

Expected: FAIL on any missing decoration/fallback/source-contract rule, never silently skipping a requirement.

- [x] **Step 3: Implement the smallest CSS/test changes that satisfy the contract.** Keep contrast-sensitive values tied to existing `--orbit-ink`, `--orbit-muted`, `--orbit-line-strong`, `--orbit-focus`, `--orbit-coral-dark`, `--orbit-error`, and `--orbit-success`; assert state text/icon/indicator exists for active, error, success, and badge states rather than relying on color alone.

- [x] **Step 4: Run the complete required validation.**

Run: `npm test -- src/lib/theme-css.test.ts src/lib/components/theme-visual-personality.test.ts src/lib/components/ThemeMenu.test.ts src/lib/components/ConfirmDialog.test.ts src/lib/components/PasswordInput.test.ts src/lib/components/NotificationBadge.test.ts && npm run check && git diff --check`

Expected: PASS; no new TypeScript/Svelte diagnostics and clean diff check.

### Task 5: Manual responsive and accessibility verification

**Files:**
- Verify only: `src/app.css`, `src/lib/components/ThemeMenu.svelte`, `src/lib/components/ConfirmDialog.svelte`, `src/lib/components/PasswordInput.svelte`, `src/lib/components/NotificationBadge.svelte`, `src/lib/components/BottomNav.svelte`, `src/lib/components/Navigation.svelte`.

**Interfaces:**
- No new code interface. Verification covers the existing `ThemeName` root selection and shared component boundaries.

- [ ] **Step 1: Start the dev server.**

Run: `npm run dev -- --host 127.0.0.1`

- [ ] **Step 2: Inspect `/th/` and `/en/` at 375px and 1440px widths under all four theme selections.** Confirm geometry/personality changes only through tokens; no horizontal overflow, layout shift, route reload, data reload, or changed nav ordering.

- [ ] **Step 3: Keyboard-test ThemeMenu and ConfirmDialog.** Confirm trigger focus returns after close, Arrow/Home/End/Escape behavior remains intact, dialog initial focus remains on cancel, focus rings are visible on every theme, and no decoration receives focus.

- [ ] **Step 4: Enable `prefers-reduced-motion: reduce` and repeat menu/dialog/nav interactions.** Confirm no perpetual animation, glow, or nonessential transform remains while open/close, pressed, active, and focus states still complete.

- [ ] **Step 5: Check Thai and English labels plus representative contrast states.** Verify heading/label weight remains readable, active/error/success/badge meaning includes text/icon/indicator, borders and focus indicators remain visible, and 44px targets remain present.

- [ ] **Step 6: Stop without committing.** Verify only `docs/superpowers/plans/2026-07-24-theme-visual-personality.md` is modified in this planning session; implementation workers must not commit this plan or implementation changes.

## Self-Review

- Spec coverage: Tasks 1–4 cover all six primitive groups, all named shared surfaces, Orbit fallback, unsupported decoration, reduced motion, no theme-name conditionals, and automated contract/accessibility/motion/decoration tests. Task 5 covers responsive/manual checks and both locales.
- Placeholder scan: no `TODO`, `TBD`, “implement later”, or unspecified test step appears; every change step names an exact path, interface, token, command, or assertion.
- Type consistency: `ThemeName` remains the existing union; `ThemeMenu`, `ConfirmDialog`, `NotificationBadge`, and `BottomNav` props remain unchanged; all later tasks reference the same 28-token `primitiveTokens` contract.
- Scope check: no page-by-page markup rewrites, route-specific personality classes, new themes, dependency changes, color persistence changes, or commits are included.
