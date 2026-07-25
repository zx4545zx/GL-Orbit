// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEME_NAMES, isThemeName, parseThemeName, readStoredTheme, setTheme } from '$lib/theme.svelte.js';

describe('theme contract', () => {
 beforeEach(() => { document.documentElement.dataset.theme = 'fanzine'; });
 it('exposes exactly seven names with y2k default', () => { expect(THEME_NAMES).toEqual(['fanzine', 'midnight', 'y2k', 'sakura', 'ocean', 'candy', 'mission']); expect(DEFAULT_THEME).toBe('y2k'); expect(isThemeName('dark')).toBe(false); expect(isThemeName('orbit')).toBe(false); });
 it.each([undefined, null, '', 'dark', 'LIGHT', '#fff', 'orbit', 'space', 'love'])('falls back for %s', (value) => expect(parseThemeName(value)).toBe('y2k'));
 it('reads allowlisted values and survives failures', () => {
  expect(readStoredTheme({ getItem: () => 'sakura' } as unknown as Storage)).toBe('sakura');
  expect(readStoredTheme({ getItem: () => 'dark' } as unknown as Storage)).toBe('y2k');
  expect(readStoredTheme({ getItem: () => { throw new DOMException('blocked'); } } as unknown as Storage)).toBe('y2k');
 });
 it('applies before persistence failure', () => {
  expect(() => setTheme('ocean', true, { setItem: () => { throw new DOMException('quota'); } } as unknown as Storage)).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('ocean');
 });
});
