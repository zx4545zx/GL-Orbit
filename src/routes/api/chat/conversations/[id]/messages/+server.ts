import { json } from '@sveltejs/kit';
import { buildConversationContextPrompt } from '$lib/server/chat/context.js';
import {
	appendChatExchange,
	getChatMessages,
	getRecentChatContext
} from '$lib/server/chat/history.js';
import { buildAnswerPrompt, buildFollowupPrompt, buildSqlPrompt, parseFollowupSuggestions } from '$lib/server/chat/schema-context.js';
import { callMiniMax, MiniMaxConfigError } from '$lib/server/chat/minimax.js';
import { runReadOnlyQuery } from '$lib/server/chat/read-only-db.js';
import { makeSafeReadSql } from '$lib/server/chat/sql-safety.js';
import { getSeriesCatalogText } from '$lib/server/chat/catalog.js';
import type { RequestHandler } from './$types.js';

const MAX_MESSAGE_LENGTH = 500;
const OUT_OF_SCOPE_REPLY = 'ตอนนี้ฉันช่วยตอบได้เฉพาะคำถามเกี่ยวกับข้อมูลซีรีส์ใน GL-Orbit เท่านั้นค่ะ';

function parseMessage(body: unknown) {
	if (!body || typeof body !== 'object' || !('message' in body)) return '';
	const message = (body as { message?: unknown }).message;
	return typeof message === 'string' ? message.trim() : '';
}

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	const messages = await getChatMessages(locals.user.id, params.id);
	if (!messages) return json({ error: 'ไม่พบแชตนี้' }, { status: 404 });
	return json({ messages });
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
	}

	const message = parseMessage(body);
	if (!message) return json({ error: 'กรุณาพิมพ์คำถาม' }, { status: 400 });
	if (message.length > MAX_MESSAGE_LENGTH) {
		return json({ error: `คำถามต้องไม่เกิน ${MAX_MESSAGE_LENGTH} ตัวอักษร` }, { status: 400 });
	}

	const recentContext = await getRecentChatContext(locals.user.id, params.id);
	if (!recentContext) return json({ error: 'ไม่พบแชตนี้' }, { status: 404 });

	try {
		const contextPrompt = buildConversationContextPrompt(recentContext);
		const catalog = await getSeriesCatalogText();
		const generatedSql = await callMiniMax([
			{ role: 'system', content: 'You convert user questions into safe PostgreSQL SELECT queries. Return SQL only.' },
			{ role: 'user', content: `${contextPrompt}\n\n${buildSqlPrompt(message, catalog)}`.trim() }
		]);
		const safeSql = makeSafeReadSql(generatedSql);

		if (!safeSql.ok) {
			return json({ error: 'ไม่สามารถหาคำตอบที่ปลอดภัยได้' }, { status: 422 });
		}

		if (safeSql.outOfScope) {
			await appendChatExchange(locals.user.id, params.id, message, OUT_OF_SCOPE_REPLY);
			return json({ reply: OUT_OF_SCOPE_REPLY, suggestions: [] });
		}

		const rows = await runReadOnlyQuery(safeSql.sql);
		const reply = await callMiniMax([
			{
				role: 'system',
				content: 'Answer like a friendly series guide. Use the same language as the user. Do not mention SQL, database, rows, schemas, backend, models, or internal process.'
			},
			{ role: 'user', content: `${contextPrompt}\n\n${buildAnswerPrompt(message, rows)}`.trim() }
		]);

		await appendChatExchange(locals.user.id, params.id, message, reply);

		// แนะนำคำถามต่อยอดจากบทสนทนา (MiniMax call ที่ 3) — ถ้า fail คืน [] เงียบ ๆ ไม่ให้กระทบ reply
		let suggestions: string[] = [];
		try {
			const followupRaw = await callMiniMax([
				{ role: 'system', content: 'You suggest short follow-up questions. Return a JSON array of strings only.' },
				{ role: 'user', content: buildFollowupPrompt(message, reply) }
			]);
			suggestions = parseFollowupSuggestions(followupRaw);
		} catch {
			suggestions = [];
		}

		return json({ reply, suggestions });
	} catch (err) {
		if (err instanceof MiniMaxConfigError || (err instanceof Error && err.message.includes('READONLY_DATABASE_URL'))) {
			return json({ error: 'ยังไม่ได้ตั้งค่า AI chat ให้ครบถ้วน' }, { status: 500 });
		}
		console.error('Conversation message API error:', err);
		return json({ error: 'เกิดข้อผิดพลาดในการตอบคำถามซีรีส์' }, { status: 500 });
	}
};
