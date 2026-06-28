import { json } from '@sveltejs/kit';
import { buildAnswerPrompt, buildSqlPrompt } from '$lib/server/chat/schema-context.js';
import { callMiniMax, MiniMaxConfigError } from '$lib/server/chat/minimax.js';
import { makeSafeReadSql } from '$lib/server/chat/sql-safety.js';
import { runReadOnlyQuery } from '$lib/server/chat/read-only-db.js';
import {
	appendChatExchange,
	createChatConversation,
	listChatConversations
} from '$lib/server/chat/history.js';
import type { RequestHandler } from './$types.js';

const MAX_MESSAGE_LENGTH = 500;
const OUT_OF_SCOPE_REPLY = 'ตอนนี้ฉันช่วยตอบได้เฉพาะคำถามเกี่ยวกับข้อมูลซีรีส์ใน GL-Orbit เท่านั้นค่ะ';

function parseMessage(body: unknown) {
	if (!body || typeof body !== 'object' || !('message' in body)) return '';
	const message = (body as { message?: unknown }).message;
	return typeof message === 'string' ? message.trim() : '';
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	return json({ conversations: await listChatConversations(locals.user.id) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
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

	const conversation = await createChatConversation(locals.user.id, message);

	try {
		const generatedSql = await callMiniMax([
			{ role: 'system', content: 'You convert user questions into safe PostgreSQL SELECT queries. Return SQL only.' },
			{ role: 'user', content: buildSqlPrompt(message) }
		]);
		const safeSql = makeSafeReadSql(generatedSql);

		if (!safeSql.ok) return json({ error: 'ไม่สามารถหาคำตอบที่ปลอดภัยได้' }, { status: 422 });

		if (safeSql.outOfScope) {
			await appendChatExchange(locals.user.id, conversation.id, message, OUT_OF_SCOPE_REPLY);
			return json({ reply: OUT_OF_SCOPE_REPLY, conversationId: conversation.id });
		}

		const rows = await runReadOnlyQuery(safeSql.sql);
		const reply = await callMiniMax([
			{
				role: 'system',
				content: 'Answer like a friendly series guide. Use the same language as the user. Do not mention SQL, database, rows, schemas, backend, models, or internal process.'
			},
			{ role: 'user', content: buildAnswerPrompt(message, rows) }
		]);

		await appendChatExchange(locals.user.id, conversation.id, message, reply);
		return json({ reply, conversationId: conversation.id });
	} catch (err) {
		if (err instanceof MiniMaxConfigError || (err instanceof Error && err.message.includes('READONLY_DATABASE_URL'))) {
			return json({ error: 'ยังไม่ได้ตั้งค่า AI chat ให้ครบถ้วน' }, { status: 500 });
		}
		console.error('Series chat API error:', err);
		return json({ error: 'เกิดข้อผิดพลาดในการตอบคำถามซีรีส์' }, { status: 500 });
	}
};
