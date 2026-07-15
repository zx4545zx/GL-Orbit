type XEmbedOptions = { theme?: 'light' | 'dark'; dnt?: boolean; conversation?: 'none'; cards?: 'hidden'; align?: 'left' | 'center' | 'right' };
type XWidgets = { widgets: { createTweet(tweetId: string, element: HTMLElement, options?: XEmbedOptions): Promise<HTMLElement> } };

declare global { interface Window { twttr?: XWidgets } }

const SCRIPT_URL = 'https://platform.x.com/widgets.js';
let scriptPromise: Promise<XWidgets> | undefined;

export function loadXWidgets(): Promise<XWidgets> {
	if (window.twttr?.widgets) return Promise.resolve(window.twttr);
	if (scriptPromise) return scriptPromise;
	scriptPromise = new Promise((resolve, reject) => {
		const finish = () => window.twttr?.widgets ? resolve(window.twttr) : reject(new Error('X widgets failed to initialize'));
		const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
		if (existing) { existing.addEventListener('load', finish, { once: true }); existing.addEventListener('error', () => reject(new Error('Failed to load X widgets')), { once: true }); return; }
		const script = document.createElement('script');
		script.src = SCRIPT_URL; script.async = true; script.charset = 'utf-8';
		script.addEventListener('load', finish, { once: true }); script.addEventListener('error', () => reject(new Error('Failed to load X widgets')), { once: true });
		document.head.appendChild(script);
	});
	return scriptPromise;
}
