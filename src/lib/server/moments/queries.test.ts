import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Moment hydration query compatibility', () => {
	it('uses Drizzle inArray instead of binding JavaScript arrays to PostgreSQL ANY', () => {
		const source = readFileSync(new URL('./queries.ts', import.meta.url), 'utf8');
		expect(source).toContain('inArray(momentMedia.momentId, ids)');
		expect(source).toContain('inArray(momentSeries.momentId, ids)');
		expect(source).not.toMatch(/=\s*any\(\$\{ids\}\)/i);
	});
});
