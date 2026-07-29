import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./series-detail.ts', import.meta.url), 'utf8');

describe('public series video query', () => {
	it('queries videos independently and removes internal createdAt', () => {
		expect(source).toContain('const videosPromise');
		expect(source).toContain('youtubeVideoId: seriesVideos.youtubeVideoId');
		expect(source).toContain('sortSeriesVideosByRegistry');
		expect(source).toMatch(/\.map\(\(\{ createdAt: _createdAt, \.\.\.video \}\) => video\)/);
		expect(source).toContain('videos,');
	});
});
