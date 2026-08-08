import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('./+page.svelte', import.meta.url)), 'utf8');

describe('Explore in-place query navigation', () => {
	it('keeps full-bleed hero structure square in rounded mode', () => {
		const squareHeroStart = source.indexOf('.xp-hero-splide,');
		const squareHeroEnd = source.indexOf('}', squareHeroStart);
		const squareHeroRule = source.slice(squareHeroStart, squareHeroEnd);

		expect(squareHeroRule).toContain('.xp-hero-splide :global(.splide__track)');
		expect(squareHeroRule).toContain('.xp-hero-splide :global(.splide__list)');
		expect(squareHeroRule).toContain('.xp-hero-slide');
		expect(squareHeroRule).toContain('.xp-hero-frame');
		expect(squareHeroRule).toContain('border-radius: 0 !important;');
	});

	it('lets hero content determine its height instead of locking it to viewport width', () => {
		expect(source).not.toContain('height: min(calc(100vw / 2.8), 500px);');
		expect(source).toMatch(/\.xp-hero-cover\s*\{[\s\S]*?position: absolute;[\s\S]*?inset: 0;/);
		expect(source).toMatch(/\.xp-hero-cover :global\(img\)\s*\{[\s\S]*?height: 100%;/);
	});

	it('autoplays only the hero while preserving accessible and reduced-motion defaults', () => {
		const heroStart = source.indexOf('heroSplide = new Splide');
		const heroEnd = source.indexOf('});', heroStart);
		const heroOptions = source.slice(heroStart, heroEnd);
		const railsStart = source.indexOf('const splide = new Splide');
		const railsEnd = source.indexOf('});', railsStart);
		const railOptions = source.slice(railsStart, railsEnd);

		expect(heroOptions).toContain('autoplay: true');
		expect(heroOptions).toContain('perPage: 1');
		expect(heroOptions).toContain('arrows: false');
		expect(heroOptions).not.toContain('pauseOnHover: false');
		expect(heroOptions).not.toContain('pauseOnFocus: false');
		expect(heroOptions).not.toContain('reducedMotion:');
		expect(railOptions).not.toContain('autoplay:');
	});

	it('renders a standalone localized overview control before exactly three connected tabs', () => {
		const overviewIndex = source.indexOf('class="xp-overview"');
		const navStart = source.indexOf('<nav class="xp-tabs"');
		const navEnd = source.indexOf('</nav>', navStart);
		const navSource = source.slice(navStart, navEnd);

		expect(overviewIndex).toBeGreaterThan(-1);
		expect(overviewIndex).toBeLessThan(navStart);
		expect(navSource).not.toContain('xp-overview');
		expect(source).toContain("currentLang === 'en' ? 'Overview' : 'ภาพรวม'");
		expect(source).toContain('href={`${langPrefix}/explore`}');
		expect(source).toContain("aria-current={mode === 'overview' ? 'page' : undefined}");
		expect(source).toContain("class:xp-overview--active={mode === 'overview'}");
		expect(source).toMatch(/const tabs = \$derived\(\[[\s\S]*?\{ id: 'series'[\s\S]*?\{ id: 'artists'[\s\S]*?\{ id: 'ships'[\s\S]*?\]\);/);
		expect(navSource).toContain('{#each tabs as tab (tab.id)}');
	});

	it('keeps mode, status, and search navigation client-side with stable scroll and focus', () => {
		expect(source).toContain("import { goto } from '$app/navigation';");
		expect(source).toContain("await goto(destination, { noScroll: true, keepFocus: true });");
		expect(source).toMatch(/onclick=\{\(event\) => navigateQuery\(event, tab\.href\)\}/);
		expect(source).toMatch(/onclick=\{\(event\) => navigateQuery\(event, chip\.href\)\}/);
		expect(source).toContain('onsubmit={submitSearch}');
	});

	it('opens the three overview rails as same-page query views', () => {
		for (const view of ['series', 'artists', 'ships']) {
			expect(source).toContain(`href="{langPrefix}/explore?view=${view}"`);
		}
		expect(source.match(/class="xp-rail-more" href="\{langPrefix\}\/explore\?view=(series|artists|ships)" onclick=\{\(event\) => navigateQuery\(event, `\$\{langPrefix\}\/explore\?view=\1`\)\}/g)).toHaveLength(3);
	});

	it('keys upcoming schedule cards by the unique schedule record', () => {
		expect(source).toContain('{#each data.upcoming as item (item.id)}');
		expect(source).toContain('src={item.poster}');
		expect(source).not.toContain('upcomingPoster(');
	});

	it('normalizes absolute form targets before skipping an unchanged search', () => {
		expect(source).toContain('const normalizedTarget = new URL(target, page.url);');
		expect(source).toContain('const destination = normalizedTarget.pathname + normalizedTarget.search;');
		expect(source).toContain('if (destination === page.url.pathname + page.url.search) return;');
		expect(source).toContain('await goto(destination, { noScroll: true, keepFocus: true });');
	});

	it('debounces input-driven search and replaces history while preserving focus and scroll', () => {
		expect(source).toContain('let searchQuery = $state(\'\');');
		expect(source).toContain('oninput={scheduleSearchUpdate}');
		expect(source).toContain('clearTimeout(searchTimer);');
		expect(source).toMatch(/searchTimer = setTimeout\(\(\) => \{[\s\S]*?updateSearchUrl\(searchQuery\);[\s\S]*?\}, 500\);/);
		expect(source).toContain('await goto(destination, { replaceState: true, noScroll: true, keepFocus: true });');
	});

	it('builds clean mode-aware search URLs and keeps status only for Series', () => {
		expect(source).toContain("params.set('view', activeSearchMode);");
		expect(source).toContain("if (search.trim()) params.set('search', search.trim());");
		expect(source).toContain("if (activeSearchMode === 'series' && data.seriesFilters.status !== 'ALL')");
		expect(source).toContain("params.set('status', data.seriesFilters.status.toLowerCase());");
	});

	it('synchronizes SSR search state, guards races, cleans timers, and leaves magnifier decorative', () => {
		expect(source).toContain("searchQuery = activeSearchMode === 'artists' ? data.artistFilters.search");
		expect(source).toContain('if (revision !== navigationRevision) return;');
		expect(source).toContain('clearSearchTimer();');
		expect(source).toMatch(/<svg[^>]+aria-hidden="true"[^>]*><path/);
		expect(source).not.toContain('xp-search-submit');
	});

	it('cancels a pending debounced search before tab or status navigation', () => {
		expect(source).toMatch(/function navigateQuery\([\s\S]*?event\.preventDefault\(\);\s*clearSearchTimer\(\);\s*void navigateTo\(target\);/);
	});

	it('preserves the current trimmed search when status is clicked before debounce', () => {
		expect(source).toContain("const statusSearchParam = $derived(searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : '');");
		expect(source).toMatch(/statusChips[\s\S]*?status=ongoing\$\{statusSearchParam\}/);
		expect(source).not.toMatch(/statusChips[\s\S]*?data\.seriesFilters\.search/);
	});

});
