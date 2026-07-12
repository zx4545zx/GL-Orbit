import { normalizeUrl } from './normalize-url.js';
import type { ResolvedEmbed } from './types.js';
import { parseSafeExternalUrl } from './url-security.js';

const youtubeIdPattern = /^[A-Za-z0-9_-]{6,}$/;

export async function resolveEmbed(rawUrl: string): Promise<ResolvedEmbed> {
	parseSafeExternalUrl(rawUrl);
	const canonicalUrl = normalizeUrl(rawUrl);
	const url = new URL(canonicalUrl);
	const host = url.hostname;

	if ((host === 'www.youtube.com' || host === 'youtube.com') && url.pathname === '/watch') {
		const externalId = url.searchParams.get('v') ?? '';
		if (youtubeIdPattern.test(externalId)) {
			return { provider: 'YOUTUBE', canonicalUrl, externalId, status: 'READY', metadata: { providerName: 'YouTube' } };
		}
	}
	if (host === 'x.com') {
		const match = /^\/[^/]+\/status\/(\d+)$/.exec(url.pathname);
		if (match) return { provider: 'X', canonicalUrl, externalId: match[1], status: 'FALLBACK', metadata: { providerName: 'X' } };
	}
	if (host === 'www.tiktok.com' || host === 'tiktok.com') {
		const match = /^\/@[^/]+\/video\/(\d+)$/.exec(url.pathname);
		if (match) return { provider: 'TIKTOK', canonicalUrl, externalId: match[1], status: 'FALLBACK', metadata: { providerName: 'TikTok' } };
	}

	return { provider: 'OTHER', canonicalUrl, status: 'FALLBACK', metadata: { providerName: host } };
}
