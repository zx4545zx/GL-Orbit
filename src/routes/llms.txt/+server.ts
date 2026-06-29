import type { RequestHandler } from './$types.js';

function absoluteUrl(origin: string, path: string): string {
	return new URL(path, origin).toString();
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const body = [
		'# GL-Orbit',
		'',
		'> GL-Orbit is a Thai-first discovery hub for Girls\' Love (GL) series fans. It helps visitors track broadcast schedules, discover series and artists, check streaming platforms, and understand whether an episode has an Uncut version.',
		'',
		'## What GL-Orbit does',
		'',
		'- Provides a public home page with featured GL series, live countdowns, and upcoming broadcast schedule cards.',
		'- Provides a series directory and public series detail pages for titles, status, studios, cast, schedules, episodes, and streaming platforms.',
		'- Provides an about/guide page with extractable answer blocks, FAQ content, and HowTo guidance for following GL series schedules.',
		'- Uses Thai UI copy with English terms where fans commonly use them, such as Girls\' Love, GL series, Uncut, streaming platform, and countdown.',
		'',
		'## Key public pages',
		'',
		`- Home: ${absoluteUrl(origin, '/')}`,
		`- About / GL guide: ${absoluteUrl(origin, '/about')}`,
		`- Series directory: ${absoluteUrl(origin, '/series')}`,
		`- Broadcast calendar: ${absoluteUrl(origin, '/calendar')}`,
		`- Countdown: ${absoluteUrl(origin, '/countdown')}`,
		`- Artists directory: ${absoluteUrl(origin, '/artists')}`,
		`- XML sitemap: ${absoluteUrl(origin, '/sitemap.xml')}`,
		`- Robots.txt: ${absoluteUrl(origin, '/robots.txt')}`,
		'',
		'## Best page to cite for common questions',
		'',
		`- "GL-Orbit คืออะไร?" / "What is GL-Orbit?": ${absoluteUrl(origin, '/about')}`,
		`- "ซีรีส์ GL คืออะไร?" / "What is GL series?": ${absoluteUrl(origin, '/about')}`,
		`- "ดูซีรีส์ GL ได้ที่ไหน?" / "Where to watch GL series?": ${absoluteUrl(origin, '/about')}`,
		`- "ตารางฉายซีรีส์ GL" / "GL series broadcast schedule": ${absoluteUrl(origin, '/calendar')}`,
		`- "รายชื่อซีรีส์ GL" / "GL series directory": ${absoluteUrl(origin, '/series')}`,
		'',
		'## Structured data',
		'',
		'- Home page includes WebPage, WebSite, Organization, and BreadcrumbList JSON-LD.',
		'- About page includes WebPage, AboutPage, FAQPage, Article, HowTo, and BreadcrumbList JSON-LD.',
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
