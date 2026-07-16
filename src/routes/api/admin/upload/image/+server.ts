import { json, error } from '@sveltejs/kit';
import { ImageUploadValidationError, uploadImage } from '$lib/server/r2.js';
import type { RequestHandler } from './$types.js';

const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	try {
		const contentLength = Number(request.headers.get('content-length') ?? '0');
		if (contentLength > MAX_REQUEST_BYTES) {
			return json({ success: false, error: 'ไฟล์หลังบีบอัดต้องไม่เกิน 4 MB' }, { status: 413 });
		}

		const formData = await request.formData();
		const file = formData.get('file');
		const type = formData.get('type');
		const purpose = formData.get('purpose');

		if (!file || !(file instanceof File)) {
			return json({ success: false, error: 'กรุณาเลือกไฟล์รูปภาพ' }, { status: 400 });
		}

		if (type !== 'posters' && type !== 'covers' && type !== 'profiles') {
			return json({ success: false, error: 'ประเภทรูปภาพไม่ถูกต้อง' }, { status: 400 });
		}
		if ((type === 'covers') !== (purpose === 'cover')) {
			return json({ success: false, error: 'ประเภทภาพปกไม่ตรงกับการใช้งาน' }, { status: 400 });
		}

		const result = await uploadImage(file, type);
		return json({ success: true, url: result.url, key: result.key });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ';
		const status = err instanceof ImageUploadValidationError ? 400 : 500;
		return json({ success: false, error: message }, { status });
	}
};
