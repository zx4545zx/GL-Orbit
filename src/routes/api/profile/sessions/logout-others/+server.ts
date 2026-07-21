import { json } from '@sveltejs/kit';
import { and, eq, not } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import { sessions } from '$lib/server/db/schema.js';
import { checkRateLimit } from '$lib/server/rate-limit/index.js';
import { rateLimitKey } from '$lib/server/rate-limit/keys.js';
import type { SessionMutationResponse } from '$lib/types.js';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	}

	const rate = await checkRateLimit(
		rateLimitKey('sessions:mutate', locals.user.id),
		10,
		60
	);
	if (!rate.allowed) {
		return json(
			{ error: 'ดำเนินการบ่อยเกินไป กรุณาลองใหม่ภายหลัง' },
			{ status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
		);
	}

	try {
		const db = await getDb();
		const revoked = await db
			.delete(sessions)
			.where(
				and(
					eq(sessions.userId, locals.user.id),
					not(eq(sessions.id, locals.session.id))
				)
			)
			.returning({ id: sessions.id });
		const response: SessionMutationResponse = { success: true, revokedCount: revoked.length };
		return json(response);
	} catch {
		return json({ error: 'ไม่สามารถออกจากระบบอุปกรณ์อื่นได้' }, { status: 500 });
	}
};
