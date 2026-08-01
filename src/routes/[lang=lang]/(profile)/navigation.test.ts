import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sidebar = readFileSync('src/routes/[lang=lang]/(profile)/+layout.svelte', 'utf8');
const profileServer = readFileSync(
	'src/routes/[lang=lang]/(profile)/profile/+page.server.ts',
	'utf8'
);
const memberMenu = readFileSync(
	'src/routes/[lang=lang]/(profile)/settings/+page.svelte',
	'utf8'
);

describe('member settings navigation', () => {
	it('links account and security sections to dedicated pages', () => {
		expect(sidebar).toContain('/account/profile');
		expect(sidebar).toContain('/security/password');
		expect(sidebar).toContain('/security/session');
	});

	it('uses the shared app bottom-nav style with remaining member pages in the menu', () => {
		expect(sidebar).toContain('shell-bottomnav safe-area-bottom');
		expect(sidebar).toContain('orbit-nav-item');
		expect(sidebar).toContain('orbit-nav-indicator');
		expect(sidebar).toContain('zine-nav-label');
		expect(sidebar).toContain("`/${lang}/settings`");
		expect(memberMenu).toContain("localizedHref('/subscriptions'");
		expect(memberMenu).toContain("localizedHref('/account/profile'");
		expect(memberMenu).toContain("localizedHref('/security/password'");
		expect(memberMenu).toContain("localizedHref('/security/session'");
	});

	it('redirects legacy profile query sections', () => {
		expect(profileServer).toContain("url.searchParams.get('tab') === 'account'");
		expect(profileServer).toContain("url.searchParams.get('section') === 'profile'");
		expect(profileServer).toContain("url.searchParams.get('section') === 'security'");
	});
});
