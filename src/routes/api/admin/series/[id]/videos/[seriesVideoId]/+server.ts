import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { deleteSeriesVideo, SeriesVideoMutationError } from '$lib/server/series-videos/mutations.js';
import type { RequestHandler } from './$types.js';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return json({ success: false, error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
	}
	try {
		const db = await getDb();
		await deleteSeriesVideo(db, params.id, params.seriesVideoId);
		return json({ success: true });
	} catch (error) {
		if (error instanceof SeriesVideoMutationError) {
			return json({ success: false, code: error.code, error: error.message }, { status: error.status });
		}
		return json({ success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' }, { status: 500 });
	}
};
