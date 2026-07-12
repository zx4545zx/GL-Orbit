import { json } from '@sveltejs/kit';
import { deleteImageVariants, ImageUploadValidationError, uploadImage } from '$lib/server/r2.js';
import { appendMomentMedia, getMomentMediaUploadAccess } from '$lib/server/moments/mutations.js';
import type { RequestHandler } from './$types.js';

const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	const contentLength = Number(request.headers.get('content-length') ?? '0');
	if (contentLength > MAX_REQUEST_BYTES) return json({ error: 'ไฟล์หลังบีบอัดต้องไม่เกิน 4 MB' }, { status: 413 });

	const access = await getMomentMediaUploadAccess(params.id, locals.user.id);
	if (access === 'FORBIDDEN') return json({ error: 'ไม่มีสิทธิ์อัปโหลดรูปภาพสำหรับ Moment นี้' }, { status: 403 });
	if (access !== 'OK') return json({ error: 'ไม่สามารถอัปโหลดรูปภาพเพิ่มได้' }, { status: 400 });

	let uploaded: { url: string; key: string } | null = null;
	try {
		const file = (await request.formData()).get('file');
		if (!(file instanceof File)) return json({ error: 'กรุณาเลือกไฟล์รูปภาพ' }, { status: 400 });
		if (!IMAGE_TYPES.has(file.type)) return json({ error: 'ไฟล์ต้องเป็นรูปภาพ (JPEG, PNG, WebP)' }, { status: 400 });
		if (file.size > MAX_REQUEST_BYTES) return json({ error: 'ไฟล์ต้องมีขนาดไม่เกิน 4 MB' }, { status: 413 });
		uploaded = await uploadImage(file, 'moments');
		if (!await appendMomentMedia({ momentId: params.id, authorId: locals.user.id, key: uploaded.key, url: uploaded.url })) {
			await deleteImageVariants(uploaded.key);
			return json({ error: 'ไม่สามารถอัปโหลดรูปภาพเพิ่มได้' }, { status: 400 });
		}
		return json({ url: uploaded.url }, { status: 201 });
	} catch (err) {
		if (uploaded) await deleteImageVariants(uploaded.key);
		const message = err instanceof ImageUploadValidationError ? err.message : 'อัปโหลดไม่สำเร็จ';
		return json({ error: message }, { status: err instanceof ImageUploadValidationError ? 400 : 500 });
	}
};
