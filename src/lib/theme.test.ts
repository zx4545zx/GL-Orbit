// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEME_NAMES, isThemeName, parseThemeName, readStoredTheme, setTheme } from '$lib/theme.svelte.js';

describe('theme contract', () => {
 beforeEach(() => { document.documentElement.dataset.theme = 'orbit'; });
 it('exposes exactly four names', () => { expect(THEME_NAMES).toEqual(['orbit', 'space', 'sakura', 'love']); expect(DEFAULT_THEME).toBe('orbit'); expect(isThemeName('dark')).toBe(false); });
 it.each([undefined, null, '', 'dark', 'LIGHT', '#fff'])('falls back for %s', (value) => expect(parseThemeName(value)).toBe('orbit'));
 it('reads allowlisted values and survives failures', () => {
  expect(readStoredTheme({ getItem: () => 'sakura' } as unknown as Storage)).toBe('sakura');
  expect(readStoredTheme({ getItem: () => 'dark' } as unknown as Storage)).toBe('orbit');
  expect(readStoredTheme({ getItem: () => { throw new DOMException('blocked'); } } as unknown as Storage)).toBe('orbit');
 });
 it('applies before persistence failure', () => {
  expect(() => setTheme('space', true, { setItem: () => { throw new DOMException('quota'); } } as unknown as Storage)).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('space');
 });
});
