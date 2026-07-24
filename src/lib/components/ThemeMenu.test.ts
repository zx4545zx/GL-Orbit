// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { tick } from 'svelte';
import ThemeMenu from './ThemeMenu.svelte';
describe('ThemeMenu', () => {
 afterEach(cleanup);
 it('opens four labelled radio options with current marker', async () => {
  render(ThemeMenu);
  const trigger = screen.getByRole('button', { name: /theme|ธีม/i });
  trigger.click();
  await tick();
  expect(screen.getAllByRole('menuitemradio')).toHaveLength(4);
  expect(screen.getByRole('menuitemradio', { name: /orbit/i }).getAttribute('aria-checked')).toBe('true');
 });
 it('moves focus repeatedly and supports Home/End', async () => {
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
  expect(document.activeElement).toBe(options[3]);
  options[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  expect(document.activeElement).toBe(options[0]);
 });
});
