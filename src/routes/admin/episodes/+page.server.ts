import type { Actions, PageServerLoad } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { episodes, series } from '$lib/server/db/schema.js';
import { eq, isNull, asc } from 'drizzle-orm';
import { createFollowerNotifications } from '$lib/server/notifications.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return { seriesList: [] };
	}

	const db = await getDb();
	const allSeries = await db
		.select({ id: series.id, titleEn: series.titleEn })
		.from(series)
		.where(isNull(series.deletedAt))
		.orderBy(asc(series.titleEn));

	return { seriesList: allSeries };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const seriesId = formData.get('seriesId')?.toString() ?? '';
		const episodeNumber = parseInt(formData.get('episodeNumber')?.toString() ?? '0', 10);
		const title = formData.get('title')?.toString().trim() || null;
		const coverUrl = formData.get('coverUrl')?.toString().trim() || null;
		const trailerUrl = formData.get('trailerUrl')?.toString().trim() || null;

		if (!seriesId || episodeNumber < 1) {
			return fail(400, { error: 'กรุณาเลือกซีรีส์และกรอกหมายเลขตอน' });
		}

		const db = await getDb();
		await db.insert(episodes).values({
			seriesId,
			episodeNumber,
			title,
			coverUrl,
			trailerUrl
		});

		// Notify followers
		try {
			const [seriesInfo] = await db
				.select({ titleEn: series.titleEn })
				.from(series)
				.where(eq(series.id, seriesId))
				.limit(1);

			const episodeLabel = title ? `EP.${episodeNumber} ${title}` : `EP.${episodeNumber}`;
			const message = `มีตอนใหม่: ${episodeLabel}`;
			await createFollowerNotifications(seriesId, 'new_episode', message, locals.user.id);
		} catch {
			// Notification failure should not break episode creation
		}

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const seriesId = formData.get('seriesId')?.toString() ?? '';
		const episodeNumber = parseInt(formData.get('episodeNumber')?.toString() ?? '0', 10);
		const title = formData.get('title')?.toString().trim() || null;
		const coverUrl = formData.get('coverUrl')?.toString().trim() || null;
		const trailerUrl = formData.get('trailerUrl')?.toString().trim() || null;

		if (!id || !seriesId || episodeNumber < 1) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.update(episodes)
			.set({ seriesId, episodeNumber, title, coverUrl, trailerUrl })
			.where(eq(episodes.id, id));

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
		await db.update(episodes)
			.set({ deletedAt: new Date() })
			.where(eq(episodes.id, id));

		return { success: true };
	}
};
