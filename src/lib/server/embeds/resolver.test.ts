import { describe, expect, it } from 'vitest';

import { resolveEmbed } from './resolver.js';

describe('resolveEmbed', () => {
	it('resolves supported YouTube URLs without a network request', async () => {
		await expect(resolveEmbed('https://youtu.be/abc123?si=tracking')).resolves.toEqual({
			provider: 'YOUTUBE', canonicalUrl: 'https://www.youtube.com/watch?v=abc123', externalId: 'abc123', status: 'READY',
			metadata: { providerName: 'YouTube' }
		});
	});

	it('returns a safe fallback for an unknown public HTTPS URL', async () => {
		await expect(resolveEmbed('https://example.com/article?utm_source=x')).resolves.toEqual({
			provider: 'OTHER', canonicalUrl: 'https://example.com/article', status: 'FALLBACK',
			metadata: { providerName: 'example.com' }
		});
	});

	it('normalizes X status links without loading provider content', async () => {
		await expect(resolveEmbed('https://twitter.com/member/status/123456')).resolves.toEqual({
			provider: 'X', canonicalUrl: 'https://x.com/member/status/123456', externalId: '123456', status: 'FALLBACK',
			metadata: { providerName: 'X' }
		});
	});

	it('accepts X share URLs and removes their tracking parameter', async () => {
		await expect(resolveEmbed('https://x.com/frt_ent/status/2076300075899482224?s=20')).resolves.toEqual({
			provider: 'X', canonicalUrl: 'https://x.com/frt_ent/status/2076300075899482224', externalId: '2076300075899482224', status: 'FALLBACK',
			metadata: { providerName: 'X' }
		});
	});

	it('recognizes TikTok video links without fetching provider HTML', async () => {
		await expect(resolveEmbed('https://www.tiktok.com/@member/video/7123456789012345678')).resolves.toEqual({
			provider: 'TIKTOK', canonicalUrl: 'https://www.tiktok.com/@member/video/7123456789012345678', externalId: '7123456789012345678', status: 'FALLBACK',
			metadata: { providerName: 'TikTok' }
		});
	});
});
