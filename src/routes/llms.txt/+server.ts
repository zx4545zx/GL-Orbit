import type { RequestHandler } from './$types.js';

function absoluteUrl(origin: string, path: string): string {
	return new URL(path, origin).toString();
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const body = [
		'# GL-Orbit',
		'',
		'GL-Orbit is a community-focused web app for Girls\' Love (GL) series fans. It helps visitors discover series, artists, and broadcast schedules with timezone-aware release information.',
		'',
		'## Key public pages',
		'',
		`- Home: ${absoluteUrl(origin, '/')}`,
		`- Series directory: ${absoluteUrl(origin, '/series')}`,
		`- Broadcast calendar: ${absoluteUrl(origin, '/calendar')}`,
		`- Artists directory: ${absoluteUrl(origin, '/artists')}`,
		`- XML sitemap: ${absoluteUrl(origin, '/sitemap.xml')}`,
		'',
		'## Crawler guidance',
		'',
		'Focus on public discovery pages and individual public detail pages linked from the sitemap. Admin, API, authentication, profile, and notification routes are not primary crawl targets.',
		''
	].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
