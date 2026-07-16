import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('./MomentCard.svelte', import.meta.url), 'utf8');

describe('MomentCard media gallery', () => {
	it('renders multiple uploaded images as an accessible carousel', () => {
		expect(component).toContain('aria-roledescription="carousel"');
		expect(component).toContain('showPreviousImage');
		expect(component).toContain('showNextImage');
		expect(component).toContain('images.length > 1');
		expect(component).toContain('aspect-[4/5]');
		expect(component).toContain('View full image');
		expect(component).toContain('Full-size image');
		expect(component.match(/aria-roledescription="carousel"/g)).toHaveLength(2);
	});
});
