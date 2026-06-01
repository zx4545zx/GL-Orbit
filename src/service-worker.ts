/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;

const ASSETS = [
	...build,
	...files
];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
			);
		})
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		caches.match(event.request).then((cached) => {
			return cached || fetch(event.request);
		})
	);
});
