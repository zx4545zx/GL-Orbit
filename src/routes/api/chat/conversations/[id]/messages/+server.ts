import { json } from '@sveltejs/kit';
import { getChatMessages } from '$lib/server/chat/history.js';
import { startAiChat, AiChatError } from '$lib/server/ai/chat.js';
import { checkRateLimit } from '$lib/server/rate-limit/index.js';
import { rateLimitKey } from '$lib/server/rate-limit/keys.js';
import type { RequestHandler } from './$types.js';


export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	const messages = await getChatMessages(locals.user.id, params.id);
	if (!messages) return json({ error: 'ไม่พบแชตนี้' }, { status: 404 });
	return json({ messages });
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	try {
		const rate = await checkRateLimit(rateLimitKey('ai-chat', locals.user.id), 20, 60);
		if (!rate.allowed) return json({ error: 'Too many chat requests. Please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
		const body = await request.json() as { message?: unknown; profileId?: unknown };
		return await startAiChat({ userId: locals.user.id, conversationId: params.id, text: body.message, profileId: body.profileId, language: locals.user.preferredLanguage, abortSignal: request.signal });
	} catch (err) {
		if (err instanceof AiChatError) return json({ error: err.message }, { status: err.status });
		return json({ error: 'AI provider could not complete this request.' }, { status: 502 });
	}
};
