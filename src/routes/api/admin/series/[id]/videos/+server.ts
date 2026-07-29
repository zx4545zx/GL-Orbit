import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import {
	createSeriesVideo,
	listSeriesVideos,
	reorderSeriesVideos,
	SeriesVideoMutationError
} from '$lib/server/series-videos/mutations.js';
import type { RequestHandler } from './$types.js';

const unexpected = () => json({ success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' }, { status: 500 });

function forbidden(locals: App.Locals) {
	return !locals.user || locals.user.role !== 'ADMIN'
		? json({ success: false, error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
		: null;
}

function mutationFailure(error: unknown) {
	return error instanceof SeriesVideoMutationError
		? json({ success: false, code: error.code, error: error.message }, { status: error.status })
		: unexpected();
}

async function bodyOrError(request: Request, code: 'INVALID_TYPE' | 'INVALID_REORDER'): Promise<
	| { body: Record<string, unknown>; response?: never }
	| { response: Response; body?: never }
> {
	try {
		return { body: await request.json() as Record<string, unknown> };
	} catch {
		return { response: json({ success: false, code, error: code === 'INVALID_TYPE' ? 'ประเภทวิดีโอไม่ถูกต้อง' : 'ลำดับวิดีโอไม่ถูกต้อง' }, { status: 400 }) };
	}
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const denied = forbidden(locals);
	if (denied) return denied;
	try {
		const db = await getDb();
		return json({ success: true, data: await listSeriesVideos(db, params.id) });
	} catch (error) {
		return mutationFailure(error);
	}
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const denied = forbidden(locals);
	if (denied) return denied;
	const parsed = await bodyOrError(request, 'INVALID_TYPE');
	if (parsed.response) return parsed.response;
	const { type, titleTh, titleEn, youtubeUrl } = parsed.body;
	try {
		const db = await getDb();
		const data = await createSeriesVideo(db, { seriesId: params.id, type, titleTh, titleEn, youtubeUrl });
		return json({ success: true, data }, { status: 201 });
	} catch (error) {
		return mutationFailure(error);
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const denied = forbidden(locals);
	if (denied) return denied;
	const parsed = await bodyOrError(request, 'INVALID_REORDER');
	if (parsed.response) return parsed.response;
	const { type, videoIds } = parsed.body;
	try {
		const db = await getDb();
		await reorderSeriesVideos(db, { seriesId: params.id, type, videoIds });
		return json({ success: true });
	} catch (error) {
		return mutationFailure(error);
	}
};
