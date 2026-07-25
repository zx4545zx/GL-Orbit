import { describe, expect, it } from 'vitest';
import {
	resolveDatabaseConfig,
	resolveMigrationDatabaseUrl,
	resolveReadOnlyDatabaseConfig
} from './config.js';

describe('database provider configuration', () => {
	it('keeps legacy Neon URLs when DB_PROVIDER is absent', () => {
		expect(resolveDatabaseConfig({ DATABASE_URL: 'postgres://legacy' })).toEqual({
			provider: 'neon',
			url: 'postgres://legacy'
		});
		expect(resolveReadOnlyDatabaseConfig({ READONLY_DATABASE_URL: 'postgres://readonly' }).url).toBe(
			'postgres://readonly'
		);
	});

	it('selects explicit Neon URLs', () => {
		expect(resolveDatabaseConfig({ DB_PROVIDER: 'neon', NEON_DATABASE_URL: 'postgres://neon' }).url).toBe(
			'postgres://neon'
		);
		expect(
			resolveReadOnlyDatabaseConfig({
				DB_PROVIDER: 'neon',
				NEON_READONLY_DATABASE_URL: 'postgres://neon-readonly'
			}).url
		).toBe('postgres://neon-readonly');
	});

	it('selects explicit Supabase URLs', () => {
		expect(
			resolveDatabaseConfig({ DB_PROVIDER: 'supabase', SUPABASE_DATABASE_URL: 'postgres://supabase' })
		).toEqual({ provider: 'supabase', url: 'postgres://supabase' });
	});

	it('rejects invalid providers', () => {
		expect(() => resolveDatabaseConfig({ DB_PROVIDER: 'other' })).toThrow(
			'DB_PROVIDER must be either "neon" or "supabase"'
		);
	});

	it('names the missing selected runtime URL', () => {
		expect(() => resolveDatabaseConfig({ DB_PROVIDER: 'supabase', DATABASE_URL: 'postgres://wrong' })).toThrow(
			'SUPABASE_DATABASE_URL is not set'
		);
	});

	it('never falls back from a selected readonly URL to a writable URL', () => {
		expect(() =>
			resolveReadOnlyDatabaseConfig({
				DB_PROVIDER: 'supabase',
				SUPABASE_DATABASE_URL: 'postgres://writable',
				READONLY_DATABASE_URL: 'postgres://legacy-readonly'
			})
		).toThrow('SUPABASE_READONLY_DATABASE_URL is not set');
	});

	it('requires an explicit migration URL for selected providers', () => {
		expect(() =>
			resolveMigrationDatabaseUrl({
				DB_PROVIDER: 'supabase',
				SUPABASE_DATABASE_URL: 'postgres://pooler'
			})
		).toThrow('DATABASE_MIGRATION_URL is not set');
		expect(resolveMigrationDatabaseUrl({ DATABASE_URL: 'postgres://legacy-direct' })).toBe(
			'postgres://legacy-direct'
		);
		expect(
			resolveMigrationDatabaseUrl({
				DB_PROVIDER: 'neon',
				DATABASE_MIGRATION_URL: 'postgres://direct'
			})
		).toBe('postgres://direct');
	});

	it('rejects the Supabase runtime transaction-pooler port for migrations', () => {
		expect(() =>
			resolveMigrationDatabaseUrl({
				DB_PROVIDER: 'supabase',
				DATABASE_MIGRATION_URL: 'postgres://user:secret@example.supabase.com:6543/postgres'
			})
		).toThrow('DATABASE_MIGRATION_URL must not use Supabase transaction-pooler port 6543');
		expect(
			resolveMigrationDatabaseUrl({
				DB_PROVIDER: 'supabase',
				DATABASE_MIGRATION_URL: 'postgres://user:secret@example.supabase.com:5432/postgres'
			})
		).toContain(':5432/');
	});

	it('reports malformed explicit Supabase migration URLs without exposing them', () => {
		expect(() =>
			resolveMigrationDatabaseUrl({
				DB_PROVIDER: 'supabase',
				DATABASE_MIGRATION_URL: 'not a URL containing-secret'
			})
		).toThrow('DATABASE_MIGRATION_URL must be a valid PostgreSQL URL');
	});
});
