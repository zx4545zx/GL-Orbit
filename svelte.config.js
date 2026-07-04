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
		adapter: adapter({
			// Match Neon region (ap-southeast-1 = Singapore) to avoid cross-Pacific latency
			regions: ['sin1']
		})
	}
};

export default config;
