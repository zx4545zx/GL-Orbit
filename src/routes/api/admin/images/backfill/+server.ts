import { json, error } from '@sveltejs/kit';
import { backfillLegacyImages } from '$lib/server/images/backfill.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	try {
		const result = await backfillLegacyImages();
		return json({ success: true, ...result });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'backfill ไม่สำเร็จ';
		return json({ success: false, error: message }, { status: 500 });
	}
};
