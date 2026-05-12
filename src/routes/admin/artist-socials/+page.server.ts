import type { Actions, PageServerLoad } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { artistSocials, artists } from '$lib/server/db/schema.js';
import { eq, isNull, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return { artists: [] };
	}

	const db = await getDb();
	const allArtists = await db
		.select({ id: artists.id, nickname: artists.nickname })
		.from(artists)
		.where(isNull(artists.deletedAt))
		.orderBy(asc(artists.nickname));

	return { artists: allArtists };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const artistId = formData.get('artistId')?.toString() ?? '';
		const platform = formData.get('platform')?.toString().trim() ?? '';
		const url = formData.get('url')?.toString().trim() ?? '';
		const iconUrl = formData.get('iconUrl')?.toString().trim() || null;

		if (!artistId || !platform || !url) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.insert(artistSocials).values({ artistId, platform, url, iconUrl });

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'ไม่มีสิทธิ์เข้าถึง' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const artistId = formData.get('artistId')?.toString() ?? '';
		const platform = formData.get('platform')?.toString().trim() ?? '';
		const url = formData.get('url')?.toString().trim() ?? '';
		const iconUrl = formData.get('iconUrl')?.toString().trim() || null;

		if (!id || !artistId || !platform || !url) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		const db = await getDb();
		await db.update(artistSocials)
			.set({ artistId, platform, url, iconUrl })
			.where(eq(artistSocials.id, id));

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
		await db.delete(artistSocials).where(eq(artistSocials.id, id));

		return { success: true };
	}
};
