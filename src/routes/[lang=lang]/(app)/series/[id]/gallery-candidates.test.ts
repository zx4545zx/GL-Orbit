import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

describe('series gallery candidate identity', () => {
	it('keeps duplicate official gallery URLs using gallery row IDs', () => {
		const gallery = [
			{ id: 'gallery-a', imageUrl: '/same.jpg' },
			{ id: 'gallery-b', imageUrl: '/same.jpg' }
		];

		expect(gallery.map((image) => image.imageUrl)).toEqual(['/same.jpg', '/same.jpg']);
		expect(source).toContain('key: `gallery:${image.id}`');
		expect(source).toContain('{#each galleryCandidates as image, index (image.key)}');
	});

	it('keeps duplicate fallback episode cover URLs using episode identity', () => {
		const schedule = [
			{ episode: 1, coverUrl: '/same.jpg' },
			{ episode: 2, coverUrl: '/same.jpg' }
		];

		expect(schedule.map((episode) => episode.coverUrl)).toEqual(['/same.jpg', '/same.jpg']);
		expect(source).toContain('key: `episode:${item.episode}:cover`');
		expect(source).toContain('{#each galleryCandidates as image, index (image.key)}');
	});

	it('preserves normal gallery order and the ten-image limit', () => {
		expect(source).toContain(
			'(officialGalleryCandidates.length > 0 ? officialGalleryCandidates : episodeCoverCandidates).slice(0, 10)'
		);
	});
});
