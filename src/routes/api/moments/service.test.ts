import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/embeds/resolver.js', () => ({ resolveEmbed: vi.fn() }));

import { resolveEmbed } from '$lib/server/embeds/resolver.js';
import { parseMomentRequest } from './service.js';

describe('parseMomentRequest', () => {
	it('does not resolve an embed when sourceUrl is absent', async () => {
		await expect(parseMomentRequest(new Request('http://test', {
			method: 'POST',
			body: JSON.stringify({ body: 'hello', seriesIds: [], artistIds: [], shipIds: [] })
		}))).resolves.toMatchObject({ sourceUrl: null, sourceCanonicalUrl: null, provider: 'OTHER' });
		expect(resolveEmbed).not.toHaveBeenCalled();
	});

	it('defaults omitted entity tag arrays to empty for a source-only Moment', async () => {
		vi.mocked(resolveEmbed).mockResolvedValue({
			canonicalUrl: 'https://x.com/frt_ent/status/2076300075899482224',
			provider: 'X',
			externalId: '2076300075899482224',
			status: 'FALLBACK',
			metadata: { providerName: 'X' }
		});

		await expect(parseMomentRequest(new Request('http://test', {
			method: 'POST',
			body: JSON.stringify({
				sourceUrl: 'https://x.com/frt_ent/status/2076300075899482224?s=20',
				pendingMediaCount: 0
			})
		}))).resolves.toMatchObject({
			provider: 'X',
			seriesIds: [],
			artistIds: [],
			shipIds: []
		});
	});

	it('still rejects malformed entity tag fields', async () => {
		await expect(parseMomentRequest(new Request('http://test', {
			method: 'POST',
			body: JSON.stringify({ body: 'hello', seriesIds: 'not-an-array' })
		}))).resolves.toBeNull();
	});
});
