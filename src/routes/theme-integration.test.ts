import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
describe('theme integration', () => {
 it('uses shared menu and token surfaces', () => {
  const nav = readFileSync('src/lib/components/Navigation.svelte', 'utf8');
  const chat = readFileSync('src/routes/[lang=lang]/(chat)/+layout.svelte', 'utf8');
  const admin = readFileSync('src/routes/[lang=lang]/admin/+layout.svelte', 'utf8');
  expect(nav).toContain("import ThemeMenu from './ThemeMenu.svelte'");
  expect(nav).not.toContain('ThemeToggle');
  expect(chat).toContain('var(--orbit-paper-deep)');
  expect(admin).toContain('var(--orbit-paper-deep)');
 });
 it('pre-paint script is light-only allowlisted', () => {
  const init = readFileSync('static/theme-init.js', 'utf8');
  expect(init).toContain("stored === 'space'");
  expect(init).not.toContain('prefers-color-scheme');
 });
});
