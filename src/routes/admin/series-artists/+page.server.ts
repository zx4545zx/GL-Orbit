import type { Actions, PageServerLoad } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { seriesArtists, series, artists } from '$lib/server/db/schema.js';
import { eq, and, isNull, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return { seriesList: [], artists: [] };
	}

	const db = await getDb();

	const allSeries = await db
		.select({ id: series.id, titleEn: series.titleEn })
		.from(series)
		.where(isNull(series.deletedAt))
		.orderBy(asc(series.titleEn));

	const allArtists = await db
		.select({ id: artists.id, nickname: artists.nickname })
		.from(artists)
		.where(isNull(artists.deletedAt))
		.orderBy(asc(artists.nickname));

	return { seriesList: allSeries, artists: allArtists };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const seriesId = formData.get('seriesId')?.toString() ?? '';
		const artistId = formData.get('artistId')?.toString() ?? '';
		const roleName = formData.get('roleName')?.toString().trim() || null;

		if (!seriesId || !artistId) {
			return fail(400, { error: 'กรุณาเลือกซีรีส์และนักแสดง' });
		}

		const db = await getDb();
		await db.insert(seriesArtists).values({ seriesId, artistId, roleName });

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const seriesId = formData.get('seriesId')?.toString() ?? '';
		const artistId = formData.get('artistId')?.toString() ?? '';
		const roleName = formData.get('roleName')?.toString().trim() || null;

		if (!seriesId || !artistId) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.update(seriesArtists)
			.set({ roleName })
			.where(and(eq(seriesArtists.seriesId, seriesId), eq(seriesArtists.artistId, artistId)));

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const seriesId = formData.get('seriesId')?.toString() ?? '';
		const artistId = formData.get('artistId')?.toString() ?? '';

		if (!seriesId || !artistId) {
			return fail(400, { error: 'ไม่พบรายการที่ต้องการลบ' });
		}

		const db = await getDb();
		await db.delete(seriesArtists)
			.where(and(eq(seriesArtists.seriesId, seriesId), eq(seriesArtists.artistId, artistId)));

		return { success: true };
	}
};
