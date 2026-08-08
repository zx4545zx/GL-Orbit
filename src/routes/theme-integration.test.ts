import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
describe('theme integration', () => {
 it('uses shared menu and token surfaces', () => {
    const nav = readFileSync('src/lib/components/Navigation.svelte', 'utf8');
  const chat = readFileSync('src/routes/[lang=lang]/(chat)/+layout.svelte', 'utf8');
  const admin = readFileSync('src/routes/[lang=lang]/admin/+layout.svelte', 'utf8');
    expect(nav).toContain("import ThemeMenu from './ThemeMenu.svelte'");
    expect(nav).toContain("import ShapeMenu from './ShapeMenu.svelte'");
  expect(nav).not.toContain('ThemeToggle');
  expect(chat).toContain('var(--orbit-paper-deep)');
  expect(admin).toContain('var(--orbit-paper-deep)');
 });
  it('pre-paint script allowlists theme and shape preferences', () => {
  const init = readFileSync('static/theme-init.js', 'utf8');
  expect(init).toContain("stored === 'fanzine'");
  expect(init).toContain("stored === 'ocean'");
    expect(init).not.toContain('prefers-color-scheme');
    expect(init).toContain("localStorage.getItem('shape')");
    expect(init).toContain("storedShape === 'rounded'");
    expect(init).toContain('document.documentElement.dataset.shape = shape');
 });
});
