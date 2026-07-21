import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '$lib/server/auth/password.js';
import { checkRateLimit } from '$lib/server/rate-limit/index.js';
import { rateLimitKey } from '$lib/server/rate-limit/keys.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || !locals.session) {
		return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	}
	let body: { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown };
	try { body = await request.json(); } catch { return json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 }); }

	const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
	const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
	const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

	if (!currentPassword || !newPassword || !confirmPassword) return json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
	if (newPassword.length < 6) return json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
	if (newPassword !== confirmPassword) return json({ error: 'รหัสผ่านใหม่ไม่ตรงกัน' }, { status: 400 });

	const rate = await checkRateLimit(rateLimitKey('profile:password', locals.user.id), 10, 60);
	if (!rate.allowed) {
		return json(
			{ error: 'ดำเนินการบ่อยเกินไป กรุณาลองใหม่ภายหลัง' },
			{ status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
		);
	}

	try {
		const db = await getDb();
		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, locals.user.id))
			.limit(1);
		if (!user) return json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
		if (!(await verifyPassword(currentPassword, user.passwordHash))) {
			return json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
		}

		const newHash = await hashPassword(newPassword);
		const result = await db.execute(sql`
			WITH updated_user AS (
				UPDATE users
				SET password_hash = ${newHash}, updated_at = now()
				WHERE id = ${locals.user.id}
				RETURNING id
			), revoked AS (
				DELETE FROM sessions
				WHERE user_id = ${locals.user.id}
					AND id <> ${locals.session.id}
					AND EXISTS (SELECT 1 FROM updated_user)
				RETURNING id
			)
			SELECT count(*)::int AS revoked_count FROM revoked
		`);
		const rawCount = (result.rows[0] as { revoked_count?: unknown } | undefined)?.revoked_count;
		const parsedCount = Number(rawCount);
		return json({
			success: true,
			message: 'เปลี่ยนรหัสผ่านสำเร็จ',
			revokedCount: Number.isFinite(parsedCount) ? parsedCount : 0
		});
	} catch {
		return json({ error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' }, { status: 500 });
	}
};
