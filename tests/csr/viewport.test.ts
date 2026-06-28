import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const appHtml = readFileSync('src/app.html', 'utf-8');

describe('viewport keyboard behavior', () => {
	it('opts into interactive-widget viewport resizing', () => {
		expect(appHtml).toContain('interactive-widget=resizes-content');
	});
});
