import 'dotenv/config';
import postgres, { type Sql } from 'postgres';
import { resolveReadOnlyDatabaseConfig } from '../db/config.js';

let _readOnlySql: Sql | null = null;

function getReadOnlySql(): Sql {
	if (!_readOnlySql) {
		const { url } = resolveReadOnlyDatabaseConfig();
		_readOnlySql = postgres(url, { prepare: false });
	}
	return _readOnlySql;
}

export async function runReadOnlyQuery(sqlText: string): Promise<unknown[]> {
	const sql = await getReadOnlySql();
	return await sql.unsafe(sqlText);
}
