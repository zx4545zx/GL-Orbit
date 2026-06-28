import 'dotenv/config';
import type { NeonQueryFunction } from '@neondatabase/serverless';

let _readOnlySql: NeonQueryFunction<false, false> | null = null;

async function getReadOnlySql(): Promise<NeonQueryFunction<false, false>> {
	if (!_readOnlySql) {
		const url = process.env.READONLY_DATABASE_URL;
		if (!url) {
			throw new Error('READONLY_DATABASE_URL is not set');
		}
		const { neon } = await import('@neondatabase/serverless');
		_readOnlySql = neon(url);
	}
	return _readOnlySql;
}

export async function runReadOnlyQuery(sqlText: string): Promise<unknown[]> {
	const sql = await getReadOnlySql();
	return await sql.query(sqlText);
}
