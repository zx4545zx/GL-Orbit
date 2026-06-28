import { describe, expect, it } from 'vitest';
import { makeSafeReadSql, normalizeGeneratedSql } from './sql-safety.js';

describe('chat SQL safety', () => {
	it('normalizes fenced SQL', () => {
		expect(normalizeGeneratedSql('```sql\nSELECT * FROM series\n```')).toBe('SELECT * FROM series');
	});

	it('allows SELECT and appends a limit', () => {
		expect(makeSafeReadSql('SELECT title_en FROM series')).toEqual({
			ok: true,
			sql: 'SELECT title_en FROM series LIMIT 20',
			outOfScope: false
		});
	});

	it('allows out-of-scope sentinel without adding a limit', () => {
		expect(makeSafeReadSql("SELECT 'OUT_OF_SCOPE' AS status")).toEqual({
			ok: true,
			sql: "SELECT 'OUT_OF_SCOPE' AS status",
			outOfScope: true
		});
	});

	it('blocks destructive statements', () => {
		expect(makeSafeReadSql('DROP TABLE series').ok).toBe(false);
		expect(makeSafeReadSql('SELECT * FROM series; DELETE FROM series').ok).toBe(false);
	});

	it('blocks private tables', () => {
		expect(makeSafeReadSql('SELECT * FROM users').ok).toBe(false);
		expect(makeSafeReadSql('SELECT * FROM chat_messages').ok).toBe(false);
	});
});
