import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const body = [
		'User-agent: *',
		'Allow: /',
		'Disallow: /admin/',
		'Disallow: /api/',
		'Disallow: /login',
		'Disallow: /register',
		'Disallow: /profile',
		'Disallow: /notifications',
		'',
		`Sitemap: ${new URL('/sitemap.xml', origin).toString()}`,
		''
	].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
