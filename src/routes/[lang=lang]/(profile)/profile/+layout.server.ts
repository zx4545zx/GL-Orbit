import { redirect } from '@sveltejs/kit';
import { and, count, eq, isNull } from 'drizzle-orm';
import { toProfileUser } from '$lib/server/auth/public-user.js';
import { getDb } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const db = await getDb();
	const [favoriteResult, watchedResult] = await Promise.all([
		db
			.select({ value: count() })
			.from(schema.favorites)
			.innerJoin(schema.series, eq(schema.favorites.seriesId, schema.series.id))
			.where(
				and(eq(schema.favorites.userId, locals.user.id), isNull(schema.series.deletedAt))
			),
		db
			.select({ value: count() })
			.from(schema.watched)
			.innerJoin(schema.series, eq(schema.watched.seriesId, schema.series.id))
			.where(and(eq(schema.watched.userId, locals.user.id), isNull(schema.series.deletedAt)))
	]);

	return {
		profileUser: toProfileUser(locals.user),
		favoriteCount: favoriteResult[0]?.value ?? 0,
		watchedCount: watchedResult[0]?.value ?? 0
	};
};
