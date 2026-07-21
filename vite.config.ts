import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { paraglide } from '@inlang/paraglide-sveltekit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
	plugins: [
		paraglide({ project: './project.inlang', outdir: './src/lib/i18n/paraglide' }),
		tailwindcss(),
		sveltekit(),
		svelteTesting({ autoCleanup: false }),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.ts',
			manifest: {
				name: 'GL-Orbit',
				short_name: 'GL-Orbit',
				description: 'ศูนย์กลางข้อมูลและตารางฉายซีรีส์ GL',
				theme_color: '#FF6B9D',
				background_color: '#FFF5F7',
				display: 'standalone',
				lang: 'th',
				share_target: {
					action: '/halo/compose',
					method: 'GET',
					enctype: 'application/x-www-form-urlencoded',
					params: {
						title: 'title',
						text: 'text',
						url: 'url'
					}
				},
				icons: [
					{
						src: '/icons/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icons/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/icons/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: '/icons/apple-touch-icon-180x180.png',
						sizes: '180x180',
						type: 'image/png'
					}
				]
			},
			injectManifest: {
				globPatterns: ['**/*.{html,css,js,woff2}']
			},
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			}
		})
	]
});
