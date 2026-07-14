import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const rootLayout = readFileSync('src/routes/+layout.svelte', 'utf8');

describe('installed PWA interaction regressions', () => {
	it('keeps only the non-interactive top navigation progress bar', () => {
		expect(rootLayout).toContain('class="pointer-events-none fixed top-0 left-0 right-0 z-[60]"');
		expect(rootLayout).not.toContain('showRouteOverlay');
		expect(rootLayout).not.toContain('route_loading_title');
		expect(rootLayout).not.toContain('role="status"');
	});

	it('does not cancel touch movement globally in iOS standalone mode', () => {
		expect(rootLayout).not.toContain("window.addEventListener('touchmove'");
		expect(rootLayout).not.toContain('e.preventDefault()');
	});
});
