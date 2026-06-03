import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CalendarApiResponse } from '$lib/types/calendar.js';

// ── Mock fetch ──
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Return type of the calendar +page.ts load function
interface CalendarLoadOutput {
	calendar: CalendarApiResponse;
	params: { year: number; month: number; startDate: string | null; endDate: string | null };
	meta: { title: string; description: string };
}

// Helper to build a minimal LoadEvent
function mockLoadEvent(searchParams: string) {
	return {
		url: new URL(`http://localhost/calendar${searchParams}`),
		fetch: mockFetch,
	} as never;
}

function mockApiResponse(body: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	} as Response;
}

const emptyCalendar = {
	events: {} as Record<string, unknown[]>,
	allSeries: [] as string[],
	platforms: [] as string[],
	scheduleByDay: [] as unknown[],
};

describe('calendar +page.ts load function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Override Date to get deterministic defaults
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('fetches /api/calendar with year and month from query params', async () => {
		mockFetch.mockResolvedValue(mockApiResponse(emptyCalendar, 200));
		const { load } = await import('./+page.js');

		const result = (await load(mockLoadEvent('?year=2026&month=6'))) as CalendarLoadOutput;
		expect(mockFetch).toHaveBeenCalledWith('/api/calendar?year=2026&month=6');
		expect(result.calendar).toEqual(emptyCalendar);
		expect(result.params.year).toBe(2026);
		expect(result.params.month).toBe(6);
	});

	it('fetches /api/calendar with startDate and endDate from query params', async () => {
		mockFetch.mockResolvedValue(mockApiResponse(emptyCalendar, 200));
		const { load } = await import('./+page.js');

		const result = (await load(mockLoadEvent('?startDate=2026-06-01&endDate=2026-06-08'))) as CalendarLoadOutput;
		expect(mockFetch).toHaveBeenCalledWith('/api/calendar?startDate=2026-06-01&endDate=2026-06-08');
		expect(result.calendar).toEqual(emptyCalendar);
	});

	it('defaults to current month when no params are present', async () => {
		mockFetch.mockResolvedValue(mockApiResponse(emptyCalendar, 200));
		const { load } = await import('./+page.js');

		const result = (await load(mockLoadEvent(''))) as CalendarLoadOutput;
		// June 2026 (month 6) from the mocked system time
		expect(mockFetch).toHaveBeenCalledWith('/api/calendar?year=2026&month=6');
		expect(result.params.year).toBe(2026);
		expect(result.params.month).toBe(6);
	});

	it('throws SvelteKit error on 4xx API response', async () => {
		mockFetch.mockResolvedValue(
			mockApiResponse({ error: 'พารามิเตอร์เดือนไม่ถูกต้อง' }, 400)
		);
		const { load } = await import('./+page.js');

		await expect(load(mockLoadEvent('?year=2026&month=13'))).rejects.toMatchObject({
			status: 400,
		});
	});

	it('throws SvelteKit error on 5xx API response', async () => {
		mockFetch.mockResolvedValue(mockApiResponse({}, 500));
		const { load } = await import('./+page.js');

		await expect(load(mockLoadEvent('?year=2026&month=6'))).rejects.toMatchObject({
			status: 500,
		});
	});

	it('includes SEO meta in the return value', async () => {
		mockFetch.mockResolvedValue(mockApiResponse(emptyCalendar, 200));
		const { load } = await import('./+page.js');

		const result = (await load(mockLoadEvent('?year=2026&month=6'))) as CalendarLoadOutput;
		expect(result.meta).toBeDefined();
		expect(result.meta.title).toContain('ตารางฉาย');
		expect(result.meta.description).toBeDefined();
	});
});
