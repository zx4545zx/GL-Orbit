import { sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
	const db = await getDb();
	const result = await db.execute(sql`
		INSERT INTO rate_limit_windows (key, window_started_at, request_count, updated_at)
		VALUES (${key}, now(), 1, now())
		ON CONFLICT (key) DO UPDATE SET
			window_started_at = CASE WHEN now() - rate_limit_windows.window_started_at >= (${windowSeconds} * interval '1 second') THEN now() ELSE rate_limit_windows.window_started_at END,
			request_count = CASE WHEN now() - rate_limit_windows.window_started_at >= (${windowSeconds} * interval '1 second') THEN 1 ELSE rate_limit_windows.request_count + 1 END,
			updated_at = now()
		RETURNING request_count, window_started_at
	`);
	const row = result.rows[0] as { request_count: number; window_started_at: Date };
	return { allowed: row.request_count <= limit, retryAfterSeconds: row.request_count <= limit ? 0 : windowSeconds };
}
