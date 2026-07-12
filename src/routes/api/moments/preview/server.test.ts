import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ resolveEmbed: vi.fn() }));
vi.mock('$lib/server/embeds/resolver.js', () => ({ resolveEmbed: mocks.resolveEmbed }));

describe('POST /api/moments/preview', () => {
	beforeEach(() => vi.clearAllMocks());

	it('previews the reported X share URL for an authenticated user', async () => {
		mocks.resolveEmbed.mockResolvedValue({
			provider: 'X', canonicalUrl: 'https://x.com/frt_ent/status/2076300075899482224',
			externalId: '2076300075899482224', status: 'FALLBACK', metadata: { providerName: 'X' }
		});
		const { POST } = await import('./+server.js');
		const request = new Request('http://localhost/api/moments/preview', {
			method: 'POST', headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ sourceUrl: 'https://x.com/frt_ent/status/2076300075899482224?s=20' })
		});
		const response = await POST({ locals: { user: { id: 'user-1' } }, request } as never) as Response;
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ provider: 'X', externalId: '2076300075899482224' });
		expect(mocks.resolveEmbed).toHaveBeenCalledWith('https://x.com/frt_ent/status/2076300075899482224?s=20');
	});

	it('never returns INVALID_MOMENT for an invalid preview payload', async () => {
		mocks.resolveEmbed.mockRejectedValue(new Error('invalid URL'));
		const { POST } = await import('./+server.js');
		const request = new Request('http://localhost/api/moments/preview', {
			method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceUrl: '{"error":"INVALID_MOMENT"}' })
		});
		const response = await POST({ locals: { user: { id: 'user-1' } }, request } as never) as Response;
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'INVALID_URL' });
	});
});
