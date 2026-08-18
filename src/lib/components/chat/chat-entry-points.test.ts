import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const navigationSource = readFileSync('src/lib/components/Navigation.svelte', 'utf-8');
const menusSource = readFileSync('src/routes/[lang=lang]/(app)/menus/+page.svelte', 'utf-8');
const homeSource = readFileSync('src/routes/[lang=lang]/(app)/+page.svelte', 'utf-8');
const settingsSource = readFileSync('src/routes/[lang=lang]/(profile)/settings/+page.svelte', 'utf-8');

describe('AI chat entry points', () => {
	it('keeps AI Chat hidden until the feature opens', () => {
		expect(navigationSource).not.toContain('/chat');
		expect(navigationSource).not.toContain('m.nav_chat()');
		expect(menusSource).not.toContain("localizedHref('/chat', page.data.lang)");
		expect(menusSource).not.toContain('{m.nav_chat()}');
		expect(homeSource).not.toContain('href="/{page.data.lang}/chat"');
		expect(settingsSource).not.toContain("localizedHref('/settings/ai', page.data.lang)");
		expect(settingsSource).not.toContain('m.ai_settings_title()');
	});
});
