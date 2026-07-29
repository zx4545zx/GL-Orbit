import { describe, expect, it } from 'vitest';
import config from '../../../svelte.config.js';

describe('Svelte resolver warnings', () => {
	it('suppresses only vite-plugin-svelte missing exports.svelte warnings', () => {
		expect(config.vitePlugin?.experimental?.disableSvelteResolveWarnings).toBe(true);
	});
});
