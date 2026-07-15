import { normalizeUrl } from './normalize-url.js';
import { resolveShortLink } from './short-link-resolver.js';
import type { ResolvedEmbed } from './types.js';
import { parseSafeExternalUrl } from './url-security.js';

const youtubeIdPattern = /^[A-Za-z0-9_-]{6,}$/;
type TikTokOEmbed = { thumbnail_url?: unknown; title?: unknown; author_name?: unknown };

function getThumbnailExpiresAt(thumbnailUrl: string): string | undefined {
	try {
		const expires = Number(new URL(thumbnailUrl).searchParams.get('x-expires'));
		return Number.isFinite(expires) ? new Date(expires * 1_000).toISOString() : undefined;
	} catch {
		return undefined;
	}
}

async function getTikTokMetadata(canonicalUrl: string): Promise<ResolvedEmbed['metadata']> {
	try {
		const endpoint = new URL('https://www.tiktok.com/oembed');
		endpoint.searchParams.set('url', canonicalUrl);
		const response = await fetch(endpoint, { signal: AbortSignal.timeout(3_000) });
		if (!response.ok) return { providerName: 'TikTok' };
		const data = await response.json() as TikTokOEmbed;
		const thumbnailUrl = typeof data.thumbnail_url === 'string' && data.thumbnail_url.startsWith('https://') ? data.thumbnail_url : undefined;
		return {
			providerName: 'TikTok',
			title: typeof data.title === 'string' ? data.title : undefined,
			authorName: typeof data.author_name === 'string' ? data.author_name : undefined,
			thumbnailUrl,
			thumbnailExpiresAt: thumbnailUrl ? getThumbnailExpiresAt(thumbnailUrl) : undefined
		};
	} catch {
		return { providerName: 'TikTok' };
	}
}

export async function resolveEmbed(rawUrl: string): Promise<ResolvedEmbed> {
	const submittedUrl = parseSafeExternalUrl(rawUrl);
	let resolvedUrl = submittedUrl;
	try {
		resolvedUrl = await resolveShortLink(submittedUrl);
	} catch {
		// Preserve the submitted safe URL and existing fallback behavior.
	}

	const canonicalUrl = normalizeUrl(resolvedUrl.toString());
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
		if (match) return { provider: 'TIKTOK', canonicalUrl, externalId: match[1], status: 'FALLBACK', metadata: await getTikTokMetadata(canonicalUrl) };
	}

	return { provider: 'OTHER', canonicalUrl, status: 'FALLBACK', metadata: { providerName: host } };
}
