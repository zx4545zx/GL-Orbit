import { m } from '$lib/i18n/paraglide.js';
import { redirect } from '@sveltejs/kit';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { toProfileUser } from '$lib/server/auth/public-user.js';
import { getDb } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import type { PageServerLoad } from './$types.js';

const FALLBACK_POSTER = '/placeholders/poster.svg';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const db = await getDb();
	const favoriteSeries = await db
		.select({
			id: schema.series.id,
			titleEn: schema.series.titleEn,
			titleTh: schema.series.titleTh,
			posterUrl: schema.series.posterUrl,
			status: schema.series.status,
			studioName: schema.studios.name
		})
		.from(schema.favorites)
		.innerJoin(schema.series, eq(schema.favorites.seriesId, schema.series.id))
		.leftJoin(schema.studios, eq(schema.series.studioId, schema.studios.id))
		.where(and(eq(schema.favorites.userId, locals.user.id), isNull(schema.series.deletedAt)))
		.orderBy(desc(schema.favorites.createdAt));

	const watchedSeries = await db
		.select({
			id: schema.series.id,
			titleEn: schema.series.titleEn,
			titleTh: schema.series.titleTh,
			posterUrl: schema.series.posterUrl,
			status: schema.series.status,
			studioName: schema.studios.name
		})
		.from(schema.watched)
		.innerJoin(schema.series, eq(schema.watched.seriesId, schema.series.id))
		.leftJoin(schema.studios, eq(schema.series.studioId, schema.studios.id))
		.where(and(eq(schema.watched.userId, locals.user.id), isNull(schema.series.deletedAt)))
		.orderBy(desc(schema.watched.createdAt));

	return {
		profileUser: toProfileUser(locals.user),
		favoriteSeries: favoriteSeries.map((s) => ({
			id: s.id,
			title: s.titleEn,
			subtitle: s.titleTh ?? '',
			poster: s.posterUrl ?? FALLBACK_POSTER,
			status: s.status,
			studio: s.studioName ?? m.profile_unknown_studio()
		})),
		watchedSeries: watchedSeries.map((s) => ({
			id: s.id,
			title: s.titleEn,
			subtitle: s.titleTh ?? '',
			poster: s.posterUrl ?? FALLBACK_POSTER,
			status: s.status,
			studio: s.studioName ?? m.profile_unknown_studio()
		}))
	};
};
