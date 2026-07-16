import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Inline the global CSS bundle to remove the render-blocking stylesheet
		// request flagged by Lighthouse on the initial document. The bundle is
		// ~25 KiB over the wire after compression, but ~190 KiB before compression.
		inlineStyleThreshold: 220_000,
		serviceWorker: { register: true },
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'base-uri': ['self'],
				'object-src': ['none'],
				'form-action': ['self'],
				'frame-ancestors': ['self'],
				'script-src': ['self', 'https://platform.x.com', 'https://platform.twitter.com'],
				'style-src': ['self'],
				'style-src-attr': ['unsafe-inline'],
				// Local upload previews and client-side image compression use blob URLs.
				'img-src': ['self', 'https:', 'data:', 'blob:'],
				'font-src': ['self'],
				'connect-src': ['self'],
				'frame-src': [
					'https://www.youtube-nocookie.com',
					'https://www.tiktok.com',
					'https://platform.x.com',
					'https://platform.twitter.com'
				]
			}
		},
		adapter: adapter({
			// Match Neon region (ap-southeast-1 = Singapore) to avoid cross-Pacific latency
			regions: ['sin1']
		})
	}
};

export default config;
