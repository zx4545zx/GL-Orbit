import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const rootLayout = readFileSync('src/routes/+layout.svelte', 'utf8');

describe('installed PWA interaction regressions', () => {
	it('keeps every navigation feedback layer non-interactive', () => {
		expect(rootLayout).toContain('class="pointer-events-none fixed top-0 left-0 right-0 z-[60]"');
		expect(rootLayout).toMatch(/showRouteOverlay[\s\S]*class="pointer-events-none [^"]*"/);
		expect(rootLayout).not.toMatch(/showRouteOverlay[\s\S]*class="fixed inset-0/);
	});

	it('does not cancel touch movement globally in iOS standalone mode', () => {
		expect(rootLayout).not.toContain("window.addEventListener('touchmove'");
		expect(rootLayout).not.toContain('e.preventDefault()');
	});
});
