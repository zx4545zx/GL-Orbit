import { json } from '@sveltejs/kit';
import { createChatConversation, listChatConversations } from '$lib/server/chat/history.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	return json({ conversations: await listChatConversations(locals.user.id) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	let title = 'แชตใหม่';
	try {
		const body = await request.json() as { title?: unknown };
		if (typeof body.title === 'string' && body.title.trim()) title = body.title.trim();
	} catch {
		// Empty body is valid for new chat.
	}

	return json({ conversation: await createChatConversation(locals.user.id, title) }, { status: 201 });
};
