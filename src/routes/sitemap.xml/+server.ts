import { asc, isNull } from 'drizzle-orm';
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
		urlEntry(origin, '/', 'daily', '1.0'),
		urlEntry(origin, '/about', 'monthly', '0.8'),
		urlEntry(origin, '/series', 'daily', '0.9'),
		urlEntry(origin, '/calendar', 'hourly', '0.9'),
		...publishedSeries.map((item) => urlEntry(origin, `/series/${item.id}`, 'weekly', '0.8')),
		...publishedArtists.map((item) => urlEntry(origin, `/artists/${item.id}`, 'weekly', '0.6'))
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
