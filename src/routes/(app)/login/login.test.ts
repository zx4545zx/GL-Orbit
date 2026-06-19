import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const source = readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8');

describe('login success state sync', () => {
	it('invalidates SvelteKit data before navigating to profile', () => {
		const submitSource = source.slice(source.indexOf('async function handleSubmit'));

		expect(submitSource).toContain("await goto('/profile', { invalidateAll: true });");
		expect(submitSource).not.toContain('user.set(data.user)');
	});

	it('keeps the existing login error/loading behavior intact', () => {
		expect(source).toContain('กำลังเข้าสู่ระบบ...');
		expect(source).toContain('disabled={isLoading}');
	});
});
