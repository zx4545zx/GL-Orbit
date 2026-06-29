export type ChatScope = 'data' | 'general';

const DATA_TERMS = [
	'gl',
	'girl love',
	'girls love',
	'ซีรีส์',
	'ซีรี่ส์',
	'series',
	'นักแสดง',
	'ศิลปิน',
	'แสดง',
	'cast',
	'artist',
	'ตอน',
	'ep',
	'episode',
	'ลิงก์',
	'link',
	'รับชม',
	'stream',
	'ฉาย',
	'ตาราง',
	'วันไหน',
	'ย้อนหลัง',
	'ที่ผ่านมา',
	'ที่แล้ว',
	'เมื่อวาน',
	'uncut',
	'ไม่ตัด',
	'แพลตฟอร์ม',
	'platform',
	'youtube',
	'netflix',
	'iqiyi',
	'viu',
	'wetv',
	'gagaoolala',
	'oned',
	'one31',
	'gmmtv',
	'สตูดิโอ',
	'studio',
	'ค่าย',
	'แนว',
	'โรแมนติก',
	'ดราม่า',
	'ตลก',
	'แฟนตาซี'
];

const DATA_PHRASE_RE = /(เรื่องไหน|เรื่องอะไร|มีเรื่อง|แนะนำเรื่อง|ขอเรื่อง|เรื่อง\s*[^\s?？]+\s*(?:มี|ฉาย|ดู|เกี่ยวกับ|นักแสดง|ตอน|link|ลิงก์))/i;
const GREETING_ONLY_RE = /^(สวัสดี|หวัดดี|ดีค่ะ|ดีครับ|hello|hi|hey|ขอบคุณ|thanks|thank you|บาย|ลาก่อน)[\s!！.。?？~]*$/i;

function normalizeMessage(message: string) {
	return message.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function classifyChatScope(message: string): ChatScope {
	const normalized = normalizeMessage(message);
	if (!normalized) return 'general';
	if (GREETING_ONLY_RE.test(normalized)) return 'general';
	if (DATA_PHRASE_RE.test(normalized)) return 'data';
	return DATA_TERMS.some((term) => normalized.includes(term)) ? 'data' : 'general';
}

export const GENERAL_CHAT_SYSTEM_PROMPT = `
คุณคือ GL-Orbit AI ผู้ช่วยคุยกับแฟนซีรีส์ GL/Girls' Love
ตอบเป็นภาษาเดียวกับผู้ใช้แบบเป็นกันเอง สุภาพ และกระชับ
คุณคุยเรื่องทั่วไปได้ แต่ควรพยายามโยงกลับมาที่ GL, ซีรีส์ GL, นักแสดง, ตารางฉาย, ตอนใหม่ หรือช่องทางรับชมอย่างเป็นธรรมชาติ
ห้ามอ้างว่ามีข้อมูลจากฐานข้อมูล GL-Orbit ถ้าไม่ได้รับข้อมูลจริงใน prompt นี้
ถ้าผู้ใช้ถามข้อเท็จจริงเฉพาะทางหรือข้อมูลล่าสุดที่ไม่เกี่ยวกับ GL ให้ตอบเท่าที่ปลอดภัยแบบสั้น ๆ แล้วชวนกลับมาคุยเรื่อง GL
ห้ามพูดถึง SQL, database, schema, backend, model หรือขั้นตอนภายในระบบ
`.trim();

export function buildGeneralChatPrompt(message: string, conversationContext = '') {
	return `
${conversationContext}

ข้อความผู้ใช้:
${message}

ตอบแบบแชตธรรมชาติ และถ้าเหมาะสมให้ชวนผู้ใช้ถามเรื่อง GL-Orbit ต่อ
`.trim();
}
