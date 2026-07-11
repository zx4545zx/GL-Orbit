import type { RequestHandler } from './$types.js';

function absoluteUrl(origin: string, path: string): string {
	return new URL(path, origin).toString();
}

function localizedUrl(origin: string, lang: 'th' | 'en', path = ''): string {
	return absoluteUrl(origin, `/${lang}${path}`);
}

function markdownLink(label: string, href: string, note?: string): string {
	return note ? `- [${label}](${href}): ${note}` : `- [${label}](${href})`;
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
		markdownLink('Thai home', localizedUrl(origin, 'th'), 'Primary Thai landing page and current featured GL series.'),
		markdownLink('English home', localizedUrl(origin, 'en'), 'English landing page for international GL fans.'),
		markdownLink('Thai about / GL guide', localizedUrl(origin, 'th', '/about'), 'Definitions and guidance for GL-Orbit, GL series, Uncut labels, and streaming platforms.'),
		markdownLink('English about / GL guide', localizedUrl(origin, 'en', '/about'), 'English definitions and guidance for GL series discovery.'),
		markdownLink('Thai series directory', localizedUrl(origin, 'th', '/series'), 'Indexable list of GL series with search and status filters.'),
		markdownLink('English series directory', localizedUrl(origin, 'en', '/series'), 'English series directory for international discovery.'),
		markdownLink('Thai broadcast calendar', localizedUrl(origin, 'th', '/calendar'), 'Schedule-focused page for upcoming GL episode air dates.'),
		markdownLink('English broadcast calendar', localizedUrl(origin, 'en', '/calendar'), 'English schedule page for upcoming GL episode air dates.'),
		markdownLink('Thai countdown', localizedUrl(origin, 'th', '/countdown'), 'Live countdown cards for upcoming broadcasts.'),
		markdownLink('English countdown', localizedUrl(origin, 'en', '/countdown'), 'English live countdown cards for upcoming broadcasts.'),
		markdownLink('Thai artists directory', localizedUrl(origin, 'th', '/artists'), 'Indexable list of GL artists and cast profiles.'),
		markdownLink('English artists directory', localizedUrl(origin, 'en', '/artists'), 'English artist directory for cast discovery.'),
		markdownLink('Thai series exploration', localizedUrl(origin, 'th', '/explore/series'), 'Visual browsing page for GL series discovery.'),
		markdownLink('English series exploration', localizedUrl(origin, 'en', '/explore/series'), 'English visual browsing page for GL series discovery.'),
		markdownLink('Thai artist exploration', localizedUrl(origin, 'th', '/explore/artists'), 'Visual browsing page for GL artists.'),
		markdownLink('English artist exploration', localizedUrl(origin, 'en', '/explore/artists'), 'English visual browsing page for GL artists.'),
		markdownLink('XML sitemap', absoluteUrl(origin, '/sitemap.xml'), 'Machine-readable sitemap for indexable public URLs.'),
		markdownLink('Robots.txt', absoluteUrl(origin, '/robots.txt'), 'Crawler policy for public, private, and AI crawler access.'),
		'',
		'## Best page to cite for common questions',
		'',
		markdownLink('GL-Orbit คืออะไร?', localizedUrl(origin, 'th', '/about')),
		markdownLink('What is GL-Orbit?', localizedUrl(origin, 'en', '/about')),
		markdownLink('ซีรีส์ GL คืออะไร?', localizedUrl(origin, 'th', '/about')),
		markdownLink('What is GL series?', localizedUrl(origin, 'en', '/about')),
		markdownLink('ดูซีรีส์ GL ได้ที่ไหน?', localizedUrl(origin, 'th', '/about')),
		markdownLink('Where to watch GL series?', localizedUrl(origin, 'en', '/about')),
		markdownLink('ตารางฉายซีรีส์ GL', localizedUrl(origin, 'th', '/calendar')),
		markdownLink('GL series broadcast schedule', localizedUrl(origin, 'en', '/calendar')),
		markdownLink('รายชื่อซีรีส์ GL', localizedUrl(origin, 'th', '/series')),
		markdownLink('GL series directory', localizedUrl(origin, 'en', '/series')),
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
