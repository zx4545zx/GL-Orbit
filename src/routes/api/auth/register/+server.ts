import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getUserByEmail, getUserByUsername, createUser } from '$lib/server/auth/user.js';
import { hashPassword } from '$lib/server/auth/password.js';
import { createSession } from '$lib/server/auth/session.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: { username?: unknown; email?: unknown; displayName?: unknown; password?: unknown; confirmPassword?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
	}

	const username = typeof body.username === 'string' ? body.username.trim() : '';
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const displayNameInput = typeof body.displayName === 'string' ? body.displayName.trim() : '';
	const displayName = displayNameInput || username;
	const password = typeof body.password === 'string' ? body.password : '';
	const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

	if (!username || !email || !password) return json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
	if (password.length < 6) return json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
	if (password !== confirmPassword) return json({ error: 'รหัสผ่านไม่ตรงกัน' }, { status: 400 });
	if (await getUserByEmail(email)) return json({ error: 'อีเมลนี้ถูกใช้งานแล้ว', fields: { email: 'อีเมลนี้ถูกใช้งานแล้ว' } }, { status: 400 });
	if (await getUserByUsername(username)) return json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', fields: { username: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' } }, { status: 400 });

	const passwordHash = await hashPassword(password);
	const user = await createUser({ username, email, passwordHash, role: 'USER', displayName });
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
		user: { id: user.id, username: user.username, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, role: user.role }
	});
};
