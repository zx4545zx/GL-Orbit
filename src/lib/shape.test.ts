// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SHAPE, SHAPE_NAMES, isShapeName, parseShapeName, readStoredShape, setShape } from '$lib/shape.svelte.js';

describe('shape contract', () => {
	beforeEach(() => { document.documentElement.dataset.shape = 'sharp'; });

	it('exposes sharp and rounded with sharp as the default', () => {
		expect(SHAPE_NAMES).toEqual(['sharp', 'rounded']);
		expect(DEFAULT_SHAPE).toBe('sharp');
		expect(isShapeName('circle')).toBe(false);
	});

	it.each([undefined, null, '', 'circle', 'ROUND', 'pill'])('falls back for %s', (value) => {
		expect(parseShapeName(value)).toBe('sharp');
	});

	it('reads allowlisted values and survives failures', () => {
		expect(readStoredShape({ getItem: () => 'rounded' } as unknown as Storage)).toBe('rounded');
		expect(readStoredShape({ getItem: () => 'circle' } as unknown as Storage)).toBe('sharp');
		expect(readStoredShape({ getItem: () => { throw new DOMException('blocked'); } } as unknown as Storage)).toBe('sharp');
	});

	it('applies before persistence failure', () => {
		expect(() => setShape('rounded', true, { setItem: () => { throw new DOMException('quota'); } } as unknown as Storage)).not.toThrow();
		expect(document.documentElement.dataset.shape).toBe('rounded');
	});
});
