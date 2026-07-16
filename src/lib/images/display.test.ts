import { describe, expect, it } from 'vitest';
import { getMediaDisplay } from './display.js';

describe('getMediaDisplay', () => {
	it.each([
		['poster', 'aspect-[2/3]', '160px'],
		['cover', 'aspect-[21/9]', '(min-width: 640px) 320px, 100vw'],
		['gallery', 'aspect-video', '(min-width: 640px) 240px, 100vw']
	] as const)('maps %s to preview geometry', (purpose, aspectClass, sizes) => {
		expect(getMediaDisplay(purpose)).toMatchObject({ aspectClass, sizes });
	});
});
