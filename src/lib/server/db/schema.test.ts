import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(new URL('./schema.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../../../../drizzle/0019_free_captain_america.sql', import.meta.url), 'utf8');

describe('Moment pending media constraints', () => {
	it('allows a published Moment to retain its expected upload count after final publication', () => {
		expect(schema).toContain("pendingMediaStatus: check('moments_pending_media_status', sql`\${table.status} <> 'UPLOADING' OR \${table.pendingMediaCount} > 0`)");
		expect(migration).toContain("CHECK (\"moments\".\"status\" <> 'UPLOADING' OR \"moments\".\"pending_media_count\" > 0)");
	});
});
