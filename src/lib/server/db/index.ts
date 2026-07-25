import 'dotenv/config';
import postgres, { type Sql } from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { resolveDatabaseConfig } from './config.js';
import * as schema from './schema.js';

type TransactionStatement = { strings: TemplateStringsArray; args: readonly any[] };
type TransactionSql = Sql & {
	transaction(statements: unknown[]): Promise<unknown[]>;
};

export type Db = ReturnType<typeof drizzle<typeof schema>> & { $client: TransactionSql };

let _db: Db | null = null;
let _sql: TransactionSql | null = null;

function getSql(): TransactionSql {
	if (!_sql) {
		const { url } = resolveDatabaseConfig();
		const sql = postgres(url, { prepare: false }) as TransactionSql;
		sql.transaction = (statements) =>
			sql.begin((transactionSql) =>
				statements.map((value) => {
					const statement = value as TransactionStatement;
					return transactionSql(statement.strings, ...statement.args);
				})
			) as Promise<unknown[]>;
		_sql = sql;
	}
	return _sql;
}

export async function getDb(): Promise<Db> {
	if (!_db) {
		const sql = getSql();
		_db = drizzle(sql, { schema }) as Db;
	}
	return _db;
}

export async function closeDb(): Promise<void> {
	const sql = _sql;
	_db = null;
	_sql = null;
	if (sql) await sql.end();
}
