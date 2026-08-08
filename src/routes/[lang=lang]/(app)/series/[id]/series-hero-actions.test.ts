import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/routes/[lang=lang]/(app)/series/[id]/+page.svelte', 'utf8');

describe('series hero action states', () => {
	it('keeps pressed library actions visibly distinct through their ARIA state', () => {
		expect(page).toContain(".sd-btn-like[aria-pressed='true']");
		expect(page).toContain('background: var(--orbit-coral);');
		expect(page).toContain('border-color: var(--orbit-coral-dark);');
	});

	it('normalizes the compact share icon to the hero action control shape', () => {
		expect(page).toContain('.sd-btn-like > div)');
		expect(page).toContain('border-radius: var(--orbit-radius-control);');
	});

	it('centers the icon-only share action without residual spacing below 390px', () => {
		expect(page).toContain(".sd-btn-like[aria-haspopup='menu'])");
		expect(page).toContain('justify-content: center;');
		expect(page).toContain('gap: 0;');
		expect(page).toContain('padding: 0;');
		expect(page).toContain(".sd-btn-like[aria-haspopup='menu'] > div)");
		expect(page).toContain('margin: 0;');
	});
});
