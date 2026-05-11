import type { Actions, PageServerLoad } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { getUserByEmail, createUser } from '$lib/server/auth/user.js';
import { hashPassword } from '$lib/server/auth/password.js';
import { createSession } from '$lib/server/auth/session.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/profile');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString().trim() ?? '';
		const email = formData.get('email')?.toString().trim() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';
		const displayName = formData.get('displayName')?.toString().trim() || username;

		if (!username || !email || !password) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน', username, email, displayName });
		}

		if (password.length < 6) {
			return fail(400, { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', username, email, displayName });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'รหัสผ่านไม่ตรงกัน', username, email, displayName });
		}

		const existing = await getUserByEmail(email);
		if (existing) {
			return fail(400, { error: 'อีเมลนี้ถูกใช้งานแล้ว', username, email, displayName });
		}

		const passwordHash = await hashPassword(password);

		const user = await createUser({
			username,
			email,
			passwordHash,
			role: 'USER',
			displayName
		});

		const { token, expiresAt } = await createSession(user.id);

		cookies.set('session', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			expires: expiresAt
		});

		redirect(302, '/profile');
	}
};
