const MAX_EXTERNAL_URL_LENGTH = 2048;

function isIpv4Host(hostname: string): boolean {
	return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function isBlockedIpv4(hostname: string): boolean {
	const [first, second] = hostname.split('.').map(Number);
	return first === 10 || first === 127 || first === 0 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

export function parseSafeExternalUrl(rawUrl: string): URL {
	if (rawUrl.length === 0 || rawUrl.length > MAX_EXTERNAL_URL_LENGTH) throw new Error('Invalid URL');

	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		throw new Error('Invalid URL');
	}

	const hostname = url.hostname.toLowerCase();
	if (url.protocol !== 'https:' || url.username || url.password || url.port || hostname === 'localhost' || hostname.endsWith('.local') || hostname.includes(':') || isIpv4Host(hostname) || isBlockedIpv4(hostname)) {
		throw new Error('Unsafe URL');
	}

	return url;
}
