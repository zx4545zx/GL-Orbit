import type { Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { getUserByIdentifier } from '$lib/server/auth/user.js';
import { verifyPassword } from '$lib/server/auth/password.js';
import { createSession } from '$lib/server/auth/session.js';

export const actions: Actions = {
	default: async ({ request, cookies, params }) => {
		const formData = await request.formData();
		const identifier = formData.get('identifier')?.toString().trim() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		if (!identifier || !password) {
			return fail(400, { error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
		}

		const user = await getUserByIdentifier(identifier);
		if (!user) {
			return fail(400, { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
		}

		if (!user.isActive) {
			return fail(400, { error: 'บัญชีนี้ถูกปิดใช้งาน' });
		}

		if (user.role !== 'ADMIN') {
			return fail(400, { error: 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ กรุณาใช้หน้าเข้าสู่ระบบสำหรับสมาชิก' });
		}

		const valid = await verifyPassword(password, user.passwordHash);
		if (!valid) {
			return fail(400, { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
		}

		const { token, expiresAt } = await createSession(user.id);

		cookies.set('session', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			expires: expiresAt
		});

		throw redirect(303, `/${params.lang}/admin/series`);
	}
};
