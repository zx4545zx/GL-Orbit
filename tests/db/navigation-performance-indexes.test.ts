import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const schemaPath = join(process.cwd(), 'src/lib/server/db/schema.ts');
const drizzleDirectory = join(process.cwd(), 'drizzle');

describe('navigation performance indexes', () => {
	it('declares and migrates calendar range and join indexes', async () => {
		const schema = await readFile(schemaPath, 'utf8');
		expect(schema).toContain("index('episodes_series_idx').on(table.seriesId)");
		expect(schema).toContain("index('episode_schedules_episode_idx').on(table.episodeId)");
		expect(schema).toMatch(/index\('episode_schedules_air_date_idx'\)\s*\.on\(table\.airDate\)\s*\.where\(sql`/);

		const files = await readdir(drizzleDirectory);
		const migration = files.find((file) => /^0021_.*\.sql$/.test(file));
		expect(migration).toBeDefined();
		const sql = await readFile(join(drizzleDirectory, migration!), 'utf8');
		expect(sql.match(/CREATE INDEX IF NOT EXISTS/g)).toHaveLength(3);
		expect(sql).toContain('"episodes_series_idx"');
		expect(sql).toContain('"episode_schedules_episode_idx"');
		expect(sql).toContain('"episode_schedules_air_date_idx"');
		expect(sql).toContain('WHERE "episode_schedules"."deleted_at" IS NULL');
		expect(sql).not.toMatch(/\b(DROP|ALTER|DELETE|UPDATE)\b/i);
	});
});
