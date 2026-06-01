import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'GL-Orbit',
				short_name: 'GL-Orbit',
				description: 'ศูนย์กลางข้อมูลและตารางฉายซีรีส์ GL',
				theme_color: '#FF6B9D',
				background_color: '#FFF5F7',
				display: 'standalone',
				lang: 'th',
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
			workbox: {
				globPatterns: ['**/*.{html,css,js,woff2}']
			}
		})
	]
});
