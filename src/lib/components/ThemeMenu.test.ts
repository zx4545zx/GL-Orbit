// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { tick } from 'svelte';
import ThemeMenu from './ThemeMenu.svelte';
import { setTheme } from '$lib/theme.svelte.js';
describe('ThemeMenu', () => {
 afterEach(cleanup);
 it('opens seven labelled radio options with current marker', async () => {
  render(ThemeMenu);
  const trigger = screen.getByRole('button', { name: /theme|ธีม/i });
  trigger.click();
  await tick();
   expect(screen.getAllByRole('menuitemradio')).toHaveLength(7);
   expect(screen.getByRole('menu').classList.contains('orbit-menu')).toBe(true);
   expect(trigger.classList.contains('orbit-control')).toBe(true);
   expect(trigger.classList.contains('touch-target')).toBe(true);
  expect(screen.getByRole('menuitemradio', { name: /y2k|วายทูเค/i }).getAttribute('aria-checked')).toBe('true');
 });
  it('moves focus repeatedly and supports Home/End', async () => {
  setTheme('fanzine', false);
  render(ThemeMenu);
  screen.getByRole('button', { name: /theme|ธีม/i }).click();
  await tick();
  const options = screen.getAllByRole('menuitemradio');
   options[0].focus();
   options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
   await tick();
   expect(options[0].getAttribute('tabindex')).toBe('-1');
   expect(options[1].getAttribute('tabindex')).toBe('0');
   options[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
   await tick();
   expect(document.activeElement).toBe(options[2]);
  options[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  expect(document.activeElement).toBe(options[6]);
  options[6].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
   expect(document.activeElement).toBe(options[0]);
  });
  it('handles keyboard events dispatched on the focused menu item', async () => {
   setTheme('fanzine', false);
   render(ThemeMenu);
   screen.getByRole('button', { name: /theme|ธีม/i }).click();
   await tick();
   const options = screen.getAllByRole('menuitemradio');
   options[0].focus();
   await fireEvent.keyDown(options[0], { key: 'ArrowDown' });
   await tick();
   expect(document.activeElement).toBe(options[1]);
  });
});
