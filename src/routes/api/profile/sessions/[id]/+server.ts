import { json } from '@sveltejs/kit';
import { and, eq, not } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import { sessions } from '$lib/server/db/schema.js';
import { checkRateLimit } from '$lib/server/rate-limit/index.js';
import { rateLimitKey } from '$lib/server/rate-limit/keys.js';
import type { SessionMutationResponse } from '$lib/types.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || !locals.session) {
		return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	}
	if (!UUID_PATTERN.test(params.id)) {
		return json({ error: 'รหัสเซสชันไม่ถูกต้อง' }, { status: 400 });
	}

	const rate = await checkRateLimit(rateLimitKey('sessions:mutate', locals.user.id), 10, 60);
	if (!rate.allowed) {
		return json(
			{ error: 'ดำเนินการบ่อยเกินไป กรุณาลองใหม่ภายหลัง' },
			{ status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
		);
	}
	if (params.id === locals.session.id) {
		return json({ error: 'ไม่สามารถยกเลิกเซสชันปัจจุบันได้' }, { status: 400 });
	}

	try {
		const db = await getDb();
		const revoked = await db
			.delete(sessions)
			.where(
				and(
					eq(sessions.id, params.id),
					eq(sessions.userId, locals.user.id),
					not(eq(sessions.id, locals.session.id))
				)
			)
			.returning({ id: sessions.id });
		const response: SessionMutationResponse = { success: true, revokedCount: revoked.length };
		return json(response);
	} catch {
		return json({ error: 'ไม่สามารถยกเลิกเซสชันได้' }, { status: 500 });
	}
};
