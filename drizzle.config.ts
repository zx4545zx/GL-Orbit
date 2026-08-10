import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import { resolveMigrationDatabaseUrl } from './src/lib/server/db/config';

dotenv.config();

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: resolveMigrationDatabaseUrl()
	}
});
