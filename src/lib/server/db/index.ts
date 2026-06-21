import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import * as schema from './schema.js';

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;
let _sql: NeonQueryFunction<false, false> | null = null;

async function getSql(): Promise<NeonQueryFunction<false, false>> {
	if (!_sql) {
		const url = process.env.DATABASE_URL;
		if (!url) {
			throw new Error('DATABASE_URL is not set');
		}
		const { neon } = await import('@neondatabase/serverless');
		_sql = neon(url);
	}
	return _sql;
}

export async function getDb(): Promise<Db> {
	if (!_db) {
		const sql = await getSql();
		_db = drizzle(sql, { schema });
	}
	return _db;
}

export const db = new Proxy({} as Db, {
	async get(_, prop: string | symbol) {
		if (!_db) {
			const sql = await getSql();
			_db = drizzle(sql, { schema });
		}
		return (_db as unknown as Record<string | symbol, unknown>)[prop];
	}
});
