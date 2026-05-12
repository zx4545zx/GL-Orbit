import type { Actions, PageServerLoad } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { episodeSchedules, episodes, series, platforms } from '$lib/server/db/schema.js';
import { eq, isNull, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return { episodes: [], platforms: [] };
	}

	const db = await getDb();

	const allEpisodes = await db
		.select({
			id: episodes.id,
			episodeNumber: episodes.episodeNumber,
			seriesTitle: series.titleEn
		})
		.from(episodes)
		.innerJoin(series, eq(episodes.seriesId, series.id))
		.where(isNull(episodes.deletedAt))
		.orderBy(asc(series.titleEn), asc(episodes.episodeNumber));

	const allPlatforms = await db
		.select({ id: platforms.id, name: platforms.name })
		.from(platforms)
		.where(isNull(platforms.deletedAt))
		.orderBy(asc(platforms.name));

	return { episodes: allEpisodes, platforms: allPlatforms };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const episodeId = formData.get('episodeId')?.toString() ?? '';
		const platformId = formData.get('platformId')?.toString() ?? '';
		const airDate = formData.get('airDate')?.toString() ?? '';
		const streamLink = formData.get('streamLink')?.toString().trim() || null;
		const isUncut = formData.get('isUncut') === 'on';

		if (!episodeId || !platformId || !airDate) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.insert(episodeSchedules).values({
			episodeId,
			platformId,
			airDate: new Date(airDate),
			streamLink,
			isUncut
		});

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const episodeId = formData.get('episodeId')?.toString() ?? '';
		const platformId = formData.get('platformId')?.toString() ?? '';
		const airDate = formData.get('airDate')?.toString() ?? '';
		const streamLink = formData.get('streamLink')?.toString().trim() || null;
		const isUncut = formData.get('isUncut') === 'on';

		if (!id || !episodeId || !platformId || !airDate) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.update(episodeSchedules)
			.set({ episodeId, platformId, airDate: new Date(airDate), streamLink, isUncut })
			.where(eq(episodeSchedules.id, id));

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';

		if (!id) {
			return fail(400, { error: 'ไม่พบรายการที่ต้องการลบ' });
		}

		const db = await getDb();
		await db.update(episodeSchedules)
			.set({ deletedAt: new Date() })
			.where(eq(episodeSchedules.id, id));

		return { success: true };
	}
};
