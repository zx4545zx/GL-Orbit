import { availableLanguageTags } from '$lib/i18n/paraglide.js';
import type { RequestHandler } from './$types.js';

const globalPrivatePaths = [
	'/api/'
] as const;

const localizedPrivatePaths = [
	'/admin/',
	'/login',
	'/register',
	'/profile',
	'/notifications'
] as const;

const legacyPrivatePaths = localizedPrivatePaths;

const aiCrawlers = [
	'GPTBot',
	'ChatGPT-User',
	'PerplexityBot',
	'ClaudeBot',
	'anthropic-ai',
	'Google-Extended',
	'Applebot-Extended',
	'Bytespider',
	'CCBot'
] as const;

function disallowedPaths(): string[] {
	return [
		...globalPrivatePaths,
		...legacyPrivatePaths,
		...availableLanguageTags.flatMap((lang) =>
			localizedPrivatePaths.map((path) => `/${lang}${path}`)
		)
	];
}

function crawlerGroup(userAgent: string): string[] {
	return [
		`User-agent: ${userAgent}`,
		'Allow: /',
		...disallowedPaths().map((path) => `Disallow: ${path}`),
		''
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const body = [
		'# GL-Orbit robots.txt',
		'# Public localized discovery pages are crawlable. Admin, API, auth, profile, and notification routes are not crawl targets.',
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
