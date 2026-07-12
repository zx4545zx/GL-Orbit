import { parseSafeExternalUrl } from '../embeds/url-security.js';
import { MAX_MOMENT_IMAGES } from './types.js';

type CreateMomentInput = { sourceUrl?: unknown; body?: unknown; imageUrls?: unknown };

export function parseCreateMoment(input: CreateMomentInput): { ok: true; value: { sourceUrl: string; body: string | null; imageUrls: string[] } } | { ok: false } {
	if (typeof input.sourceUrl !== 'string' || typeof input.imageUrls !== 'undefined' && (!Array.isArray(input.imageUrls) || input.imageUrls.length > MAX_MOMENT_IMAGES)) return { ok: false };
	try {
		parseSafeExternalUrl(input.sourceUrl.trim());
		const imageUrls = (input.imageUrls ?? []) as unknown[];
		if (!imageUrls.every((url) => typeof url === 'string' && (parseSafeExternalUrl(url.trim()), true))) return { ok: false };
		const body = typeof input.body === 'string' ? input.body.trim() || null : null;
		if (body && body.length > 2000) return { ok: false };
		return { ok: true, value: { sourceUrl: input.sourceUrl.trim(), body, imageUrls: imageUrls as string[] } };
	} catch { return { ok: false }; }
}
