import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const layoutPath = resolve(__dirname, '../../src/routes/+layout.svelte');

describe('Root layout CSR configuration', () => {
	it('exports ssr = false to disable server-side rendering', async () => {
		// Import the actual layout module
		const mod = await import('../../src/routes/+layout.js');
		expect(mod.ssr).toBe(false);
	});
});

describe('Root layout loading bar — source-level regression', () => {
	it('loading bar only shows when pathname changes (not for same-path query-only navigation)', () => {
		const source = readFileSync(layoutPath, 'utf-8');
		// The loading bar conditional should compare pathnames so that
		// same-path query-only navigation does NOT trigger the loading bar.
		// Must check both navigating.to.url.pathname AND navigating.from.url.pathname
		expect(source).toContain('navigating.to.url.pathname');
		expect(source).toContain('navigating.from.url.pathname');
	});
});
