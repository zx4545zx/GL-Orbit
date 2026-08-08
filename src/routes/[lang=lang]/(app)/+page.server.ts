import { getHomeData } from '$lib/server/queries/home.js';
import { getLatestNews } from '$lib/server/queries/whats-on.js';
import { getMoments } from '$lib/server/moments/queries.js';
import type { HomeLatestMoment } from '$lib/types/home.js';
import type { NewsItem } from '$lib/types/whats-on.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const lang = params.lang === 'th' ? 'th' : 'en';
	setHeaders({
		'cache-control': 'private, max-age=0, s-maxage=30, stale-while-revalidate=60'
	});
	const [home, latestMoment, latestNews] = await Promise.all([
		getHomeData(lang),
		getLatestMoment(),
		getHomeLatestNews(lang)
	]);
	return { ...home, latestMoment, latestNews };
};

async function getHomeLatestNews(lang: 'th' | 'en'): Promise<NewsItem[]> {
	try {
		return await getLatestNews(lang, 5);
	} catch {
		// News should never prevent schedules and featured series from loading.
		return [];
	}
}

async function getLatestMoment(): Promise<HomeLatestMoment | null> {
	try {
		const { moments } = await getMoments({ limit: 1 });
		const moment = moments[0];
		if (!moment) return null;
		return {
			id: String(moment.id),
			body: moment.body ?? '',
			likeCount: moment.likeCount ?? 0,
			commentCount: moment.commentCount ?? 0,
			createdAt: moment.createdAt.toISOString(),
			author: {
				username: moment.author.username,
				displayName: moment.author.displayName,
				avatarUrl: moment.author.avatarUrl
			}
		};
	} catch {
		// The Halo note is decorative on the home page; never fail the whole load for it.
		return null;
	}
}
