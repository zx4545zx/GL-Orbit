import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sendNotificationToUsers } from '$lib/server/notifications.js';
import { getDb } from '$lib/server/db/index.js';
import { series } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

const MESSAGE_MAX_LENGTH = 500;

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
	}

	const body = (await request.json()) as {
		seriesId?: unknown;
		recipientType?: unknown;
		message?: unknown;
	};

	const seriesId = typeof body.seriesId === 'string' ? body.seriesId : undefined;
	const recipientType = body.recipientType === 'followers' || body.recipientType === 'global' ? body.recipientType : undefined;
	const message = typeof body.message === 'string' ? body.message.trim() : undefined;

	if (!seriesId) return json({ error: 'กรุณาเลือกซีรีส์' }, { status: 400 });
	if (!recipientType) return json({ error: 'กรุณาเลือกประเภทผู้รับ' }, { status: 400 });
	if (!message || message.length === 0) return json({ error: 'กรุณากรอกข้อความ' }, { status: 400 });
	if (message.length > MESSAGE_MAX_LENGTH) {
		return json({ error: `ข้อความต้องไม่เกิน ${MESSAGE_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
	}

	const db = await getDb();
	const [seriesRow] = await db.select({ id: series.id }).from(series).where(eq(series.id, seriesId));
	if (!seriesRow) return json({ error: 'ไม่พบซีรีส์' }, { status: 404 });

	const sentCount = await sendNotificationToUsers(seriesId, 'announcement', message, recipientType, locals.user.id);

	return json({ success: true, sentCount });
};
