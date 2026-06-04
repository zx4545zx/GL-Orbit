/**
 * Client-side fetch module for series list page.
 * Used by +page.svelte to load data on mount.
 */

export interface SeriesApiResponseItem {
	id: string;
	poster: string;
	title: string;
	status: string;
	studio: string;
	subtitle: string;
	genres?: { name: string }[];
}

export interface SeriesApiResponse {
	items: SeriesApiResponseItem[];
	total: number;
	page: number;
	totalPages: number;
}

export interface SeriesFilters {
	search: string;
	status: string;
}

export type FilterKey = 'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED';

export async function fetchSeries(search: string, status: FilterKey, pageNum = 1): Promise<{ series: SeriesApiResponse; filters: SeriesFilters }> {
	const params = new URLSearchParams();
	if (search) params.set('search', search);
	if (status !== 'ALL') params.set('status', status.toLowerCase());
	if (pageNum > 1) params.set('page', String(pageNum));
	const query = params.toString();
	const apiUrl = query ? `/api/series?${query}` : '/api/series';

	const res = await fetch(apiUrl);
	if (!res.ok) {
		return {
			series: { items: [], total: 0, page: 1, totalPages: 0 },
			filters: { search, status }
		};
	}

	const series: SeriesApiResponse = await res.json();
	return { series, filters: { search, status } };
}
