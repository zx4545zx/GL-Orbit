/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// `__WB_MANIFEST` is injected by workbox during the build
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

cleanupOutdatedCaches();
clientsClaim();

self.addEventListener('push', (event) => {
	const data = event.data?.json() ?? {};
	event.waitUntil(
		self.registration.showNotification(data.title ?? 'GL-Orbit', {
			body: data.body ?? '',
			icon: '/icons/pwa-192x192.png',
			badge: '/icons/pwa-192x192.png',
			data: data.data ?? {}
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url: string = event.notification.data?.url ?? '/notifications';
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			const client = clients.find((c) => c.url.includes(self.location.origin));
			if (client) {
				client.navigate(url);
				client.focus();
			} else {
				self.clients.openWindow(url);
			}
		})
	);
});
