import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readInitialTheme(): Theme {
	if (!browser) return 'light';
	const root = document.documentElement;
	return root.dataset.theme === 'dark' ? 'dark' : 'light';
}

export const themeState = $state<{ theme: Theme }>({ theme: readInitialTheme() });

function applyTheme(next: Theme) {
	if (!browser) return;
	document.documentElement.dataset.theme = next;
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', next === 'dark' ? '#24151F' : '#FF6B9D');
}

export function setTheme(next: Theme, persist = true) {
	themeState.theme = next;
	applyTheme(next);
	if (persist && browser) {
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {}
	}
}

export function toggleTheme() {
	setTheme(themeState.theme === 'dark' ? 'light' : 'dark');
}

let mediaListenerAttached = false;

export function watchSystemTheme() {
	if (!browser || mediaListenerAttached) return;
	mediaListenerAttached = true;
	const media = window.matchMedia('(prefers-color-scheme: dark)');
	media.addEventListener('change', (event) => {
		let stored: string | null = null;
		try {
			stored = localStorage.getItem(STORAGE_KEY);
		} catch {}
		if (stored !== 'dark' && stored !== 'light') {
			setTheme(event.matches ? 'dark' : 'light', false);
		}
	});
}
