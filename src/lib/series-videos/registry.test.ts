import { describe, expect, it } from 'vitest';
import {
	SERIES_VIDEO_TYPES,
	getSeriesVideoType,
	isSeriesVideoType,
	seriesVideoTypeLabel,
	sortSeriesVideosByRegistry
} from './registry.js';

describe('series video registry', () => {
	it('defines extensible types, labels, and guards', () => {
		expect(SERIES_VIDEO_TYPES.map(({ key }) => key)).toEqual(['TRAILER', 'PILOT']);
		expect(seriesVideoTypeLabel('TRAILER', 'th')).toBe('ตัวอย่าง');
		expect(seriesVideoTypeLabel('PILOT', 'en')).toBe('Pilot');
		expect(isSeriesVideoType('TRAILER')).toBe(true);
		expect(isSeriesVideoType('TEASER')).toBe(false);
		expect(getSeriesVideoType('PILOT')?.labelTh).toBe('ไพล็อต');
	});

	it('sorts a copy by registry, order, creation time, and id', () => {
		const source = [
			{ id: 'b', type: 'PILOT' as const, sortOrder: 0, createdAt: new Date('2026-01-01') },
			{ id: 'c', type: 'TRAILER' as const, sortOrder: 0, createdAt: new Date('2026-01-01') },
			{ id: 'a', type: 'TRAILER' as const, sortOrder: 0, createdAt: new Date('2026-01-01') }
		];
		expect(sortSeriesVideosByRegistry(source).map(({ id }) => id)).toEqual(['a', 'c', 'b']);
		expect(source.map(({ id }) => id)).toEqual(['b', 'c', 'a']);
	});
});
