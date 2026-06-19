import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
		// Match Neon region (ap-southeast-1 = Singapore) to avoid cross-Pacific latency
		regions: ['sin1']
	})
	}
};

export default config;
