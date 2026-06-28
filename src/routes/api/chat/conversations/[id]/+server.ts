import { json } from '@sveltejs/kit';
import {
	deleteChatConversation,
	getOwnedConversation,
	renameChatConversation
} from '$lib/server/chat/history.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	const conversation = await getOwnedConversation(locals.user.id, params.id);
	if (!conversation) return json({ error: 'ไม่พบแชตนี้' }, { status: 404 });
	return json({ conversation });
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	let title = '';
	try {
		const body = await request.json() as { title?: unknown };
		title = typeof body.title === 'string' ? body.title.trim() : '';
	} catch {
		title = '';
	}

	if (!title) return json({ error: 'กรุณาระบุชื่อแชต' }, { status: 400 });
	if (title.length > 120) return json({ error: 'ชื่อแชตยาวเกินไป' }, { status: 400 });

	const conversation = await renameChatConversation(locals.user.id, params.id, title);
	if (!conversation) return json({ error: 'ไม่พบแชตนี้' }, { status: 404 });
	return json({ conversation });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	const deleted = await deleteChatConversation(locals.user.id, params.id);
	if (!deleted) return json({ error: 'ไม่พบแชตนี้' }, { status: 404 });
	return json({ ok: true });
};
