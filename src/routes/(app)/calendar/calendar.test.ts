import { describe, it, expect, vi } from 'vitest';
import { fetchCalendar } from './calendar.js';

describe('calendar page client-side fetch', () => {
	it('calls /api/calendar with year and month params', async () => {
		const mockResponse = { events: {}, allSeries: [], platforms: [], scheduleByDay: [] };
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse)
		});
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchCalendar(2024, 6);

		expect(mockFetch).toHaveBeenCalledWith('/api/calendar?year=2024&month=6');
		expect(result.calendar).toEqual(mockResponse);
		expect(result.params.year).toBe(2024);
		expect(result.params.month).toBe(6);

		vi.unstubAllGlobals();
	});

	it('handles API errors gracefully', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			json: () => Promise.resolve({ error: 'ไม่พบข้อมูล' })
		});
		vi.stubGlobal('fetch', mockFetch);

		await expect(fetchCalendar(2024, 6)).rejects.toThrow('ไม่พบข้อมูล');

		vi.unstubAllGlobals();
	});
});
