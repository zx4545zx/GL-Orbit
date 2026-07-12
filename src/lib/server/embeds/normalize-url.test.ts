import { describe, expect, it } from 'vitest';

import { normalizeUrl } from './normalize-url.js';

describe('normalizeUrl', () => {
	it('canonicalizes a YouTube short URL and removes tracking', () => {
		expect(normalizeUrl('https://youtu.be/abc123?si=tracking&utm_source=x')).toBe('https://www.youtube.com/watch?v=abc123');
	});

	it('canonicalizes Twitter status URLs to X', () => {
		expect(normalizeUrl('https://twitter.com/member/status/123?feature=share')).toBe('https://x.com/member/status/123');
	});
});
