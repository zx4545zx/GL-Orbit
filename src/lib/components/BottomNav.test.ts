import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const bottomNav = readFileSync('src/lib/components/BottomNav.svelte', 'utf8');
const navigation = readFileSync('src/lib/components/Navigation.svelte', 'utf8');
const appLayout = readFileSync('src/routes/[lang=lang]/(app)/+layout.svelte', 'utf8');
const css = readFileSync('src/app.css', 'utf8');

describe('shared responsive navigation boundary', () => {
	 it('keeps mobile links tokenized without changing responsive behavior', () => {
		expect(bottomNav).toContain('orbit-navigation');
		expect(bottomNav).toContain('orbit-nav-item');
		expect(bottomNav).toContain('orbit-nav-indicator');
		expect(bottomNav).toContain('touch-target');
		expect(bottomNav).toContain('md:hidden');
		expect(bottomNav).toContain('safe-area-bottom');
		expect(bottomNav).toContain("bottomNavHidden ? 'translate-y-full'");
		expect(bottomNav).toContain("aria-current={active ? 'page' : undefined}");
	});

	it('uses the same home/calendar/explore/news order in both nav bars', () => {
		for (const source of [bottomNav, navigation]) {
			const positions = [
				source.indexOf('m.nav_home()'),
				source.indexOf('m.nav_calendar()'),
				source.indexOf('m.nav_explore()'),
				source.indexOf('m.nav_whats_on()')
			];
			expect(positions.every((position) => position >= 0)).toBe(true);
			expect(positions).toEqual([...positions].sort((a, b) => a - b));
			expect(source).not.toContain('m.nav_chat()');
			expect(source).not.toContain('m.nav_halo()');
		}
		expect(bottomNav.indexOf('m.nav_menus()')).toBeGreaterThan(bottomNav.indexOf('m.nav_whats_on()'));
		expect(navigation).not.toContain('m.nav_menus()');
	});

	it('keeps the desktop nav row in the shell header', () => {
		expect(navigation).toContain('shell-topbar');
		expect(navigation).toContain('shell-navrow');
		expect(navigation).toContain('shell-navlink');
		expect(navigation).toContain('orbit-nav-item');
		expect(navigation).toContain('orbit-nav-indicator');
		expect(navigation).toContain("aria-current={active ? 'page' : undefined}");
		expect(navigation).toContain('hidden md:flex');
		expect(navigation).toContain('zine-brand');
		expect(navigation).toContain('m.home_zine_tagline()');
		// Desktop row covers explore; member-only destinations live in the profile shell.
		expect(navigation).toContain('m.nav_explore()');
		expect(navigation).not.toContain('m.nav_halo()');
		expect(navigation).not.toContain('m.nav_notifications()');
		expect(navigation).not.toContain('fixed top-');
	});

	it('keeps the homepage topbar and hides it only on non-home mobile routes', () => {
		expect(navigation).toContain('page.url.pathname === `/${page.data.lang}`');
		expect(navigation).toContain('page.url.pathname === `/${page.data.lang}/`');
		expect(navigation).toContain('class:shell-topbar-mobile-hidden={!isHomepage}');
		expect(css).toMatch(
			/@media \(max-width: 767px\)[\s\S]*\.shell-topbar-mobile-hidden\s*\{\s*display: none;/
		);
	});

	it('keeps both nav bars token-driven without legacy palette classes', () => {
		for (const source of [bottomNav, navigation]) {
			expect(source).toContain('var(--orbit-');
			expect(source).not.toContain('data-theme');
			expect(source).not.toMatch(/\b(?:bg|text|border)-(?:plum|cream|coral|lavender|mint)(?:-light|-dark)?\b/);
		}
	});

	it('wraps every (app) page in the shared full-bleed shell', () => {
		expect(appLayout).toContain('<Navigation />');
		expect(appLayout).toContain('<Footer />');
		expect(appLayout).toContain('<BottomNav {bottomNavHidden} />');
		expect(appLayout).toContain('{@render children()}');
		expect(appLayout).toContain('mobile-bottom-safe-space');
		expect(appLayout).not.toContain('md:pt-24');
	});

	it('defines reduced-motion-safe navigation recipes', () => {
		expect(css).toMatch(/\.orbit-navigation\s*\{/);
		expect(css).toMatch(/\.orbit-nav-item\s*\{/);
		expect(css).toMatch(/\.orbit-nav-active\s*\{/);
		expect(css).toMatch(/\.orbit-nav-indicator\s*\{/);
		expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*--orbit-motion-standard:\s*0\.01ms/);
		expect(css).toMatch(/\.shell-navrow\s*\{/);
		expect(css).toMatch(/\.shell-bottomnav\s*\{/);
	});
});
