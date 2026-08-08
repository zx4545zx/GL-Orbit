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

	it('uses only official gallery rows and hides the carousel when none exist', () => {
		expect(source).toContain('series.gallery.slice(0, 10).map');
		expect(source).toContain('const galleryCandidates = $derived(officialGalleryCandidates);');
		expect(source).toContain('{#if galleryCandidates.length > 0}');
		expect(source).not.toContain('episodeCoverCandidates');
		expect(source).not.toContain('key: `episode:${item.episode}:cover`');
	});
});
