import { consumeStream, convertToModelMessages, stepCountIs, streamText, type UIMessage, validateUIMessages } from 'ai';
import { appendAiChatExchange, getChatMessages } from '$lib/server/chat/history.js';
import { createChatModel } from './providers/index.js';
import { getOwnedAiProfile } from './profiles.js';
import { catalogTools } from './tools.js';
import { PROVIDER_REQUEST_TIMEOUT_MS } from './providers/index.js';

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_CONTEXT_MESSAGES = 12;

export class AiChatError extends Error { constructor(message: string, readonly status = 400) { super(message); } }

function textFromParts(parts: unknown[]): string {
	return parts.filter((part): part is { type: 'text'; text: string } => Boolean(part) && typeof part === 'object' && (part as { type?: unknown }).type === 'text' && typeof (part as { text?: unknown }).text === 'string').map((part) => part.text).join('');
}

function prompt(language: string) {
	return language === 'th'
		? 'คุณคือ GL-Orbit guide ตอบภาษาเดียวกับผู้ใช้ ห้ามแต่งข้อมูลซีรีส์ นักแสดง ตารางฉาย หรือข่าวเอง ต้องเรียกเครื่องมือ GL-Orbit ก่อนตอบข้อเท็จจริงดังกล่าว หากไม่มีข้อมูล ให้บอกตรงๆ ว่าไม่พบข้อมูล ใช้เฉพาะข้อมูลจากเครื่องมือ ห้ามกล่าวถึง SQL ฐานข้อมูล หรือกระบวนการภายใน'
		: 'You are the GL-Orbit guide. Reply in the user’s language. Never invent catalog, actor, schedule, or news facts. Call GL-Orbit tools before answering such factual questions. If data is unavailable, say so clearly. Use only tool results and never mention SQL, databases, or internal processes.';
}

export async function startAiChat(input: { userId: string; conversationId: string; text: unknown; profileId?: unknown; language: string; abortSignal: AbortSignal }) {
	const text = typeof input.text === 'string' ? input.text.trim() : '';
	if (!text) throw new AiChatError('Message is required');
	if (text.length > MAX_MESSAGE_LENGTH) throw new AiChatError(`Message must be at most ${MAX_MESSAGE_LENGTH} characters`);
	const profileId = typeof input.profileId === 'string' ? input.profileId : undefined;
	const [profile, history] = await Promise.all([getOwnedAiProfile(input.userId, profileId), getChatMessages(input.userId, input.conversationId)]);
	if (!history) throw new AiChatError('Conversation was not found', 404);
	if (!profile) throw new AiChatError('Configure a provider and default model before chatting', 409);
	const previous: UIMessage[] = history.slice(-MAX_CONTEXT_MESSAGES).map((message) => ({ id: message.id, role: message.role === 'USER' ? 'user' : 'assistant', parts: message.parts.length ? message.parts as UIMessage['parts'] : [{ type: 'text', text: message.content }] }));
	const current: UIMessage = { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text }] };
	const validated = await validateUIMessages({ messages: [...previous, current], tools: catalogTools as never });
	const model = createChatModel(profile.provider, profile.profile.modelId);
	const result = streamText({ model, system: prompt(input.language), messages: await convertToModelMessages(validated, { tools: catalogTools }), tools: catalogTools, stopWhen: stepCountIs(4), abortSignal: AbortSignal.any([input.abortSignal, AbortSignal.timeout(PROVIDER_REQUEST_TIMEOUT_MS)]) });
	return result.toUIMessageStreamResponse({
		originalMessages: validated,
		consumeSseStream: consumeStream,
		onFinish: async ({ messages, isAborted }) => {
			if (isAborted) return;
			const assistant = messages.at(-1);
			if (!assistant || assistant.role !== 'assistant') return;
			const assistantParts = assistant.parts as unknown[];
			await appendAiChatExchange(input.userId, input.conversationId, text, current.parts, textFromParts(assistantParts), assistantParts, { providerType: profile.provider.type, modelId: profile.profile.modelId });
		}
	});
}
