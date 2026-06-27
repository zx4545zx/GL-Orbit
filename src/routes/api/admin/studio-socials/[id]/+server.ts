import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { studioSocials } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;
	const body = await request.json();
	const { studioId, platform, url, iconUrl } = body;

	if (!studioId || !platform || !url) {
		return json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน (studioId, platform, url)' }, { status: 400 });
	}

	const db = await getDb();

	const [updated] = await db
		.update(studioSocials)
		.set({ studioId, platform, url, iconUrl: iconUrl ?? null })
		.where(eq(studioSocials.id, id))
		.returning({
			id: studioSocials.id,
			studioId: studioSocials.studioId,
			platform: studioSocials.platform,
			url: studioSocials.url,
			iconUrl: studioSocials.iconUrl
		});

	if (!updated) {
		return json({ success: false, error: 'ไม่พบข้อมูลช่องทางที่ระบุ' }, { status: 404 });
	}

	return json({ success: true, data: updated });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;

	const db = await getDb();

	await db.delete(studioSocials).where(eq(studioSocials.id, id));

	return json({ success: true });
};
