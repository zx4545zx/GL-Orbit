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
import { getDeterministicChatSql } from '$lib/server/chat/deterministic.js';
import { buildChatContext } from '$lib/server/chat/context-extract.js';
import {
	buildGeneralChatPrompt,
	classifyChatScope,
	GENERAL_CHAT_SYSTEM_PROMPT
} from '$lib/server/chat/scope.js';
import type { RequestHandler } from './$types.js';

const MAX_MESSAGE_LENGTH = 500;
const OUT_OF_SCOPE_REPLY = 'ตอนนี้ฉันช่วยตอบได้เฉพาะคำถามเกี่ยวกับข้อมูลซีรีส์ใน GL-Orbit เท่านั้นค่ะ';

type ChatPerfStep = {
	name: string;
	ms: number;
	ok: boolean;
	error?: string;
};

async function timedStep<T>(steps: ChatPerfStep[], name: string, fn: () => Promise<T> | T): Promise<T> {
	const startedAt = performance.now();
	try {
		const value = await fn();
		steps.push({ name, ms: Math.round(performance.now() - startedAt), ok: true });
		return value;
	} catch (err) {
		steps.push({
			name,
			ms: Math.round(performance.now() - startedAt),
			ok: false,
			error: err instanceof Error ? err.message : String(err)
		});
		throw err;
	}
}

function shouldLogChatPerf() {
	return process.env.CHAT_PERF_LOG === 'true';
}

function shouldGenerateFollowupSuggestions() {
	return process.env.CHAT_ENABLE_FOLLOWUP_SUGGESTIONS === 'true';
}

function logChatPerf(payload: Record<string, unknown>) {
	if (!shouldLogChatPerf()) return;
	console.info('[chat:perf]', payload);
}

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

	const userId = locals.user.id;
	const perfSteps: ChatPerfStep[] = [];
	const requestStartedAt = performance.now();

	try {
		const recentContext = await timedStep(perfSteps, 'db:recent_context', () => getRecentChatContext(userId, params.id));
		if (!recentContext) {
			logChatPerf({
				conversationId: params.id,
				messageLength: message.length,
				status: 'not_found',
				steps: perfSteps,
				totalMs: Math.round(performance.now() - requestStartedAt)
			});
			return json({ error: 'ไม่พบแชตนี้' }, { status: 404 });
		}

		const contextPrompt = buildConversationContextPrompt(recentContext);
		const chatScope = classifyChatScope(message);
		if (chatScope === 'general') {
			const reply = await timedStep(perfSteps, 'llm:general_chat', () => callMiniMax([
				{ role: 'system', content: GENERAL_CHAT_SYSTEM_PROMPT },
				{ role: 'user', content: buildGeneralChatPrompt(message, contextPrompt) }
			]));

			await timedStep(perfSteps, 'db:append_exchange', () => appendChatExchange(userId, params.id, message, reply, null));
			logChatPerf({
				conversationId: params.id,
				messageLength: message.length,
				status: 'general_chat',
				steps: perfSteps,
				totalMs: Math.round(performance.now() - requestStartedAt)
			});
			return json({ reply, suggestions: [], context: null });
		}

		const deterministicSql = getDeterministicChatSql(message);
		let sqlSource = deterministicSql?.intent ?? 'llm';
		let safeSql = deterministicSql
			? await timedStep(perfSteps, 'sql:deterministic_shortcut', () => makeSafeReadSql(deterministicSql.sql))
			: null;

		if (!safeSql) {
			const catalog = await timedStep(perfSteps, 'db:series_catalog', () => getSeriesCatalogText());
			const generatedSql = await timedStep(perfSteps, 'llm:generate_sql', () => callMiniMax([
				{ role: 'system', content: 'You convert user questions into safe PostgreSQL SELECT queries. Return SQL only.' },
				{ role: 'user', content: `${contextPrompt}\n\n${buildSqlPrompt(message, catalog)}`.trim() }
			]));
			safeSql = await timedStep(perfSteps, 'sql:safety_check', () => makeSafeReadSql(generatedSql));
			sqlSource = 'llm';
		}

		if (!safeSql.ok) {
			logChatPerf({
				conversationId: params.id,
				messageLength: message.length,
				sqlSource,
				status: 'unsafe_sql',
				steps: perfSteps,
				totalMs: Math.round(performance.now() - requestStartedAt)
			});
			return json({ error: 'ไม่สามารถหาคำตอบที่ปลอดภัยได้' }, { status: 422 });
		}

		if (safeSql.outOfScope) {
			await timedStep(perfSteps, 'db:append_exchange', () => appendChatExchange(userId, params.id, message, OUT_OF_SCOPE_REPLY, null));
			logChatPerf({
				conversationId: params.id,
				messageLength: message.length,
				sqlSource,
				status: 'out_of_scope',
				steps: perfSteps,
				totalMs: Math.round(performance.now() - requestStartedAt)
			});
			return json({ reply: OUT_OF_SCOPE_REPLY, suggestions: [], context: null });
		}

		const rows = await timedStep(perfSteps, 'db:run_readonly_query', () => runReadOnlyQuery(safeSql.sql));
		const context = buildChatContext(safeSql.sql, rows as Record<string, unknown>[]);
		const reply = await timedStep(perfSteps, 'llm:answer', () => callMiniMax([
			{
				role: 'system',
				content: 'Answer like a friendly series guide. Use the same language as the user. Do not mention SQL, database, rows, schemas, backend, models, or internal process.'
			},
			{ role: 'user', content: `${contextPrompt}\n\n${buildAnswerPrompt(message, rows)}`.trim() }
		]));

		await timedStep(perfSteps, 'db:append_exchange', () => appendChatExchange(userId, params.id, message, reply, context));

		let suggestions: string[] = [];
		if (shouldGenerateFollowupSuggestions()) {
			try {
				const followupRaw = await timedStep(perfSteps, 'llm:followup_suggestions', () => callMiniMax([
					{ role: 'system', content: 'You suggest short follow-up questions. Return a JSON array of strings only.' },
					{ role: 'user', content: buildFollowupPrompt(message, reply) }
				]));
				suggestions = parseFollowupSuggestions(followupRaw);
			} catch {
				suggestions = [];
			}
		}

		logChatPerf({
			conversationId: params.id,
			messageLength: message.length,
			sqlSource,
			status: 'ok',
			rowCount: rows.length,
			steps: perfSteps,
			totalMs: Math.round(performance.now() - requestStartedAt)
		});

		return json({ reply, suggestions, context });
	} catch (err) {
		logChatPerf({
			conversationId: params.id,
			messageLength: message.length,
			status: 'error',
			error: err instanceof Error ? err.message : String(err),
			steps: perfSteps,
			totalMs: Math.round(performance.now() - requestStartedAt)
		});
		if (err instanceof MiniMaxConfigError || (err instanceof Error && err.message.includes('READONLY_DATABASE_URL'))) {
			return json({ error: 'ยังไม่ได้ตั้งค่า AI chat ให้ครบถ้วน' }, { status: 500 });
		}
		console.error('Conversation message API error:', err);
		return json({ error: 'เกิดข้อผิดพลาดในการตอบคำถามซีรีส์' }, { status: 500 });
	}
};
