import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const source = readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8');

describe('login success state sync', () => {
	it('writes returned user into the shared store before navigating', () => {
		const submitSource = source.slice(source.indexOf('async function handleSubmit'));
		const setIdx = submitSource.indexOf('user.set(data.user)');
		const gotoIdx = submitSource.indexOf("await goto('/profile')");

		expect(setIdx).toBeGreaterThanOrEqual(0);
		expect(gotoIdx).toBeGreaterThanOrEqual(0);
		expect(setIdx).toBeLessThan(gotoIdx);
	});

	it('keeps the existing login error/loading behavior intact', () => {
		expect(source).toContain('กำลังเข้าสู่ระบบ...');
		expect(source).toContain('disabled={isLoading}');
	});
});
