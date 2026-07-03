import { json, error } from '@sveltejs/kit';
import { uploadImage } from '$lib/server/r2.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file');
		const type = formData.get('type');

		if (!file || !(file instanceof File)) {
			return json({ success: false, error: 'กรุณาเลือกไฟล์รูปภาพ' }, { status: 400 });
		}

		if (type !== 'posters' && type !== 'profiles') {
			return json({ success: false, error: 'ประเภทรูปภาพไม่ถูกต้อง' }, { status: 400 });
		}

		const result = await uploadImage(file, type);
		return json({ success: true, url: result.url, key: result.key });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ';
		return json({ success: false, error: message }, { status: 500 });
	}
};
