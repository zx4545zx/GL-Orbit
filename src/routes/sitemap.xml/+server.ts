import { asc, isNull } from 'drizzle-orm';
import { availableLanguageTags } from '$lib/i18n/paraglide.js';
import { getDb } from '$lib/server/db/index.js';
import { artists, series } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function urlEntry(origin: string, path: string, changefreq: string, priority: string): string {
	return [
		'<url>',
		`<loc>${escapeXml(new URL(path, origin).toString())}</loc>`,
		`<changefreq>${changefreq}</changefreq>`,
		`<priority>${priority}</priority>`,
		'</url>'
	].join('');
}

function localizedUrlEntries(origin: string, path: string, changefreq: string, priority: string): string[] {
	return availableLanguageTags.map((lang) => urlEntry(origin, `/${lang}${path}`, changefreq, priority));
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const db = await getDb();

	const [publishedSeries, publishedArtists] = await Promise.all([
		db
			.select({ id: series.id })
			.from(series)
			.where(isNull(series.deletedAt))
			.orderBy(asc(series.titleEn)),
		db
			.select({ id: artists.id })
			.from(artists)
			.where(isNull(artists.deletedAt))
			.orderBy(asc(artists.fullNameEn))
	]);

	const urls = [
		...localizedUrlEntries(origin, '', 'daily', '1.0'),
		...localizedUrlEntries(origin, '/about', 'monthly', '0.8'),
		...localizedUrlEntries(origin, '/series', 'daily', '0.9'),
		...localizedUrlEntries(origin, '/artists', 'weekly', '0.7'),
		...localizedUrlEntries(origin, '/calendar', 'hourly', '0.9'),
		...localizedUrlEntries(origin, '/countdown', 'hourly', '0.7'),
		...localizedUrlEntries(origin, '/explore/series', 'weekly', '0.6'),
		...localizedUrlEntries(origin, '/explore/artists', 'weekly', '0.6'),
		...publishedSeries.flatMap((item) =>
			localizedUrlEntries(origin, `/series/${item.id}`, 'weekly', '0.8')
		),
		...publishedArtists.flatMap((item) =>
			localizedUrlEntries(origin, `/artists/${item.id}`, 'weekly', '0.6')
		)
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
