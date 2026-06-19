import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getUserByIdentifier } from '$lib/server/auth/user.js';
import { verifyPassword } from '$lib/server/auth/password.js';
import { createSession } from '$lib/server/auth/session.js';
import { toPublicUser } from '$lib/server/auth/public-user.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: { identifier?: unknown; password?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
	}

	const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
	const password = typeof body.password === 'string' ? body.password : '';

	if (!identifier || !password) {
		return json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
	}

	const user = await getUserByIdentifier(identifier);
	if (!user) return json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 400 });
	if (!user.isActive) return json({ error: 'บัญชีนี้ถูกปิดใช้งาน' }, { status: 400 });

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) return json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 400 });

	const { token, expiresAt } = await createSession(user.id);
	cookies.set('session', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		expires: expiresAt
	});

	return json({
		success: true,
		user: toPublicUser(user)
	});
};
