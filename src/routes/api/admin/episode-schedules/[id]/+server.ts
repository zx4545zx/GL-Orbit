import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { episodeSchedules } from '$lib/server/db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;
	if (!id) {
		error(400, 'ไม่พบ ID');
	}

	const db = await getDb();
	const body = await request.json();

	const { episodeId, platformId, airDate, streamLink, isUncut } = body;

	if (!episodeId || !platformId || !airDate) {
		error(400, 'กรุณากรอกข้อมูลให้ครบถ้วน (episodeId, platformId, airDate)');
	}

	const [updated] = await db
		.update(episodeSchedules)
		.set({
			episodeId,
			platformId,
			airDate: new Date(airDate + '+07:00'),
			streamLink: streamLink ?? null,
			isUncut: isUncut ?? false
		})
		.where(and(eq(episodeSchedules.id, id), isNull(episodeSchedules.deletedAt)))
		.returning();

	if (!updated) {
		error(404, 'ไม่พบตารางฉายที่ต้องการแก้ไข');
	}

	return json(updated);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const { id } = params;
	if (!id) {
		error(400, 'ไม่พบ ID');
	}

	const db = await getDb();

	const [deleted] = await db
		.update(episodeSchedules)
		.set({ deletedAt: new Date() })
		.where(and(eq(episodeSchedules.id, id), isNull(episodeSchedules.deletedAt)))
		.returning();

	if (!deleted) {
		error(404, 'ไม่พบตารางฉายที่ต้องการลบ');
	}

	return json({ success: true });
};
