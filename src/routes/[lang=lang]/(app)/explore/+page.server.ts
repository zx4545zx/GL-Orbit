import { asc, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { platforms } from '$lib/server/db/schema.js';
import { getCached, setCached } from '$lib/server/cache.js';
import { getHomeData } from '$lib/server/queries/home.js';
import { getSeriesDetail } from '$lib/server/queries/series-detail.js';
import { getSeriesList } from '$lib/server/series/listing.js';
import { getArtistList } from '$lib/server/queries/artist-list.js';
import { getShipList } from '$lib/server/ships/listing.js';
import type { PageServerLoad } from './$types.js';

const CACHE_TTL = 30_000;

export type ExplorePlatform = { name: string };

async function getPlatformNames(): Promise<ExplorePlatform[]> {
	const CACHE_KEY = 'query:explore:platforms';
	const cached = getCached<ExplorePlatform[]>(CACHE_KEY, CACHE_TTL);
	if (cached) return cached;

	const db = await getDb();
	const rows = await db
		.select({ name: platforms.name })
		.from(platforms)
		.where(isNull(platforms.deletedAt))
		.orderBy(asc(platforms.name));

	setCached(CACHE_KEY, rows, CACHE_TTL);
	return rows;
}

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const lang = params.lang === 'en' ? 'en' : 'th';

	const [home, seriesList, artistList, shipList, platformNames] = await Promise.all([
		getHomeData(lang),
		getSeriesList({ search: '', status: 'ALL' }, 1),
		getArtistList({ search: '' }, 1),
		getShipList({ search: '' }, 1),
		getPlatformNames()
	]);

	// Hero slides (max 5): countdown series first (they have a real next episode),
	// filled with featured series. Only ONGOING series may appear in the hero.
	const MAX_HEROES = 5;
	const candidateIds: string[] = [];
	for (const c of home.countdown) {
		if (!candidateIds.includes(c.seriesId)) candidateIds.push(c.seriesId);
	}
	for (const f of home.featuredSeries) {
		if (f.status === 'ONGOING' && !candidateIds.includes(f.id)) candidateIds.push(f.id);
	}

	const heroDetails = await Promise.all(candidateIds.slice(0, MAX_HEROES + 3).map((id) => getSeriesDetail(id)));
	const heroes = heroDetails
		.filter((d): d is NonNullable<typeof d> => Boolean(d) && d!.status === 'ONGOING')
		.slice(0, MAX_HEROES)
		.map((detail) => ({
			detail,
			next: home.countdown.find((c) => c.seriesId === detail.id) ?? null
		}));

	setHeaders({
		'cache-control': 'private, no-store'
	});

	return {
		lang,
		heroes,
		top10: home.featuredSeries.slice(0, 10),
		upcoming: home.upcomingSchedule,
		artists: artistList.items.slice(0, 12),
		ships: shipList.items.slice(0, 8),
		counts: {
			series: seriesList.total,
			artists: artistList.total,
			ships: shipList.total
		},
		platforms: platformNames
	};
};
