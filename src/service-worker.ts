/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;
const IMAGE_CACHE = 'image-cache-v1';
const MAX_RUNTIME_IMAGES = 120;

const ASSETS = [
	...build,
	...files
];

function isCacheableImageResponse(response: Response) {
	return response.ok || response.type === 'opaque';
}

async function trimImageCache() {
	const cache = await caches.open(IMAGE_CACHE);
	const keys = await cache.keys();

	if (keys.length <= MAX_RUNTIME_IMAGES) return;

	await Promise.all(keys.slice(0, keys.length - MAX_RUNTIME_IMAGES).map((request) => cache.delete(request)));
}

async function cacheFirstImage(request: Request) {
	const cached = await caches.match(request, { cacheName: IMAGE_CACHE });
	if (cached) return cached;

	const response = await fetch(request);

	if (isCacheableImageResponse(response)) {
		const cache = await caches.open(IMAGE_CACHE);
		await cache.put(request, response.clone());
		void trimImageCache();
	}

	return response;
}

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter((key) => key !== CACHE && key !== IMAGE_CACHE)
					.map((key) => caches.delete(key))
			);
		})
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	const canCacheRuntimeImage =
		event.request.destination === 'image' &&
		(url.protocol === 'http:' || url.protocol === 'https:') &&
		!event.request.headers.has('range');

	if (canCacheRuntimeImage) {
		event.respondWith(cacheFirstImage(event.request));
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cached) => {
			return cached || fetch(event.request);
		})
	);
});
