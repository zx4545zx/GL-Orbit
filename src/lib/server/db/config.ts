export type DatabaseProvider = 'neon' | 'supabase';
type Environment = Record<string, string | undefined>;

export type DatabaseConfig = {
	provider: DatabaseProvider;
	url: string;
};

function providerFrom(env: Environment): { provider: DatabaseProvider; explicit: boolean } {
	const value = env.DB_PROVIDER;
	if (value === undefined || value === '') return { provider: 'neon', explicit: false };
	if (value === 'neon' || value === 'supabase') return { provider: value, explicit: true };
	throw new Error('DB_PROVIDER must be either "neon" or "supabase"');
}

function requiredUrl(env: Environment, key: string): string {
	const url = env[key];
	if (!url) throw new Error(`${key} is not set`);
	return url;
}

export function resolveDatabaseConfig(env: Environment = process.env): DatabaseConfig {
	const { provider, explicit } = providerFrom(env);
	const key = provider === 'supabase' ? 'SUPABASE_DATABASE_URL' : 'NEON_DATABASE_URL';
	const url = !explicit && provider === 'neon' ? env.NEON_DATABASE_URL || env.DATABASE_URL : env[key];
	return { provider, url: url || requiredUrl(env, key) };
}

export function resolveReadOnlyDatabaseConfig(env: Environment = process.env): DatabaseConfig {
	const { provider, explicit } = providerFrom(env);
	const key = provider === 'supabase' ? 'SUPABASE_READONLY_DATABASE_URL' : 'NEON_READONLY_DATABASE_URL';
	const url = !explicit && provider === 'neon' ? env.NEON_READONLY_DATABASE_URL || env.READONLY_DATABASE_URL : env[key];
	return { provider, url: url || requiredUrl(env, key) };
}

export function resolveMigrationDatabaseUrl(env: Environment = process.env): string {
	const { provider, explicit } = providerFrom(env);
	const url = env.DATABASE_MIGRATION_URL || (!explicit && provider === 'neon' ? env.DATABASE_URL : undefined);
	const resolvedUrl = url || requiredUrl(env, 'DATABASE_MIGRATION_URL');
	if (explicit && provider === 'supabase') {
		let parsed: URL;
		try {
			parsed = new URL(resolvedUrl);
		} catch {
			throw new Error('DATABASE_MIGRATION_URL must be a valid PostgreSQL URL');
		}
		if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
			throw new Error('DATABASE_MIGRATION_URL must be a valid PostgreSQL URL');
		}
		if (parsed.port === '6543') {
			throw new Error('DATABASE_MIGRATION_URL must not use Supabase transaction-pooler port 6543');
		}
	}
	return resolvedUrl;
}
