import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./+layout.svelte', import.meta.url), 'utf8');

describe('Speed Insights injection', () => {
	it('does not inject the production analytics script during local development', () => {
		expect(source).toContain("import { dev } from '$app/environment';");
		expect(source).toContain('if (!dev) injectSpeedInsights();');
	});
});
