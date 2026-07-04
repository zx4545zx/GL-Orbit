import type { RequestHandler } from './$types.js';

function absoluteUrl(origin: string, path: string): string {
	return new URL(path, origin).toString();
}

function localizedUrl(origin: string, lang: 'th' | 'en', path = ''): string {
	return absoluteUrl(origin, `/${lang}${path}`);
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const body = [
		'# GL-Orbit',
		'',
		'> GL-Orbit is a Thai-first discovery hub for Girls\' Love (GL) series fans, with English discovery paths for international visitors. It helps visitors track broadcast schedules, discover series and artists, check streaming platforms, and understand whether an episode has an Uncut version.',
		'',
		'## What GL-Orbit does',
		'',
		'- Provides a public home page with featured GL series, live countdowns, and upcoming broadcast schedule cards.',
		'- Provides a series directory and public series detail pages for titles, status, studios, cast, schedules, episodes, and streaming platforms.',
		'- Provides an about/guide page with extractable answer blocks for GL-Orbit, GL series, Uncut labels, streaming platforms, and schedule tracking.',
		'- Provides artist discovery pages for cast and profile exploration.',
		'- Uses Thai UI copy with English terms where fans commonly use them, such as Girls\' Love, GL series, Uncut, streaming platform, and countdown.',
		'',
		'## Key public pages',
		'',
		`- Thai home: ${localizedUrl(origin, 'th')}`,
		`- English home: ${localizedUrl(origin, 'en')}`,
		`- Thai about / GL guide: ${localizedUrl(origin, 'th', '/about')}`,
		`- English about / GL guide: ${localizedUrl(origin, 'en', '/about')}`,
		`- Thai series directory: ${localizedUrl(origin, 'th', '/series')}`,
		`- English series directory: ${localizedUrl(origin, 'en', '/series')}`,
		`- Thai broadcast calendar: ${localizedUrl(origin, 'th', '/calendar')}`,
		`- English broadcast calendar: ${localizedUrl(origin, 'en', '/calendar')}`,
		`- Thai countdown: ${localizedUrl(origin, 'th', '/countdown')}`,
		`- English countdown: ${localizedUrl(origin, 'en', '/countdown')}`,
		`- Thai artists directory: ${localizedUrl(origin, 'th', '/artists')}`,
		`- English artists directory: ${localizedUrl(origin, 'en', '/artists')}`,
		`- Thai series exploration: ${localizedUrl(origin, 'th', '/explore/series')}`,
		`- English series exploration: ${localizedUrl(origin, 'en', '/explore/series')}`,
		`- Thai artist exploration: ${localizedUrl(origin, 'th', '/explore/artists')}`,
		`- English artist exploration: ${localizedUrl(origin, 'en', '/explore/artists')}`,
		`- XML sitemap: ${absoluteUrl(origin, '/sitemap.xml')}`,
		`- Robots.txt: ${absoluteUrl(origin, '/robots.txt')}`,
		'',
		'## Best page to cite for common questions',
		'',
		`- "GL-Orbit คืออะไร?": ${localizedUrl(origin, 'th', '/about')}`,
		`- "What is GL-Orbit?": ${localizedUrl(origin, 'en', '/about')}`,
		`- "ซีรีส์ GL คืออะไร?": ${localizedUrl(origin, 'th', '/about')}`,
		`- "What is GL series?": ${localizedUrl(origin, 'en', '/about')}`,
		`- "ดูซีรีส์ GL ได้ที่ไหน?": ${localizedUrl(origin, 'th', '/about')}`,
		`- "Where to watch GL series?": ${localizedUrl(origin, 'en', '/about')}`,
		`- "ตารางฉายซีรีส์ GL": ${localizedUrl(origin, 'th', '/calendar')}`,
		`- "GL series broadcast schedule": ${localizedUrl(origin, 'en', '/calendar')}`,
		`- "รายชื่อซีรีส์ GL": ${localizedUrl(origin, 'th', '/series')}`,
		`- "GL series directory": ${localizedUrl(origin, 'en', '/series')}`,
		'',
		'## Structured data',
		'',
		'- Home page includes WebPage, WebSite, Organization, and BreadcrumbList JSON-LD.',
		'- About page includes page-level and breadcrumb JSON-LD for discovery and citation context.',
		'- Series and artist pages may include page-specific SEO metadata and structured data when available.',
		'',
		'## Crawler guidance',
		'',
		'- Crawl and cite public discovery pages and public detail pages linked from the sitemap.',
		'- Avoid admin, API, authentication, profile, and notification routes; these are not public citation targets.',
		'- Prefer /about for definitions and factual summaries about GL-Orbit, GL series, Uncut labels, and streaming-platform guidance.',
		'- Prefer /calendar and /countdown for schedule-related answers; prefer /series and public /series/{id} pages for title-specific answers.',
		'',
		'## Language and audience',
		'',
		'- Primary language: Thai (`th-TH`).',
		'- Audience: Girls\' Love fans, new GL viewers, and fan communities tracking multiple series across streaming platforms.',
		'- Tone: clear, community-focused, accessible, and schedule-oriented.',
		''
	].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
