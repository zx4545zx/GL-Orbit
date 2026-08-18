type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export const PUBLIC_CACHE_CONTROL = 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400';

export function setPublicPageCache(
	setHeaders: (headers: Record<string, string>) => void,
	authenticated: boolean
): void {
	setHeaders({
		'cache-control': authenticated ? 'private, no-store' : PUBLIC_CACHE_CONTROL,
		vary: 'Cookie'
	});
}

export function getCached<T>(key: string, ttlMs: number = 30000): T | undefined {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return undefined;
	}
	return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number = 30000): void {
	cache.set(key, {
		value,
		expiresAt: Date.now() + ttlMs
	});
}

export function deleteCached(key: string): boolean {
	return cache.delete(key);
}

export function clearCache(): void {
	cache.clear();
}
