import { describe, expect, it } from 'vitest';
import { latestMomentsHref } from './latest-moments.js';

describe('latestMomentsHref', () => {
	it.each([
		['series', 'series-1', '/th/halo?seriesId=series-1'],
		['artist', 'artist-1', '/th/halo?artistId=artist-1'],
		['ship', 'ship-1', '/th/halo?shipId=ship-1']
	] as const)('links a %s to its filtered Halo feed', (entity, id, expected) => {
		expect(latestMomentsHref('th', entity, id)).toBe(expected);
	});
});
