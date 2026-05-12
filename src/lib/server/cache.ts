type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

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
