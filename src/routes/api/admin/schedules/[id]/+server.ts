import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { seriesSchedules } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json() as {
		seriesId?: string;
		platformId?: string;
		dayOfWeek?: number;
		airTime?: string;
		isUncut?: boolean;
	};

	if (!body.seriesId || !body.platformId || body.dayOfWeek === undefined || !body.airTime) {
		error(400, 'กรุณากรอกข้อมูลให้ครบถ้วน');
	}

	const db = await getDb();

	const [updated] = await db
		.update(seriesSchedules)
		.set({
			seriesId: body.seriesId,
			platformId: body.platformId,
			dayOfWeek: body.dayOfWeek,
			airTime: body.airTime,
			isUncut: body.isUncut ?? false
		})
		.where(eq(seriesSchedules.id, params.id))
		.returning();

	return json({ data: updated });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const db = await getDb();

	await db
		.delete(seriesSchedules)
		.where(eq(seriesSchedules.id, params.id));

	return json({ success: true });
};
