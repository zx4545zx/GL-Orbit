const trackingParameters = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'si', 'feature', 's']);

export function normalizeUrl(rawUrl: string): string {
	const url = new URL(rawUrl);
	const host = url.hostname.toLowerCase();
	for (const key of [...url.searchParams.keys()]) if (trackingParameters.has(key)) url.searchParams.delete(key);

	if (host === 'youtu.be') {
		const id = url.pathname.slice(1);
		return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
	}
	if (host === 'twitter.com' || host === 'www.twitter.com') url.hostname = 'x.com';
	url.hostname = url.hostname.toLowerCase();
	if (url.pathname !== '/' && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);
	return url.toString();
}
