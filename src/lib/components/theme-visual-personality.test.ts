import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEME_NAMES } from '$lib/theme.svelte.js';

const css = readFileSync('src/app.css', 'utf8');
const primitiveTokens = [
	'--orbit-radius-control', '--orbit-radius-surface', '--orbit-radius-menu-dialog', '--orbit-radius-badge',
	'--orbit-border-width', '--orbit-border-style', '--orbit-border-default', '--orbit-border-strong',
	'--orbit-border-interactive', '--orbit-border-focus', '--orbit-shadow-surface', '--orbit-shadow-raised',
	'--orbit-shadow-overlay', '--orbit-shadow-interactive', '--orbit-shadow-accent', '--orbit-font-display',
	'--orbit-font-body', '--orbit-font-heading-weight', '--orbit-font-label-weight', '--orbit-font-letter-spacing',
	'--orbit-font-decorative', '--orbit-texture-opacity', '--orbit-texture-image', '--orbit-accent-image',
	'--orbit-motion-fast', '--orbit-motion-standard', '--orbit-motion-theme', '--orbit-motion-ease'
] as const;

const sharedComponents = ['ThemeMenu.svelte', 'ConfirmDialog.svelte', 'PasswordInput.svelte', 'NotificationBadge.svelte', 'BottomNav.svelte', 'Navigation.svelte'];
// Tokens absent from a theme block intentionally inherit from :root.
const rootInheritedTokens = new Set<string>();

const hasForbiddenThemeBranch = (source: string) =>
	source.includes('data-theme') ||
	/\{\s*(?:#if|:else\s+if|#snippet)\b[^}]*\b(?:theme|name)\s*(?:===|!==|==|!=)/i.test(source) ||
	/(?:class|style|background|color|shadow|border)[^\n]*(?:theme|name)\s*(?:===|!==|==|!=)/i.test(source);

describe('theme visual personality contracts', () => {
	it.each(THEME_NAMES)('%s has a complete primitive block or root inheritance', (theme) => {
		const selector = theme === 'fanzine' ? ':root' : `[data-theme='${theme}']`;
		const block = css.match(new RegExp(`${selector.replace('[', '\\[').replace(']', '\\]')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
		expect(block, `${theme} selector block`).toBeTruthy();
		for (const token of primitiveTokens) {
			expect(block.includes(token) || rootInheritedTokens.has(token), `${theme} ${token}`).toBe(true);
		}
	});

	it('keeps every fanzine primitive fallback concrete and non-cyclic', () => {
		const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
		for (const token of primitiveTokens) {
			const value = root.match(new RegExp(`${token}\\s*:\\s*([^;]+);`))?.[1].trim();
			expect(value, token).toBeTruthy();
			expect(value).not.toBe(`var(${token})`);
		}
	});

	it('keeps decoration inert, bounded, and reduced-motion safe', () => {
		expect(css).toMatch(/\.orbit-decoration[\s\S]*pointer-events:\s*none/);
		expect(css).toMatch(/\.orbit-decoration[\s\S]*overflow:\s*(clip|hidden)/);
		expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*\.orbit-decoration[\s\S]*transform:\s*none/);
		expect(css).not.toMatch(/\.orbit-decoration[\s\S]*pointer-events:\s*auto/);
	});

	it.each(sharedComponents)('%s follows shared-component theme policy', (file) => {
		const source = readFileSync(`src/lib/components/${file}`, 'utf8');
		expect(hasForbiddenThemeBranch(source)).toBe(false);
		expect(source).not.toMatch(/orbit-decoration[\s\S]*pointer-events-auto/);
		expect(source).not.toMatch(/animation[^;]*(?:infinite|linear\s+none)/);
	});

	it('allows selection-state comparison but rejects thematic rendering branches', () => {
		const forbiddenRenderingFixture = `
			{#if theme === 'sakura'}<span>pink</span>{/if}
			{:else if name !== 'love'}<span>blue</span>{/if}
			{#snippet themeLabel(theme == 'space')}<span>space</span>{/snippet}
		`;
		const allowedSelectionFixture = `
			<button aria-checked={Object.is(themeState.theme, name)}></button>
			<div aria-current={theme === selectedTheme ? 'page' : undefined}></div>
		`;

		expect(hasForbiddenThemeBranch(allowedSelectionFixture)).toBe(false);
		expect(hasForbiddenThemeBranch(forbiddenRenderingFixture)).toBe(true);
		expect(hasForbiddenThemeBranch("class={theme === 'sakura' ? 'text-pink' : 'text-blue'}")).toBe(true);
		expect(hasForbiddenThemeBranch("style:background={name === 'love' ? accent : base}")).toBe(true);
		expect(hasForbiddenThemeBranch("[data-theme='space'] .panel { color: blue; }")).toBe(true);
	});

	it('keeps non-color state affordances at shared boundaries', () => {
		const themeMenu = readFileSync('src/lib/components/ThemeMenu.svelte', 'utf8');
		const bottomNav = readFileSync('src/lib/components/BottomNav.svelte', 'utf8');
		const confirmDialog = readFileSync('src/lib/components/ConfirmDialog.svelte', 'utf8');
		const notificationBadge = readFileSync('src/lib/components/NotificationBadge.svelte', 'utf8');

		// Active state: semantic state plus a non-color visual marker.
		expect(themeMenu).toMatch(/aria-checked/);
		expect(bottomNav).toMatch(/aria-current/);
		expect(bottomNav).toMatch(/orbit-nav-indicator/);

		// Error state: boundary exposes a semantic/error affordance, not color alone.
		expect(confirmDialog).toMatch(/aria-(?:label|describedby)|role="alert"|text-(?:coral|error)/i);

		// Success state: boundary exposes status/live feedback or an explicit success marker.
		expect(themeMenu).toMatch(/role="status"|aria-live|[✓✔]|text-(?:mint|success)/i);

		// Badge boundary: count remains available to assistive technology.
		expect(notificationBadge).toMatch(/orbit-badge/);
		expect(notificationBadge).toMatch(/aria-label/);

		const sources = sharedComponents.map((file) => readFileSync(`src/lib/components/${file}`, 'utf8')).join('\n');
		expect(sources).toContain('touch-target');
	});
});
