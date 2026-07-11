import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const navigationSource = readFileSync('src/lib/components/Navigation.svelte', 'utf-8');
const menusSource = readFileSync('src/routes/[lang=lang]/(app)/menus/+page.svelte', 'utf-8');
const homeSource = readFileSync('src/routes/[lang=lang]/(app)/+page.svelte', 'utf-8');

describe('hidden AI chat entry points', () => {
	it('does not expose a chat item in the primary navigation', () => {
		expect(navigationSource).not.toContain('href: `/${page.data.lang}/chat`');
	});

	it('does not expose a chat card on the menu page', () => {
		expect(menusSource).not.toContain("localizedHref('/chat', page.data.lang)");
	});

	it('does not expose a floating chat button on the home page', () => {
		expect(homeSource).not.toContain('href="/{page.data.lang}/chat"');
	});
});
