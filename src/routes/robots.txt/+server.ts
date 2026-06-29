import type { RequestHandler } from './$types.js';

const privatePaths = [
	'/admin/',
	'/api/',
	'/login',
	'/register',
	'/profile',
	'/notifications'
] as const;

const aiCrawlers = [
	'GPTBot',
	'ChatGPT-User',
	'PerplexityBot',
	'ClaudeBot',
	'anthropic-ai',
	'Google-Extended',
	'Bingbot'
] as const;

function crawlerGroup(userAgent: string): string[] {
	return [
		`User-agent: ${userAgent}`,
		'Allow: /',
		...privatePaths.map((path) => `Disallow: ${path}`),
		''
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const body = [
		'# GL-Orbit robots.txt',
		'# Public discovery pages are crawlable. Admin, API, auth, profile, and notification routes are not crawl targets.',
		'',
		...crawlerGroup('*'),
		'# AI search and assistant crawlers: allow public pages for citation and discovery.',
		...aiCrawlers.flatMap((agent) => crawlerGroup(agent)),
		`Sitemap: ${new URL('/sitemap.xml', origin).toString()}`,
		`# LLM context: ${new URL('/llms.txt', origin).toString()}`,
		''
	].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
