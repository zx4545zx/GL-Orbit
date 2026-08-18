import { describe, expect, it, vi } from 'vitest';
import { PUBLIC_CACHE_CONTROL, setPublicPageCache } from './cache.js';

describe('setPublicPageCache', () => {
	it('shares anonymous responses by cookie while keeping authenticated responses private', () => {
		const setHeaders = vi.fn();

		setPublicPageCache(setHeaders, false);
		setPublicPageCache(setHeaders, true);

		expect(setHeaders).toHaveBeenNthCalledWith(1, {
			'cache-control': PUBLIC_CACHE_CONTROL,
			vary: 'Cookie'
		});
		expect(setHeaders).toHaveBeenNthCalledWith(2, {
			'cache-control': 'private, no-store',
			vary: 'Cookie'
		});
	});
});
