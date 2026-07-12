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
});
