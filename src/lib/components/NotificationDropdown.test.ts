import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const sourcePath = resolve(__dirname, 'NotificationDropdown.svelte');
const source = readFileSync(sourcePath, 'utf-8');

/**
 * Find the dropdown panel <div> — the one with the dropdown container classes.
 * We match the line that contains the outer dropdown wrapper.
 */
function getDropdownPanelLine(): string {
	const lines = source.split('\n');
	// The dropdown panel is the div with classes starting with "absolute right-0 top-full"
	const panelLine = lines.find((l) =>
		l.includes('class=') && l.includes('absolute') && l.includes('right-0') && l.includes('top-full')
	);
	if (!panelLine) throw new Error('Could not locate dropdown panel div in source');
	return panelLine;
}

describe('NotificationDropdown dropdown panel background', () => {
	it('should NOT use glass-card class on the dropdown panel', () => {
		const panelLine = getDropdownPanelLine();
		// This assertion fails BEFORE the change (RED) because glass-card is currently present.
		expect(panelLine).not.toMatch(/\bglass-card\b/);
	});

	it('should use a solid background class (bg-white) on the dropdown panel', () => {
		const panelLine = getDropdownPanelLine();
		// After the change, bg-white replaces glass-card for a solid background.
		expect(panelLine).toMatch(/\bbg-white\b/);
	});
});

// Keep the original placeholder tests as secondary smoke tests
describe('NotificationDropdown source structure', () => {
	it('should render bell button', () => {
		expect(source).toContain('aria-label="การแจ้งเตือน"');
	});

	it('should open dropdown on click', () => {
		expect(source).toContain('onclick={openDropdown}');
	});
});
