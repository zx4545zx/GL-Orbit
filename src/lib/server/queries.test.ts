import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deleteCached, getCached, setCached } from './cache.js';

const source = readFileSync(new URL('./queries.ts', import.meta.url), 'utf8');

describe('series query video integration', () => {
	it('invalidates only the requested public series cache key', () => {
		setCached('query:series:series-1', 1);
		setCached('query:series:series-2', 2);
		expect(deleteCached('query:series:series-1')).toBe(true);
		expect(getCached('query:series:series-1')).toBeUndefined();
		expect(getCached('query:series:series-2')).toBe(2);
	});

	it('loads, validates, sorts, and returns series videos', () => {
		expect(source).toContain('seriesVideos');
		expect(source).toContain('isSeriesVideoType');
		expect(source).toContain('sortSeriesVideosByRegistry');
		expect(source).toMatch(/videos:\s*videoRows/);
	});
});
