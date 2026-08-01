import { m } from '$lib/i18n/paraglide.js';
import { redirect } from '@sveltejs/kit';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import type { PageServerLoad } from './$types.js';

const FALLBACK_POSTER = '/placeholders/poster.svg';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (url.searchParams.get('tab') === 'account') throw redirect(303, `/${params.lang}/account/profile`);
	if (url.searchParams.get('section') === 'profile') throw redirect(303, `/${params.lang}/account/profile`);
	if (url.searchParams.get('section') === 'security') throw redirect(303, `/${params.lang}/security/password`);

	const db = await getDb();
	const selectSeries = {
		id: schema.series.id,
		titleEn: schema.series.titleEn,
		titleTh: schema.series.titleTh,
		posterUrl: schema.series.posterUrl,
		status: schema.series.status,
		studioName: schema.studios.name
	};

	const [favoriteSeries, watchedSeries] = await Promise.all([
		db
			.select(selectSeries)
			.from(schema.favorites)
			.innerJoin(schema.series, eq(schema.favorites.seriesId, schema.series.id))
			.leftJoin(schema.studios, eq(schema.series.studioId, schema.studios.id))
			.where(and(eq(schema.favorites.userId, locals.user.id), isNull(schema.series.deletedAt)))
			.orderBy(desc(schema.favorites.createdAt)),
		db
			.select(selectSeries)
			.from(schema.watched)
			.innerJoin(schema.series, eq(schema.watched.seriesId, schema.series.id))
			.leftJoin(schema.studios, eq(schema.series.studioId, schema.studios.id))
			.where(and(eq(schema.watched.userId, locals.user.id), isNull(schema.series.deletedAt)))
			.orderBy(desc(schema.watched.createdAt))
	]);

	const serialize = (series: typeof favoriteSeries) =>
		series.map((item) => ({
			id: item.id,
			title: params.lang === 'th' ? (item.titleTh ?? item.titleEn) : item.titleEn,
			subtitle: params.lang === 'th' ? item.titleEn : (item.titleTh ?? ''),
			poster: item.posterUrl ?? FALLBACK_POSTER,
			status: item.status,
			studio: item.studioName ?? m.profile_unknown_studio()
		}));

	return {
		favoriteSeries: serialize(favoriteSeries),
		watchedSeries: serialize(watchedSeries)
	};
};
