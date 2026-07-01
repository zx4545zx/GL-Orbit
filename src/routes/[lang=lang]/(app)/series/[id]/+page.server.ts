import { m } from '$lib/i18n/paraglide.js';
import { error } from '@sveltejs/kit';
import { getSeriesDetail } from '$lib/server/queries/series-detail.js';
import { localizeSeries } from '$lib/i18n/series.js';
import type { PageServerLoad } from './$types.js';
import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';

export const load: PageServerLoad = async ({ params }) => {
	const series = await getSeriesDetail(params.id);
	if (!series) {
		throw error(404, m.series_detail_not_found());
	}

	const { title, description } = localizeSeries(series, params.lang as AvailableLanguageTag);

	return { series, title, description };
};
