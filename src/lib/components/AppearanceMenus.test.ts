// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { tick } from 'svelte';
import ShapeMenu from './ShapeMenu.svelte';
import ThemeMenu from './ThemeMenu.svelte';

describe('appearance menus', () => {
	afterEach(cleanup);

	it('keeps theme and shape menus mutually exclusive and dismisses on click-away', async () => {
		render(ThemeMenu);
		render(ShapeMenu);

		const themeTrigger = screen.getByRole('button', { name: /theme|ธีม/i });
		const shapeTrigger = screen.getByRole('button', { name: /shape|รูปทรง/i });
		await fireEvent.click(themeTrigger);
		await tick();
		expect(themeTrigger.getAttribute('aria-expanded')).toBe('true');

		await fireEvent.click(shapeTrigger);
		await tick();
		expect(themeTrigger.getAttribute('aria-expanded')).toBe('false');
		expect(shapeTrigger.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);

		await fireEvent.click(document.body);
		await tick();
		expect(shapeTrigger.getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByRole('menu')).toBeNull();
	});
});
