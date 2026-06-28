import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const appHtml = readFileSync('src/app.html', 'utf-8');

describe('viewport keyboard behavior', () => {
	it('does not globally opt into interactive-widget viewport resizing', () => {
		expect(appHtml).not.toContain('interactive-widget=resizes-content');
	});
});
