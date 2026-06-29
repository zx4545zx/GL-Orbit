export type ChatContext =
	| { type: 'schedule'; seriesIds: string[] }
	| { type: 'artist'; artistIds: string[] }
	| { type: 'series'; seriesIds: string[] }
	| null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function classifyContextType(sql: string): 'schedule' | 'artist' | 'series' | null {
	const lower = sql.toLowerCase();
	if (/\b(episode_schedules|series_schedules)\b/.test(lower)) return 'schedule';
	if (/\bartists\b/.test(lower)) return 'artist';
	if (/\bseries\b/.test(lower)) return 'series';
	return null;
}

export function extractEntityIds(rows: Record<string, unknown>[], keys: string[]): string[] {
	const ids = new Set<string>();
	const normalizedKeys = keys.map((key) => key.toLowerCase());
	for (const row of rows) {
		for (const wantedKey of normalizedKeys) {
			const actualKey = Object.keys(row).find((key) => key.toLowerCase() === wantedKey);
			if (!actualKey) continue;
			const val = row[actualKey];
			if (typeof val === 'string' && UUID_RE.test(val)) ids.add(val);
		}
	}
	return [...ids];
}

export function buildChatContext(sql: string, rows: Record<string, unknown>[]): ChatContext {
	const type = classifyContextType(sql);
	// If out of scope or no relevant type, return null
	if (!type) return null;
	if (rows.length === 0) return null;
	const ids = type === 'schedule'
		? extractEntityIds(rows, ['series_id'])
		: type === 'artist'
			? extractEntityIds(rows, ['artist_id', 'id'])
			: extractEntityIds(rows, ['series_id', 'id']);
	if (ids.length === 0) return null;
	if (type === 'schedule') return { type: 'schedule', seriesIds: ids };
	if (type === 'artist') return { type: 'artist', artistIds: ids };
	return { type: 'series', seriesIds: ids };
}
