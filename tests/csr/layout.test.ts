import { describe, it, expect } from 'vitest';

describe('Root layout CSR configuration', () => {
	it('exports ssr = false to disable server-side rendering', async () => {
		// Import the actual layout module
		const mod = await import('../../src/routes/+layout.js');
		expect(mod.ssr).toBe(false);
	});
});
