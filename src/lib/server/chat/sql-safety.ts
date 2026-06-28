const BLOCKED_KEYWORDS = [
	'alter',
	'create',
	'delete',
	'drop',
	'grant',
	'insert',
	'merge',
	'revoke',
	'truncate',
	'update',
	'vacuum'
];

const BLOCKED_TABLES = [
	'users',
	'sessions',
	'favorites',
	'watched',
	'notifications',
	'chat_messages'
];

export type SafeSqlResult =
	| { ok: true; sql: string; outOfScope: boolean }
	| { ok: false; error: string };

export function normalizeGeneratedSql(input: string): string {
	return input
		.trim()
		.replace(/<think>[\s\S]*?<\/think>/gi, '')
		.trim()
		.replace(/^```sql\s*/i, '')
		.replace(/^```\s*/i, '')
		.replace(/```$/i, '')
		.trim();
}

export function makeSafeReadSql(input: string): SafeSqlResult {
	const normalized = normalizeGeneratedSql(input);
	const withoutTrailingSemicolon = normalized.replace(/;\s*$/, '').trim();
	const lowered = withoutTrailingSemicolon.toLowerCase();

	if (!withoutTrailingSemicolon) {
		return { ok: false, error: 'ไม่พบ SQL ที่ใช้งานได้' };
	}

	if (withoutTrailingSemicolon.includes(';')) {
		return { ok: false, error: 'ไม่อนุญาตให้รันหลายคำสั่งพร้อมกัน' };
	}

	if (/(--|\/\*|\*\/)/.test(withoutTrailingSemicolon)) {
		return { ok: false, error: 'ไม่อนุญาต SQL comment' };
	}

	if (!/^(select|with)\b/i.test(withoutTrailingSemicolon)) {
		return { ok: false, error: 'อนุญาตเฉพาะ SELECT เท่านั้น' };
	}

	for (const keyword of BLOCKED_KEYWORDS) {
		if (new RegExp(`\\b${keyword}\\b`, 'i').test(withoutTrailingSemicolon)) {
			return { ok: false, error: 'SQL มีคำสั่งที่ไม่ปลอดภัย' };
		}
	}

	for (const table of BLOCKED_TABLES) {
		if (new RegExp(`\\b${table}\\b`, 'i').test(withoutTrailingSemicolon)) {
			return { ok: false, error: 'SQL เข้าถึงตารางที่ไม่อนุญาต' };
		}
	}

	const outOfScope = lowered === "select 'out_of_scope' as status";
	const sql = /\blimit\s+\d+\b/i.test(withoutTrailingSemicolon) || outOfScope
		? withoutTrailingSemicolon
		: `${withoutTrailingSemicolon} LIMIT 20`;

	return { ok: true, sql, outOfScope };
}
