import { browser } from '$app/environment';

export type ThemeName = 'fanzine' | 'midnight' | 'y2k' | 'sakura' | 'ocean' | 'candy' | 'mission';
export const THEME_NAMES = ['fanzine', 'midnight', 'y2k', 'sakura', 'ocean', 'candy', 'mission'] as const satisfies readonly ThemeName[];
export const DEFAULT_THEME: ThemeName = 'y2k';
export const THEME_STORAGE_KEY = 'theme';
const META_COLORS: Record<ThemeName, string> = {
	fanzine: '#fbf3e4',
	midnight: '#0d0a14',
	y2k: '#e8e6f5',
	sakura: '#faf6f0',
	ocean: '#eef7fa',
	candy: '#fff6ec',
	mission: '#edeae2'
};

export function isThemeName(value: unknown): value is ThemeName {
	return typeof value === 'string' && (THEME_NAMES as readonly string[]).includes(value);
}
export function parseThemeName(value: unknown): ThemeName { return isThemeName(value) ? value : DEFAULT_THEME; }
export function readStoredTheme(storage?: Storage): ThemeName {
	try { return parseThemeName((storage ?? (browser ? localStorage : undefined))?.getItem(THEME_STORAGE_KEY)); } catch { return DEFAULT_THEME; }
}
export const themeState = $state<{ theme: ThemeName }>({ theme: browser && typeof document !== 'undefined' ? parseThemeName(document.documentElement.dataset.theme) : DEFAULT_THEME });
export function applyTheme(theme: ThemeName): void {
	if (!browser) return;
	const selected = parseThemeName(theme);
	document.documentElement.dataset.theme = selected;
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[selected]);
}
export function setTheme(next: ThemeName, persist = true, storage?: Storage): void {
	const theme = parseThemeName(next);
	themeState.theme = theme;
	applyTheme(theme);
	if (persist && browser) try { (storage ?? localStorage).setItem(THEME_STORAGE_KEY, theme); } catch {}
}
