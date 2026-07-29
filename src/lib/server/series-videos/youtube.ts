const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeUrl(rawUrl: string): { canonicalUrl: string; videoId: string } | null {
	try {
		const url = new URL(rawUrl);
		if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;

		let videoId: string | null = null;
		if (url.hostname === 'youtu.be') {
			const match = url.pathname.match(/^\/([^/]+)$/);
			videoId = match?.[1] ?? null;
		} else if (YOUTUBE_HOSTS.has(url.hostname)) {
			if (url.pathname === '/watch') videoId = url.searchParams.get('v');
			else videoId = url.pathname.match(/^\/shorts\/([^/]+)$/)?.[1] ?? null;
		} else return null;

		if (!videoId || !VIDEO_ID.test(videoId)) return null;
		return { canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`, videoId };
	} catch {
		return null;
	}
}
