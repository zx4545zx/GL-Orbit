import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const drizzleDirectory = join(process.cwd(), 'drizzle');

describe('Orbit Halo migration', () => {
	it('creates Moments and makes notification series targets optional', async () => {
		const files = await readdir(drizzleDirectory);
		const migration = files.find((file) => /^0017_.*\.sql$/.test(file));

		expect(migration).toBeDefined();

		const sql = await readFile(join(drizzleDirectory, migration!), 'utf8');
		expect(sql).toContain('CREATE TABLE "moments"');
		expect(sql).toContain('ALTER TABLE "notifications" ALTER COLUMN "series_id" DROP NOT NULL');
	});
});
