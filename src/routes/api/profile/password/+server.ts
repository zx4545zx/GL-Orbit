import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '$lib/server/auth/password.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	let body: { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown };
	try { body = await request.json(); } catch { return json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 }); }

	const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
	const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
	const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

	if (!currentPassword || !newPassword || !confirmPassword) return json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
	if (newPassword.length < 6) return json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
	if (newPassword !== confirmPassword) return json({ error: 'รหัสผ่านใหม่ไม่ตรงกัน' }, { status: 400 });

	const db = await getDb();
	const [user] = await db.select().from(schema.users).where(eq(schema.users.id, locals.user.id)).limit(1);
	if (!user) return json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
	if (!(await verifyPassword(currentPassword, user.passwordHash))) return json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });

	await db.update(schema.users).set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() }).where(eq(schema.users.id, locals.user.id));
	return json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
};
