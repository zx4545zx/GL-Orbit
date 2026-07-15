import { parseSafeExternalUrl } from './url-security.js';

const shortLinkHosts = new Set(['vt.tiktok.com', 'youtu.be', 't.co']);
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 5_000;

function isRedirect(response: Response): boolean {
	return response.status >= 300 && response.status < 400;
}

export async function resolveShortLink(url: URL): Promise<URL> {
	if (!shortLinkHosts.has(url.hostname.toLowerCase())) return url;

	let current = url;
	for (let hop = 0; hop < MAX_REDIRECTS; hop += 1) {
		parseSafeExternalUrl(current.toString());
		const response = await fetch(current, {
			redirect: 'manual',
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
		});

		if (!isRedirect(response)) {
			await response.body?.cancel();
			return current;
		}

		const location = response.headers.get('location');
		await response.body?.cancel();
		if (!location) return current;

		current = parseSafeExternalUrl(new URL(location, current).toString());
	}

	throw new Error('Too many redirects');
}
