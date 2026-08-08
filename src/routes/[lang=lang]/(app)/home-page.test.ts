import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homePage = readFileSync('src/routes/[lang=lang]/(app)/+page.svelte', 'utf8');
const css = readFileSync('src/app.css', 'utf8');

describe('home page shared editorial structure', () => {
	it('uses shared classes and tokens instead of hardcoded colors', () => {
		for (const token of ['sheet-section', 'section-head', 'hero-grid', 'zine-card', 'zine-tape', 'zine-schedule', 'zine-chip', 'zine-polaroid', 'zine-more', 'zine-kicker', 'zine-time', 'zine-sticker', 'orbit-badge']) {
			expect(homePage).toContain(token);
		}
		expect(homePage).toContain('var(--orbit-');
	});

	it('contains no hardcoded legacy palette classes or hex colors', () => {
		expect(homePage).not.toContain('bg-cream');
		expect(homePage).not.toContain('bg-coral-light');
		expect(homePage).not.toContain('bg-lavender-light');
		expect(homePage).not.toMatch(/\btext-plum(?:-light)?\b/);
		expect(homePage).not.toMatch(/\bbg-white\b/);
		expect(homePage).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
	});

	it('never branches on the active theme', () => {
		expect(homePage).not.toContain('data-theme');
		expect(homePage).not.toMatch(/\btheme\s*===/);
	});

	it('keeps canonical and JSON-LD SEO contracts', () => {
		expect(homePage).toContain('buildCanonicalUrl');
		expect(homePage).toContain('localizedPath');
		expect(homePage).toContain('<link rel="canonical" href={canonicalUrl} />');
		expect(homePage).toContain('jsonLdScript');
	});

	it('keeps the live countdown ticking logic', () => {
		expect(homePage).toContain('requestAnimationFrame');
		expect(homePage).toContain('activeCountdowns');
		expect(homePage).toContain('nextOnAir');
	});

	it('shows latest news before featured series', () => {
		const newsSection = homePage.indexOf('aria-labelledby="home-news-title"');
		const featuredSection = homePage.indexOf('aria-labelledby="home-featured-title"');

		expect(homePage).toContain('NewsCarousel');
		expect(homePage).toContain('data.latestNews');
		expect(newsSection).toBeGreaterThan(-1);
		expect(featuredSection).toBeGreaterThan(newsSection);
	});

	it('keeps Orbit Halo hidden while the feature is closed', () => {
		expect(homePage).not.toContain('{#if latestMoment}');
		expect(homePage).not.toContain('m.home_halo_title()');
		expect(homePage).not.toContain('/halo');
		expect(homePage).toContain('Orbit Halo section hidden');
	});
});

describe('app.css per-theme personality contract', () => {
	const themes = ['midnight', 'y2k', 'sakura', 'ocean', 'candy', 'mission'];

	it.each(themes)('%s decorates the shared section-header class', (theme) => {
		expect(css).toContain(`[data-theme='${theme}'] .zine-tape`);
	});

	it.each(themes)('%s decorates the shared shell and homepage classes', (theme) => {
		expect(css).toContain(`[data-theme='${theme}'] .zine-card`);
		expect(css).toContain(`[data-theme='${theme}'] .zine-polaroid`);
		expect(css).toContain(`[data-theme='${theme}'] .shell-bottomnav`);
	});

	it('keeps zine decorations token-driven with reduced-motion handling', () => {
		expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*\.zine-polaroid/);
		expect(css).toContain('var(--orbit-font-display');
	});
});
