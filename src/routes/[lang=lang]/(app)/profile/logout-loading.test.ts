import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/routes/[lang=lang]/(app)/profile/+page.svelte', 'utf-8');

describe('profile logout loading state', () => {
	it('adds a loading flag and disables the logout button', () => {
		expect(source).toContain('let isLoggingOut = $state(false);');
		expect(source).toContain('disabled={isLoggingOut}');
	});

	it('shows loading text and spinner while logging out', () => {
		expect(source).toContain('m.profile_logout_loading()');
		expect(source).toContain('animate-spin');
	});

	it('uses client POST logout flow and invalidates SvelteKit data', () => {
		const logoutSource = source.slice(source.indexOf('async function handleLogout'));
		const normalized = logoutSource.replace(/\s+/g, ' ');

		expect(normalized).toContain("await fetch(localizedHref('/logout', page.data.lang), { method: 'POST' });");
		expect(normalized).toContain("await goto(localizedHref('/', page.data.lang), { invalidateAll: true });");
		expect(normalized).not.toContain('user.set(null)');
	});
});
