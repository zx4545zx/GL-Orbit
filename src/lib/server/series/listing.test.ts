import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./listing.ts', import.meta.url), 'utf8');

describe('series listing query scheduling', () => {
	it('runs independent count and page queries concurrently', () => {
		expect(source).toContain('const countQuery = db');
		expect(source).toContain('const rowsQuery = db');
		expect(source).toContain('await Promise.all([countQuery, rowsQuery])');
		expect(source).not.toMatch(/const \[countResult\] = await db/);
	});
});
