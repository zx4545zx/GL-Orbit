import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series, seriesGenres } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { createFollowerNotifications } from '$lib/server/notifications.js';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const id = params.id;
	const body = await request.json();
	const { titleEn, titleTh, studioId, posterUrl, status, genreIds } = body;

	if (!titleEn) {
		return json({ success: false, error: 'กรุณากรอกชื่อซีรีส์ (EN)' }, { status: 400 });
	}

	const db = await getDb();

	const [prev] = await db
		.select({ status: series.status, titleEn: series.titleEn })
		.from(series)
		.where(eq(series.id, id))
		.limit(1);

	const [updated] = await db.update(series)
		.set({
			titleEn,
			titleTh: titleTh ?? null,
			studioId: studioId ?? null,
			posterUrl: posterUrl ?? null,
			status: status ?? 'UPCOMING'
		})
		.where(eq(series.id, id))
		.returning({
			id: series.id,
			titleEn: series.titleEn,
			titleTh: series.titleTh,
			studioId: series.studioId,
			posterUrl: series.posterUrl,
			status: series.status
		});

	// Update genres
	await db.delete(seriesGenres).where(eq(seriesGenres.seriesId, id));
	if (genreIds?.length > 0) {
		await db.insert(seriesGenres).values(genreIds.map((gid: string) => ({ seriesId: id, genreId: gid })));
	}

	// Notify followers if status changed
	if (prev && prev.status !== status) {
		try {
			const statusLabels: Record<string, string> = {
				UPCOMING: 'กำลังจะมาฉาย',
				ONGOING: 'กำลังฉาย',
				ENDED: 'จบแล้ว'
			};
			const message = `สถานะของซีรีส์ "${prev.titleEn}" เปลี่ยนเป็น "${statusLabels[status] || status}"`;
			await createFollowerNotifications(id, 'status_change', message, locals.user.id);
		} catch {}
	}

	return json({ success: true, data: updated });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const id = params.id;
	const db = await getDb();
	await db.update(series).set({ deletedAt: new Date() }).where(eq(series.id, id));

	return json({ success: true });
};
