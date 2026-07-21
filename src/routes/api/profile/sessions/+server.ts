import { json } from '@sveltejs/kit';
import { and, eq, gt, lte } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db/index.js';
import { sessions } from '$lib/server/db/schema.js';
import type { DeviceSessionItem, SessionsResponse } from '$lib/types.js';

const DEVICE_TYPES = new Set(['desktop', 'mobile', 'tablet', 'unknown']);

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	}

	try {
		const db = await getDb();
		const now = new Date();
		await db
			.delete(sessions)
			.where(and(eq(sessions.userId, locals.user.id), lte(sessions.expiresAt, now)));

		const rows = await db
			.select({
				id: sessions.id,
				browser: sessions.browser,
				operatingSystem: sessions.operatingSystem,
				deviceType: sessions.deviceType,
				maskedIp: sessions.maskedIp,
				city: sessions.city,
				countryCode: sessions.countryCode,
				createdAt: sessions.createdAt,
				lastSeenAt: sessions.lastSeenAt,
				expiresAt: sessions.expiresAt
			})
			.from(sessions)
			.where(and(eq(sessions.userId, locals.user.id), gt(sessions.expiresAt, now)));

		const response: SessionsResponse = {
			sessions: rows
				.map((row): DeviceSessionItem => {
					const lastSeenAt = row.lastSeenAt ?? row.createdAt;
					return {
						id: row.id,
						browser: row.browser,
						operatingSystem: row.operatingSystem,
						deviceType: DEVICE_TYPES.has(row.deviceType ?? '')
							? (row.deviceType as DeviceSessionItem['deviceType'])
							: 'unknown',
						maskedIp: row.maskedIp,
						city: row.city,
						countryCode: row.countryCode,
						createdAt: row.createdAt.toISOString(),
						lastSeenAt: lastSeenAt.toISOString(),
						expiresAt: row.expiresAt.toISOString(),
						isCurrent: row.id === locals.session!.id
					};
				})
				.sort((a, b) => {
					if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
					return Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt);
				})
		};

		return json(response);
	} catch {
		return json({ error: 'ไม่สามารถโหลดเซสชันได้' }, { status: 500 });
	}
};
