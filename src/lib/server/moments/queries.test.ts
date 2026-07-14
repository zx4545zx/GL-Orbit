import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Moment hydration query compatibility', () => {
	it('uses Drizzle inArray instead of binding JavaScript arrays to PostgreSQL ANY', () => {
		const source = readFileSync(new URL('./queries.ts', import.meta.url), 'utf8');
		expect(source).toContain('inArray(momentMedia.momentId, ids)');
		expect(source).toContain('inArray(momentSeries.momentId, ids)');
		expect(source).not.toMatch(/=\s*any\(\$\{ids\}\)/i);
	});

	it('caches only global Halo discovery results for 30 seconds', () => {
		const source = readFileSync(new URL('./queries.ts', import.meta.url), 'utf8');
		const feedSource = source.slice(
			source.indexOf('export async function getMoments'),
			source.indexOf('export async function getMoment(')
		);
		expect(source).toContain('const cacheKey = `halo-discovery:${safeLimit}`');
		expect(source).toContain('getCached<HaloDiscoveryItem[]>(cacheKey)');
		expect(source).toContain('setCached(cacheKey, result, 30_000)');
		expect(feedSource).not.toContain('getCached');
	});
});
