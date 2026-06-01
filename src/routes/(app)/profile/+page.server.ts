import type { Actions, PageServerLoad } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '$lib/server/auth/password.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const db = await getDb();

	// Fetch favorited series for this user
	const favoriteSeries = await db
		.select({
			id: schema.series.id,
			titleEn: schema.series.titleEn,
			titleTh: schema.series.titleTh,
			posterUrl: schema.series.posterUrl,
			status: schema.series.status,
			studioName: schema.studios.name
		})
		.from(schema.favorites)
		.innerJoin(schema.series, eq(schema.favorites.seriesId, schema.series.id))
		.leftJoin(schema.studios, eq(schema.series.studioId, schema.studios.id))
		.where(and(
			eq(schema.favorites.userId, locals.user.id),
			isNull(schema.series.deletedAt)
		))
		.orderBy(desc(schema.favorites.createdAt));

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			username: locals.user.username,
			displayName: locals.user.displayName,
			avatarUrl: locals.user.avatarUrl,
			role: locals.user.role,
			createdAt: locals.user.createdAt
		},
		favoriteSeries: favoriteSeries.map((s) => ({
			id: s.id,
			title: s.titleEn,
			subtitle: s.titleTh ?? '',
			poster: s.posterUrl ?? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
			status: s.status,
			studio: s.studioName ?? 'ไม่ระบุสตูดิโอ'
		}))
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'กรุณาเข้าสู่ระบบ' });
		}

		const formData = await request.formData();
		const displayName = formData.get('displayName')?.toString().trim() || null;
		const avatarUrl = formData.get('avatarUrl')?.toString().trim() || null;

		const db = await getDb();
		await db
			.update(schema.users)
			.set({ displayName, avatarUrl })
			.where(eq(schema.users.id, locals.user.id));

		return { success: true, message: 'อัปเดตโปรไฟล์สำเร็จ' };
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'กรุณาเข้าสู่ระบบ' });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword')?.toString() ?? '';
		const newPassword = formData.get('newPassword')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		if (newPassword.length < 6) {
			return fail(400, { error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'รหัสผ่านใหม่ไม่ตรงกัน' });
		}

		const db = await getDb();
		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, locals.user.id))
			.limit(1);

		if (!user) {
			return fail(400, { error: 'ไม่พบผู้ใช้' });
		}

		const valid = await verifyPassword(currentPassword, user.passwordHash);
		if (!valid) {
			return fail(400, { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
		}

		const newPasswordHash = await hashPassword(newPassword);
		await db
			.update(schema.users)
			.set({ passwordHash: newPasswordHash })
			.where(eq(schema.users.id, locals.user.id));

		return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
	}
};
