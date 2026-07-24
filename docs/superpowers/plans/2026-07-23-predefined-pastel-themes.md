# Predefined Pastel Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the light/dark toggle with four allowlisted, persisted pastel themes available from the shared global header and applied consistently to public, admin, and chat surfaces.

**Architecture:** Keep theme state in the existing `$lib/theme.svelte.ts` runes module and keep the pre-paint selection in `static/theme-init.js`. Define complete semantic palettes in `src/app.css` under `data-theme="orbit|space|sakura|love"`; components consume those variables instead of raw palette values. Replace `ThemeToggle.svelte` with one shared rectangular menu component rendered by `Navigation.svelte`, while root layout integration ensures the document attribute exists for every route group.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript 5.8 strict, Tailwind CSS 4, Vitest 4, Testing Library Svelte, Paraglide Thai/English messages.

## Global Constraints

- Themes are exactly `ThemeName = 'orbit' | 'space' | 'sakura' | 'love'`; Orbit is the default and fallback.
- All four themes are light-only; do not retain dark-theme behavior, system-theme detection, theme scheduling, or arbitrary/custom color input.
- Raw palette values may exist only in the theme definitions; components consume complete semantic CSS custom properties.
- Every theme must define the complete semantic token set: page/background, elevated surface, primary/secondary/accent, plum/gray foregrounds, default/strong borders, links, focus, selection, success, warning, error, controls, overlays, muted text, and existing shadow/rail tokens where used.
- Persist only the allowlisted theme name using the existing client preference mechanism; storage or remote preference failures must never block or revert the already-applied theme.
- Invalid, missing, unavailable, or malformed persisted/configured values resolve to the complete Orbit palette; never partially mix palettes.
- Theme changes are presentation-only: no reload, route-data change, authorization change, chat behavior change, or admin workflow change.
- Header control and menu remain rectangular, use existing Orbit borders/focus treatments, and do not introduce generic card/pill UI or dependencies.
- Current state must have text and a non-color indicator; focus, hover, pressed, disabled, reduced-motion, and keyboard behavior must be visible and accessible.
- Keep Thai and English labels in `messages/th.json` and `messages/en.json`; compile generated Paraglide output with `npm run check` and do not hand-edit generated files.
- Do not run database migrations, seed commands, or add dependencies.

---

## File Map

- Modify `src/lib/theme.svelte.ts` — typed allowlist, complete fallback-safe state API, document application, persistence, and testable storage helpers.
- Modify `static/theme-init.js` — synchronous first-paint allowlist validation and Orbit fallback; no `prefers-color-scheme` branch.
- Modify `src/app.css` — Orbit, Space, Sakura, and Love complete semantic token definitions; remove dark remaps and make global selectors token-based.
- Create `src/lib/components/ThemeMenu.svelte` — shared trigger/menu, four swatches, current marker, live status, focus management, and menu keyboard behavior.
- Modify `src/lib/components/Navigation.svelte` — render `ThemeMenu` once in the shared header instead of `ThemeToggle`.
- Modify `src/routes/[lang=lang]/(app)/menus/+page.svelte` — replace the obsolete light/dark settings section with the shared theme menu or a theme summary that exposes the same four choices without a second selector.
- Modify `src/routes/[lang=lang]/(chat)/+layout.svelte` — replace hard-coded chat surface colors with semantic theme tokens so chat follows the root palette.
- Modify `src/routes/[lang=lang]/admin/+layout.svelte` — replace hard-coded white surfaces and rounded theme-insensitive controls where needed with semantic tokens; do not duplicate the global menu.
- Modify `src/routes/+layout.svelte` — add the document-level theme initialization/effect only if required by the final state API; preserve route-group-independent application.
- Modify `messages/th.json` and `messages/en.json` — localized Theme trigger, four names, current/selected announcements, and status copy.
- Create `src/lib/theme.test.ts` — state, allowlist, persistence failure, document application, and token-contract tests.
- Create `src/lib/components/ThemeMenu.test.ts` — menu roles, state, activation, navigation, focus restoration, and all four selections.
- Create `src/lib/theme-css.test.ts` — theme selector/token coverage and no dark/system/custom branches.
- Create `src/routes/theme-integration.test.ts` — representative public/admin/chat root-attribute and no-navigation behavior checks.

## Interfaces

Use these names and types consistently across tasks:

```ts
export type ThemeName = 'orbit' | 'space' | 'sakura' | 'love';
export const THEME_NAMES: readonly ThemeName[] = ['orbit', 'space', 'sakura', 'love'];
export const DEFAULT_THEME: ThemeName = 'orbit';
export const THEME_STORAGE_KEY = 'theme';

export function isThemeName(value: unknown): value is ThemeName;
export function parseThemeName(value: unknown): ThemeName;
export function readStoredTheme(storage?: Storage): ThemeName;
export function applyTheme(theme: ThemeName): void;
export function setTheme(theme: ThemeName, persist?: boolean, storage?: Storage): void;
export const themeState: { theme: ThemeName };
```

`ThemeMenu.svelte` consumes `themeState`, `THEME_NAMES`, `setTheme`, and localized labels. Its public props remain minimal:

```ts
let { className = '' }: { className?: string } = $props();
```

Each menu option uses `role="menuitemradio"`, `aria-checked`, a visible theme name, a compact rectangular swatch, and a text/shape current marker. The trigger uses `aria-haspopup="menu"`, `aria-expanded`, and an accessible localized name.

## Implementation Tasks

### Task 1: Lock the typed theme contract and first-paint fallback

**Files:**
- Modify: `src/lib/theme.svelte.ts`
- Modify: `static/theme-init.js`
- Test: `src/lib/theme.test.ts`

**Interfaces:**
- Produces the exported `ThemeName`, `THEME_NAMES`, `DEFAULT_THEME`, `THEME_STORAGE_KEY`, `isThemeName`, `parseThemeName`, `readStoredTheme`, `applyTheme`, `setTheme`, and `themeState` contract above.
- Removes `Theme`, `toggleTheme`, and `watchSystemTheme`; no caller may select `light` or `dark`.

- [ ] **Step 1: Write failing state tests**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_THEME, THEME_NAMES, isThemeName, parseThemeName, readStoredTheme } from '$lib/theme.svelte.js';

describe('theme contract', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('exposes exactly four names with Orbit as default', () => {
    expect(THEME_NAMES).toEqual(['orbit', 'space', 'sakura', 'love']);
    expect(DEFAULT_THEME).toBe('orbit');
    expect(isThemeName('orbit')).toBe(true);
    expect(isThemeName('dark')).toBe(false);
  });

  it.each([undefined, null, '', 'dark', 'LIGHT', '#fff'])('falls back for %s', (value) => {
    expect(parseThemeName(value)).toBe('orbit');
  });

  it('reads only allowlisted stored values', () => {
    expect(readStoredTheme({ getItem: () => 'sakura' } as Storage)).toBe('sakura');
    expect(readStoredTheme({ getItem: () => 'dark' } as Storage)).toBe('orbit');
  });

  it('survives storage read failure', () => {
    expect(readStoredTheme({ getItem: () => { throw new DOMException('blocked'); } } as Storage)).toBe('orbit');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/lib/theme.test.ts`

Expected: FAIL because the new four-theme exports do not exist and the current implementation still accepts light/dark.

- [ ] **Step 3: Implement the minimal typed state API**

Use `browser` guards and a `try/catch` around every storage operation. `parseThemeName` must return `DEFAULT_THEME` for all unknown values. `setTheme` must assign state and call `applyTheme` before best-effort persistence. `applyTheme` must set `document.documentElement.dataset.theme` and update `meta[name="theme-color"]` from the selected theme's safe metadata color without reading arbitrary CSS input. Invalid stored values must be overwritten with `orbit` when storage is writable.

```ts
export type ThemeName = 'orbit' | 'space' | 'sakura' | 'love';
export const THEME_NAMES = ['orbit', 'space', 'sakura', 'love'] as const satisfies readonly ThemeName[];
export const DEFAULT_THEME: ThemeName = 'orbit';
export const THEME_STORAGE_KEY = 'theme';

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_NAMES as readonly string[]).includes(value);
}

export function parseThemeName(value: unknown): ThemeName {
  return isThemeName(value) ? value : DEFAULT_THEME;
}
```

- [ ] **Step 4: Replace the pre-paint script with the same allowlist**

`static/theme-init.js` must synchronously select `orbit`, accept only `orbit|space|sakura|love`, write `document.documentElement.dataset.theme`, overwrite an invalid stored value when possible, and never inspect `prefers-color-scheme`.

```js
(function () {
  var theme = 'orbit';
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'orbit' || stored === 'space' || stored === 'sakura' || stored === 'love') {
      theme = stored;
    } else if (stored !== null) {
      localStorage.setItem('theme', 'orbit');
    }
  } catch (e) {}
  document.documentElement.dataset.theme = theme;
})();
```

- [ ] **Step 5: Run focused state tests**

Run: `npm test -- src/lib/theme.test.ts`

Expected: PASS for default, all valid names, invalid/missing values, and read failures.

### Task 2: Define and verify complete pastel semantic palettes

**Files:**
- Modify: `src/app.css`
- Test: `src/lib/theme-css.test.ts`

**Interfaces:**
- Consumes `ThemeName` values from Task 1.
- Produces selectors `[data-theme='orbit']`, `[data-theme='space']`, `[data-theme='sakura']`, and `[data-theme='love']`, each defining the same semantic token set.

- [ ] **Step 1: Write failing CSS contract tests**

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/app.css', 'utf8');
const themes = ['orbit', 'space', 'sakura', 'love'] as const;
const tokens = ['--orbit-paper', '--orbit-paper-deep', '--orbit-surface', '--orbit-ink', '--orbit-muted', '--orbit-line', '--orbit-line-strong', '--orbit-coral', '--orbit-coral-dark', '--orbit-coral-soft', '--orbit-lavender', '--orbit-mint', '--orbit-shadow', '--orbit-shadow-raised', '--orbit-rail', '--orbit-link', '--orbit-focus', '--orbit-selection', '--orbit-success', '--orbit-warning', '--orbit-error', '--orbit-overlay'];

describe('theme CSS contract', () => {
  it.each(themes)('%s has every semantic token', (theme) => {
    const block = css.match(new RegExp(`\\[data-theme='${theme}'\\]\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
    for (const token of tokens) expect(block).toContain(token);
  });

  it('contains no dark theme or system-theme branch', () => {
    expect(css).not.toMatch(/data-theme=['"]dark['"]|prefers-color-scheme/);
  });
});
```

- [ ] **Step 2: Run the CSS test and verify it fails**

Run: `npm test -- src/lib/theme-css.test.ts`

Expected: FAIL because only root light tokens and dark remaps currently exist.

- [ ] **Step 3: Replace the current root/dark token blocks with four full palettes**

Keep token names used throughout the app, add the missing semantic tokens above, and use readable plum/gray foregrounds for text and icons. Set each theme's background/surface/accent direction to Orbit cream/coral/lavender/mint, Space powder blue/periwinkle/lilac/cyan, Sakura blush/pale pink/lavender/soft rose, and Love peach cream/baby pink/soft red-coral/lilac. Remove every `[data-theme='dark']` selector and dark-only utility remap. Keep `color-scheme: light` for all themes and retain non-theme layout variables.

- [ ] **Step 4: Convert global hard-coded theme remaps to semantic variables**

Update remaining selectors in `src/app.css` that currently target `.bg-white`, `.text-plum`, raw hex backgrounds, or dark-only colors so they use the semantic token layer. Preserve existing layout, motion, and component behavior; do not add per-theme component overrides.

- [ ] **Step 5: Run token and style validation**

Run: `npm test -- src/lib/theme-css.test.ts && git diff --check`

Expected: PASS; no whitespace errors and every theme has equal token coverage with no dark selector.

### Task 3: Build the accessible rectangular swatch menu

**Files:**
- Create: `src/lib/components/ThemeMenu.svelte`
- Modify: `messages/th.json`
- Modify: `messages/en.json`
- Test: `src/lib/components/ThemeMenu.test.ts`

**Interfaces:**
- Consumes `themeState`, `THEME_NAMES`, and `setTheme` from `$lib/theme.svelte.js`.
- Produces one trigger and one `role="menu"` containing four `role="menuitemradio"` options; selecting an option calls `setTheme(name)` and closes the menu.

- [ ] **Step 1: Add failing component tests**

Cover: trigger accessible name and `aria-expanded`; closed/open state; exactly four options; `aria-checked` and visible current marker; Enter/Space activation; ArrowUp/ArrowDown wrapping; Home/End; Escape focus restoration; Tab close/exit; each theme selection; status announcement; rectangular classes and no `ThemeToggle` import.

```ts
it('opens, exposes four radio menuitems, and marks Orbit current', async () => {
  const user = userEvent.setup();
  render(ThemeMenu);
  const trigger = screen.getByRole('button', { name: /theme/i });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await user.click(trigger);
  expect(screen.getByRole('menu')).toBeVisible();
  expect(screen.getAllByRole('menuitemradio')).toHaveLength(4);
  expect(screen.getByRole('menuitemradio', { name: /orbit/i })).toHaveAttribute('aria-checked', 'true');
});

it('moves focus and restores it after Escape', async () => {
  const user = userEvent.setup();
  render(ThemeMenu);
  const trigger = screen.getByRole('button', { name: /theme/i });
  await user.click(trigger);
  await user.keyboard('{ArrowDown}{End}{Escape}');
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run component tests and verify they fail**

Run: `npm test -- src/lib/components/ThemeMenu.test.ts`

Expected: FAIL because `ThemeMenu.svelte` does not exist.

- [ ] **Step 3: Add localized message keys**

Add matching Thai and English keys for `theme_trigger`, `theme_current`, `theme_selected`, `theme_orbit`, `theme_space`, `theme_sakura`, `theme_love`, and `theme_status`. Use localized labels in the component; do not hard-code user-facing copy.

- [ ] **Step 4: Implement the menu with explicit focus behavior**

Use `$state` for `open` and `activeIndex`, a trigger `HTMLButtonElement` binding, and an array of option button bindings. On open, focus the current option. Handle `Enter`/`Space`, ArrowUp/ArrowDown, Home/End, Escape, and Tab on the menu. Close on outside pointer/click without stealing focus. On selection, call `setTheme`, close, return focus to the trigger, and update a visually-hidden `role="status"` message. Use `aria-controls`, `aria-labelledby`, `aria-activedescendant` only where maintained consistently; avoid roving tabindex bugs by giving the active option `tabindex="0"` and others `-1`. Use rectangular `border`, `bg-[var(--orbit-surface)]`, `focus-visible:ring-2`, `touch-target`, and compact rectangular swatches.

- [ ] **Step 5: Run component tests**

Run: `npm test -- src/lib/components/ThemeMenu.test.ts`

Expected: PASS for all four options, activation, keyboard navigation, current marker, status, and focus restoration.

### Task 4: Integrate one global control and remove the old selector

**Files:**
- Modify: `src/lib/components/Navigation.svelte`
- Modify: `src/routes/[lang=lang]/(app)/menus/+page.svelte`
- Modify: `src/routes/+layout.svelte`
- Modify: `src/lib/theme.test.ts`

**Interfaces:**
- Consumes `ThemeMenu.svelte` as the sole shared selector.
- Produces one global menu in the existing public navigation and a root document theme for every localized route group; menu settings no longer expose light/dark or a duplicate toggle.

- [ ] **Step 1: Add failing integration assertions**

Assert `Navigation.svelte` imports/renders `ThemeMenu` and not `ThemeToggle`; menus page contains all four theme labels but no `dark`/`light` branch; root layout or startup path initializes `document.documentElement.dataset.theme` without navigation.

```ts
it('uses the shared ThemeMenu instead of the light/dark toggle', () => {
  const source = readFileSync('src/lib/components/Navigation.svelte', 'utf8');
  expect(source).toContain("import ThemeMenu from './ThemeMenu.svelte'");
  expect(source).not.toContain('ThemeToggle');
});
```

- [ ] **Step 2: Run the integration test and verify it fails**

Run: `npm test -- src/routes/theme-integration.test.ts`

Expected: FAIL against the current `ThemeToggle` import and dark/light settings branch.

- [ ] **Step 3: Replace the public header control**

In `src/lib/components/Navigation.svelte`, replace the `ThemeToggle` import and render with `<ThemeMenu />` in the existing auth/control area. Do not duplicate it in route pages or admin/chat layouts. Preserve language, notification, profile, auth links, and route navigation.

- [ ] **Step 4: Update menu settings**

Replace the existing `themeState.theme === 'dark'` icon/copy and `<ThemeToggle />` in `src/routes/[lang=lang]/(app)/menus/+page.svelte` with a theme summary showing the localized current theme and either `<ThemeMenu />` or a link/description pointing to the header menu; ensure the page has no light/dark assumptions and still works in both languages.

- [ ] **Step 5: Ensure route-independent initialization**

Keep `static/theme-init.js` in the document head path used by the app. If the final code needs a reactive client effect, add it once in `src/routes/+layout.svelte` and guard it with `browser`/`onMount`; never add route-specific initialization. Verify admin and chat inherit the same root `data-theme` rather than rendering another selector.

- [ ] **Step 6: Run integration assertions**

Run: `npm test -- src/routes/theme-integration.test.ts src/lib/theme.test.ts`

Expected: PASS; changing a theme updates the root attribute without calling navigation or reload APIs.

### Task 5: Make admin and chat surfaces consume the palette

**Files:**
- Modify: `src/routes/[lang=lang]/admin/+layout.svelte`
- Modify: `src/routes/[lang=lang]/(chat)/+layout.svelte`
- Modify: `src/app.css`
- Test: `src/routes/theme-integration.test.ts`

**Interfaces:**
- Consumes the root `data-theme` and semantic CSS variables from Task 2.
- Produces readable admin/chat surfaces under all four themes without duplicated theme state or route behavior changes.

- [ ] **Step 1: Add failing route-surface assertions**

Assert admin and chat layout sources do not hard-code `bg-white`/`bg-[#f7f7f8]` for their primary surfaces, and representative rendered roots expose theme-token classes/styles. Assert switching from public to `/admin` or `/chat` does not reset `document.documentElement.dataset.theme`.

- [ ] **Step 2: Run focused integration tests and verify the relevant assertions fail**

Run: `npm test -- src/routes/theme-integration.test.ts`

Expected: FAIL because admin uses `bg-white` and chat uses `bg-[#f7f7f8]`.

- [ ] **Step 3: Replace surface colors with semantic tokens**

Use `bg-[var(--orbit-paper-deep)]`, `bg-[var(--orbit-surface)]`, `text-[var(--orbit-ink)]`, and `border-[var(--orbit-line)]`/`border-[var(--orbit-line-strong)]` in the admin and chat layout roots and headers. Preserve admin layout widths, sidebar state, mobile overlay, chat scroll locking, and all existing transitions. Remove rounded decorative treatment only where directly touched by the theme control requirement; do not redesign unrelated controls.

- [ ] **Step 4: Run route and accessibility checks**

Run: `npm test -- src/routes/theme-integration.test.ts src/lib/components/ThemeMenu.test.ts && npm run check`

Expected: PASS; Svelte/TypeScript/i18n validation succeeds with no new diagnostics.

### Task 6: Validate persistence, contrast, and regression coverage

**Files:**
- Modify: `src/lib/theme.test.ts`
- Modify: `src/lib/theme-css.test.ts`
- Modify: `src/lib/components/ThemeMenu.test.ts`
- Modify: `src/routes/theme-integration.test.ts`

**Interfaces:**
- Consumes all completed theme APIs, CSS selectors, and shared menu behavior.
- Produces executable coverage for every requirement in the approved spec's Test Plan.

- [ ] **Step 1: Add persistence failure tests**

Test quota/security failures on `setItem`, invalid-value overwrite failure, remount/reload simulation with each valid theme, and assertion that `setTheme('space')` still updates `document.documentElement.dataset.theme` when persistence throws.

```ts
it('applies a selection even when persistence fails', () => {
  const storage = { setItem: () => { throw new DOMException('quota'); } } as Storage;
  expect(() => setTheme('space', true, storage)).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('space');
});
```

Keep the optional `storage` parameter limited to tests/internal callers; the theme value itself remains restricted to `ThemeName`.

- [ ] **Step 2: Add contrast assertions for all four themes**

Parse the concrete CSS values for representative `--orbit-ink`/paper, muted/surface, link/surface, control foreground/background, border/surface, and focus/surface pairs. Use a small local WCAG relative-luminance helper in the test; assert normal text pairs are at least 4.5:1, large text at least 3:1, and focus/border indicators meet the project’s visible non-text contrast target. Do not add a dependency.

- [ ] **Step 3: Add menu regression assertions**

Verify current state is conveyed by option text plus a marker/`aria-checked`, not color alone; trigger/menu/options have focus-visible styles; Escape restores trigger focus; Tab leaves the menu; reduced-motion CSS disables menu transitions where applicable; no option accepts a value outside `THEME_NAMES`.

- [ ] **Step 4: Add representative route assertions**

Cover one localized public page, `/th/admin/series`, and `/th/chat/<id>` using the existing route test conventions. Confirm all four theme names can be applied to the same root, no navigation/reload occurs, content/auth flags remain unchanged, and theme remains selected after route changes.

- [ ] **Step 5: Run the complete focused validation**

Run: `npm test -- src/lib/theme.test.ts src/lib/theme-css.test.ts src/lib/components/ThemeMenu.test.ts src/routes/theme-integration.test.ts`

Expected: PASS with coverage for state, persistence, keyboard behavior, token completeness, contrast, public/admin/chat integration, and no dark/custom branch.

### Task 7: Final project validation and manual acceptance checks

**Files:**
- No new files; inspect all implementation files listed in the File Map.

- [ ] **Step 1: Run the nearest Vitest suite**

Run: `npm test -- src/lib/theme.test.ts src/lib/theme-css.test.ts src/lib/components/ThemeMenu.test.ts src/routes/theme-integration.test.ts src/lib/components/pending-shell-removal.test.ts`

Expected: PASS; existing pending-shell guarantees remain intact.

- [ ] **Step 2: Run type, Svelte, and i18n validation**

Run: `npm run check`

Expected: PASS with generated Paraglide output updated only by the command if required; no hand edits to generated files.

- [ ] **Step 3: Run whitespace validation**

Run: `git diff --check`

Expected: no output and exit code 0.

- [ ] **Step 4: Perform manual responsive/accessibility checks**

Run: `npm run dev`

Check in a browser at narrow mobile and desktop widths, Thai and English, keyboard-only operation, reduced motion, and each of `orbit`, `space`, `sakura`, `love`: trigger discoverability, no horizontal overflow, menu containment, swatch plus text labels, selected marker, visible focus, Escape restoration, Tab exit, public/admin/chat readability, and persistence after reload. Confirm no dark option or system-theme change appears.

- [ ] **Step 5: Review the final diff scope**

Run: `git status --short && git diff --stat && git diff --check`

Expected: only the approved theme implementation files, message files, and focused tests are changed; this plan file itself is the only file changed in the planning assignment. Do not commit.

## Inline Self-Review

- **Spec coverage:** Four exact themes, Orbit fallback/default, complete semantic token contract, first-paint `data-theme`, persistence/failure behavior, shared public/admin/chat application, rectangular menu, all required keyboard interactions, non-color current indicator, Thai/English labels, contrast checks, representative integration tests, responsive/manual checks, and no dark/custom/system theme are assigned in Tasks 1–7.
- **Placeholder scan:** No `TBD`, `TODO`, “implement later”, “write tests for the above”, or undefined implementation handoff appears. Every code-changing task names exact files, interfaces, commands, and concrete snippets or required assertions.
- **Naming/type consistency:** `ThemeName`, `THEME_NAMES`, `DEFAULT_THEME`, `THEME_STORAGE_KEY`, `isThemeName`, `parseThemeName`, `readStoredTheme`, `applyTheme`, `setTheme`, `themeState`, and `ThemeMenu` are used consistently across the file map, interfaces, tests, and integration tasks.
- **Known existing-code alignment:** Plan replaces current `ThemeToggle`/`Theme` light-dark API, removes `watchSystemTheme`, updates `static/theme-init.js`, uses `Navigation.svelte` as the shared header mount, avoids duplicating controls in admin/chat, updates the menus settings branch, and addresses hard-coded admin/chat surfaces found during inspection.
