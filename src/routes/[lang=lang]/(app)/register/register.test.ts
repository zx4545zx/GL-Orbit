import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const source = readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8');

describe('register success state sync', () => {
	it('invalidates SvelteKit data before navigating to profile', () => {
		const submitSource = source.slice(source.indexOf('async function handleSubmit'));

		expect(submitSource).toContain("await goto(`${localizedHref('/profile', page.data.lang)}?push=1`, { invalidateAll: true });");
		expect(submitSource).not.toContain('user.set(data.user)');
	});

	it('keeps field error handling and the existing loading label', () => {
		expect(source).toContain('fieldErrors.email');
		expect(source).toContain('m.register_submit_loading()');
	});
});
