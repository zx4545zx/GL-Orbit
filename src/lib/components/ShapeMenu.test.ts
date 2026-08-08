// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { tick } from 'svelte';
import ShapeMenu from './ShapeMenu.svelte';
import { setShape } from '$lib/shape.svelte.js';

describe('ShapeMenu', () => {
	afterEach(cleanup);

	it('opens two labelled radio options and selects rounded', async () => {
		setShape('sharp', false);
		render(ShapeMenu);
		const trigger = screen.getByRole('button', { name: /shape|รูปทรง/i });
		trigger.click();
		await tick();
		expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);
		expect(screen.getByRole('menuitemradio', { name: /sharp|เหลี่ยม/i }).getAttribute('aria-checked')).toBe('true');
		screen.getByRole('menuitemradio', { name: /rounded|มน/i }).click();
		await tick();
		expect(document.documentElement.dataset.shape).toBe('rounded');
	});

	it('supports roving focus', async () => {
		setShape('sharp', false);
		render(ShapeMenu);
		screen.getByRole('button', { name: /shape|รูปทรง/i }).click();
		await tick();
		const options = screen.getAllByRole('menuitemradio');
		await fireEvent.keyDown(options[0], { key: 'ArrowDown' });
		expect(document.activeElement).toBe(options[1]);
	});
});
