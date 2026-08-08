import { error } from '@sveltejs/kit';
import { m } from '$lib/i18n/paraglide.js';
import { getPublishedNewsBySlug } from '$lib/server/news.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const news = await getPublishedNewsBySlug(params.slug);
	if (!news) error(404, m.news_not_found());
	setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=300' });
	return { news, localized: params.lang === 'th' ? { title: news.titleTh, content: news.contentTh } : { title: news.titleEn, content: news.contentEn } };
};
