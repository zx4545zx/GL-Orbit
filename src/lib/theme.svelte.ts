import { browser } from '$app/environment';

export type ThemeName = 'orbit' | 'space' | 'sakura' | 'love';
export const THEME_NAMES = ['orbit', 'space', 'sakura', 'love'] as const satisfies readonly ThemeName[];
export const DEFAULT_THEME: ThemeName = 'orbit';
export const THEME_STORAGE_KEY = 'theme';
const META_COLORS: Record<ThemeName, string> = { orbit: '#fffafc', space: '#f4f8ff', sakura: '#fff7fa', love: '#fff8f1' };

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
