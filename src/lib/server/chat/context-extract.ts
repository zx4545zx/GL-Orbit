export type ChatContext =
	| { type: 'schedule'; seriesIds: string[] }
	| { type: 'artist'; artistIds: string[] }
	| { type: 'series'; seriesIds: string[] }
	| null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_KEYS = new Set(['id', 'series_id', 'artist_id']);

export function classifyContextType(sql: string): 'schedule' | 'artist' | 'series' | null {
	const lower = sql.toLowerCase();
	if (/\b(episode_schedules|series_schedules)\b/.test(lower)) return 'schedule';
	if (/\bartists\b/.test(lower)) return 'artist';
	if (/\bseries\b/.test(lower)) return 'series';
	return null;
}

export function extractEntityIds(rows: Record<string, unknown>[]): string[] {
	const ids = new Set<string>();
	for (const row of rows) {
		for (const key of Object.keys(row)) {
			if (ID_KEYS.has(key.toLowerCase())) {
				const val = row[key];
				if (typeof val === 'string' && UUID_RE.test(val)) ids.add(val);
			}
		}
	}
	return [...ids];
}

export function buildChatContext(sql: string, rows: Record<string, unknown>[]): ChatContext {
	const type = classifyContextType(sql);
	// If out of scope or no relevant type, return null
	if (!type) return null;
	if (rows.length === 0) return null;
	const ids = extractEntityIds(rows);
	if (ids.length === 0) return null;
	if (type === 'schedule') return { type: 'schedule', seriesIds: ids };
	if (type === 'artist') return { type: 'artist', artistIds: ids };
	return { type: 'series', seriesIds: ids };
}
