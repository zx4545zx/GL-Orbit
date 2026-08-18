import { getHomeData } from '$lib/server/queries/home.js';
import { getSeriesDetail } from '$lib/server/queries/series-detail.js';
import { getSeriesList, parseSeriesFilters, parseSeriesPage } from '$lib/server/series/listing.js';
import { getArtistList, parseArtistFilters, parseArtistPage } from '$lib/server/queries/artist-list.js';
import { getShipList, parseShipFilters, parseShipPage } from '$lib/server/ships/listing.js';
import type { PageServerLoad } from './$types.js';

export type ExploreMode = 'overview' | 'series' | 'artists' | 'ships';

export function _parseExploreMode(searchParams: URLSearchParams): ExploreMode {
	const requested = searchParams.get('view');
	if (requested === 'series' || requested === 'artists' || requested === 'ships') return requested;
	return searchParams.has('search') || searchParams.has('status') ? 'series' : 'overview';
}

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const lang = params.lang === 'en' ? 'en' : 'th';
	const mode = _parseExploreMode(url.searchParams);
	const seriesFilters = parseSeriesFilters(url.searchParams);
	const artistFilters = parseArtistFilters(url.searchParams);
	const shipFilters = parseShipFilters(url.searchParams);

	const [home, seriesList, artistList, shipList] = await Promise.all([
		getHomeData(lang),
		getSeriesList({ search: '', status: 'ALL' }, 1),
		getArtistList({ search: '' }, 1),
		getShipList({ search: '' }, 1)
	]);
	const [seriesResults, artistResults, shipResults] = await Promise.all([
		mode === 'series' ? getSeriesList(seriesFilters, parseSeriesPage(url.searchParams)) : null,
		mode === 'artists' ? getArtistList(artistFilters, parseArtistPage(url.searchParams)) : null,
		mode === 'ships' ? getShipList(shipFilters, parseShipPage(url.searchParams)) : null
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
		mode,
		seriesResults,
		artistResults,
		shipResults,
		seriesFilters,
		artistFilters,
		shipFilters,
		heroes,
		top10: home.featuredSeries.slice(0, 10),
		upcoming: home.upcomingSchedule,
		artists: artistList.items.slice(0, 12),
		ships: shipList.items.slice(0, 8),
		counts: {
			series: seriesList.total,
			artists: artistList.total,
			ships: shipList.total
		}
	};
};
