import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app.css', 'utf8');

describe('carousel touch CSS contract', () => {
	it('reserves horizontal drags for Splide without blocking page scroll or zoom', () => {
		const trackRule = css.match(/\.splide__track\s*\{([^}]*)\}/)?.[1] ?? '';

		expect(trackRule).toContain('touch-action: pan-y pinch-zoom');
	});
});
