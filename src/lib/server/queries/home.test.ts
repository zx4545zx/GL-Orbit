import { describe, expect, it } from 'vitest';
import * as homeQuery from './home.js';

describe('dedupeUpcomingScheduleRows', () => {
	it('collapses visually identical stream parts while preserving distinct episode, time, and platform broadcasts', () => {
		const at = (value: string) => new Date(value);
		const shared = {
			episodeId: 'episode-5',
			episodeNumber: 5,
			seriesId: 'ai-girl',
			platformId: 'youtube',
			airDate: at('2026-07-29T13:00:00.000Z'),
			isUncut: false
		};
		const rows = [
			{ ...shared, id: 'youtube-part-1' },
			{ ...shared, id: 'youtube-part-2' },
			{ ...shared, id: 'youtube-part-3' },
			{ ...shared, id: 'youtube-part-4' },
			{ ...shared, id: 'other-episode', episodeId: 'episode-6', episodeNumber: 6 },
			{ ...shared, id: 'other-time', airDate: at('2026-07-29T14:00:00.000Z') },
			{ ...shared, id: 'other-platform', platformId: 'iqiyi' }
		];

		const dedupe = (homeQuery as unknown as {
			dedupeUpcomingScheduleRows: (value: typeof rows) => typeof rows;
		}).dedupeUpcomingScheduleRows;

		expect(dedupe(rows).map((row) => row.id)).toEqual([
			'youtube-part-1',
			'other-episode',
			'other-time',
			'other-platform'
		]);
	});
});
