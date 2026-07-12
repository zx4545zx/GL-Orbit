import { parseSafeExternalUrl } from '../embeds/url-security.js';
import { MAX_MOMENT_IMAGES } from './types.js';

type CreateMomentInput = { sourceUrl?: unknown; body?: unknown; imageUrls?: unknown; pendingMediaCount?: unknown };

export function parseCreateMoment(input: CreateMomentInput): { ok: true; value: { sourceUrl: string | null; body: string | null; imageUrls: string[]; pendingMediaCount: number } } | { ok: false } {
	if (
		typeof input.sourceUrl !== 'undefined' && typeof input.sourceUrl !== 'string' ||
		typeof input.imageUrls !== 'undefined' && (!Array.isArray(input.imageUrls) || input.imageUrls.length > MAX_MOMENT_IMAGES) ||
		typeof input.pendingMediaCount !== 'undefined' && (typeof input.pendingMediaCount !== 'number' || !Number.isInteger(input.pendingMediaCount) || input.pendingMediaCount < 0 || input.pendingMediaCount > MAX_MOMENT_IMAGES)
	) return { ok: false };
	try {
		const sourceUrl = typeof input.sourceUrl === 'string' && input.sourceUrl.trim() ? input.sourceUrl.trim() : null;
		if (sourceUrl) parseSafeExternalUrl(sourceUrl);
		const imageUrls = (input.imageUrls ?? []) as unknown[];
		const normalizedImageUrls = imageUrls.map((url) => {
			if (typeof url !== 'string') throw new TypeError('Invalid image URL');
			const normalizedUrl = url.trim();
			parseSafeExternalUrl(normalizedUrl);
			return normalizedUrl;
		});
		const body = typeof input.body === 'string' ? input.body.trim() || null : null;
		if (body && body.length > 2000) return { ok: false };
		const pendingMediaCount = typeof input.pendingMediaCount === 'number' ? input.pendingMediaCount : 0;
		if (normalizedImageUrls.length + pendingMediaCount > MAX_MOMENT_IMAGES) return { ok: false };
		if (!body && !sourceUrl && normalizedImageUrls.length === 0 && pendingMediaCount === 0) return { ok: false };
		return { ok: true, value: { sourceUrl, body, imageUrls: normalizedImageUrls, pendingMediaCount } };
	} catch { return { ok: false }; }
}
