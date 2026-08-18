import { m } from '$lib/i18n/paraglide.js';
import { error } from '@sveltejs/kit';
import { getSeriesDetail } from '$lib/server/queries/series-detail.js';
import { setPublicPageCache } from '$lib/server/cache.js';
import { localizeSeries } from '$lib/i18n/series.js';
import type { PageServerLoad } from './$types.js';
import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';

export const load: PageServerLoad = async ({ params, setHeaders, locals }) => {
	const series = await getSeriesDetail(params.id);
	if (!series) {
		throw error(404, m.series_detail_not_found());
	}

	const { title, description } = localizeSeries(series, params.lang as AvailableLanguageTag);
	setPublicPageCache(setHeaders, Boolean(locals.user));

	return { series, title, description };
};
