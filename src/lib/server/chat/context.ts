import type { ChatMessageItem } from './history.js';

export function buildConversationContextPrompt(messages: ChatMessageItem[]) {
	if (messages.length === 0) return '';

	const lines = messages.map((message) => {
		const speaker = message.role === 'USER' ? 'ผู้ใช้' : 'ผู้ช่วย';
		return `${speaker}: ${message.content}`;
	});

	return `
บริบทบทสนทนาล่าสุด:
${lines.join('\n')}

ใช้บริบทนี้เพื่อทำความเข้าใจคำถามต่อเนื่อง เช่น "แล้วนักแสดงมีใครบ้าง" หรือ "มีเรื่องไหนอีก"
ห้ามตอบจากบริบทอย่างเดียว ต้องใช้ข้อมูลจากผลค้นหาที่ให้มาในขั้นสุดท้ายเท่านั้น
`.trim();
}
