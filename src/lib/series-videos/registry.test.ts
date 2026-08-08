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
		expect(SERIES_VIDEO_TYPES.map(({ key }) => key)).toEqual([
			'TRAILER',
			'PILOT',
			'MUSIC',
			'REACTION',
			'VLOG',
			'EVENT',
			'OTHER'
		]);
		expect(seriesVideoTypeLabel('TRAILER', 'th')).toBe('ตัวอย่าง');
		expect(seriesVideoTypeLabel('PILOT', 'en')).toBe('Pilot');
		expect(seriesVideoTypeLabel('MUSIC', 'th')).toBe('เพลงประกอบ');
		expect(seriesVideoTypeLabel('REACTION', 'th')).toBe('รีแอ็กชัน');
		expect(seriesVideoTypeLabel('REACTION', 'en')).toBe('Reaction');
		expect(seriesVideoTypeLabel('VLOG', 'th')).toBe('วล็อก');
		expect(seriesVideoTypeLabel('VLOG', 'en')).toBe('Vlog');
		expect(seriesVideoTypeLabel('EVENT', 'en')).toBe('Event');
		expect(seriesVideoTypeLabel('OTHER', 'th')).toBe('อื่นๆ');
		expect(isSeriesVideoType('MUSIC')).toBe(true);
		expect(isSeriesVideoType('REACTION')).toBe(true);
		expect(isSeriesVideoType('VLOG')).toBe(true);
		expect(isSeriesVideoType('EVENT')).toBe(true);
		expect(isSeriesVideoType('OTHER')).toBe(true);
		expect(isSeriesVideoType('TEASER')).toBe(false);
		expect(getSeriesVideoType('PILOT')?.labelTh).toBe('ไพล็อต');
	});

	it('sorts a copy by registry, order, creation time, and id', () => {
		const source = [
			{ id: 'e', type: 'OTHER' as const, sortOrder: 0, createdAt: new Date('2026-01-01') },
			{ id: 'd', type: 'EVENT' as const, sortOrder: 0, createdAt: new Date('2026-01-01') },
			{ id: 'm', type: 'MUSIC' as const, sortOrder: 0, createdAt: new Date('2026-01-01') },
			{ id: 'r', type: 'REACTION' as const, sortOrder: 0, createdAt: new Date('2026-01-01') },
			{ id: 'v', type: 'VLOG' as const, sortOrder: 0, createdAt: new Date('2026-01-01') },
			{ id: 'b', type: 'PILOT' as const, sortOrder: 0, createdAt: new Date('2026-01-01') },
			{ id: 'c', type: 'TRAILER' as const, sortOrder: 0, createdAt: new Date('2026-01-01') },
			{ id: 'a', type: 'TRAILER' as const, sortOrder: 0, createdAt: new Date('2026-01-01') }
		];
		expect(sortSeriesVideosByRegistry(source).map(({ id }) => id)).toEqual(['a', 'c', 'b', 'm', 'r', 'v', 'd', 'e']);
		expect(source.map(({ id }) => id)).toEqual(['e', 'd', 'm', 'r', 'v', 'b', 'c', 'a']);
	});
});
