import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEpisodeListStatus } from './episode-status.js';

const NOW = new Date('2026-08-02T05:00:00.000Z');

describe('getEpisodeListStatus', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('marks an episode airing earlier today as aired', () => {
		expect(getEpisodeListStatus(4, [{ airDateIso: '2026-08-02T03:00:00.000Z' }], null)).toBe('aired');
	});

	it('keeps an episode with only a future schedule as TBA', () => {
		expect(getEpisodeListStatus(5, [{ airDateIso: '2026-08-02T07:00:00.000Z' }], null)).toBe('tba');
	});

	it('marks multi-platform episodes aired when any real schedule has passed', () => {
		expect(getEpisodeListStatus(6, [
			{ airDateIso: null },
			{ airDateIso: '2026-08-02T07:00:00.000Z' },
			{ airDateIso: '2026-08-02T03:00:00.000Z' }
		], null)).toBe('aired');
	});

	it('keeps the existing next-episode precedence', () => {
		expect(getEpisodeListStatus(7, [{ airDateIso: '2026-08-02T03:00:00.000Z' }], 7)).toBe('next');
	});
});
