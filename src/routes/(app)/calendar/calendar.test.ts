import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fetchCalendar, parseCalendarParams } from './calendar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pagePath = resolve(__dirname, '+page.svelte');

describe('parseCalendarParams', () => {
	it('extracts year and month from search params', () => {
		const params = new URLSearchParams('year=2024&month=6');
		const result = parseCalendarParams(params);

		expect(result.year).toBe(2024);
		expect(result.month).toBe(6);
		expect(result.startDate).toBeNull();
		expect(result.endDate).toBeNull();
	});

	it('extracts startDate and endDate from search params', () => {
		const params = new URLSearchParams('startDate=2024-06-01&endDate=2024-06-07');
		const result = parseCalendarParams(params);

		expect(result.year).toBeUndefined();
		expect(result.month).toBeUndefined();
		expect(result.startDate).toBe('2024-06-01');
		expect(result.endDate).toBe('2024-06-07');
	});

	it('returns empty params when no query string', () => {
		const params = new URLSearchParams('');
		const result = parseCalendarParams(params);

		expect(result.year).toBeUndefined();
		expect(result.month).toBeUndefined();
		expect(result.startDate).toBeNull();
		expect(result.endDate).toBeNull();
	});

	it('returns a key derived from the search string for reactivity', () => {
		const params1 = parseCalendarParams(new URLSearchParams('year=2024&month=6'));
		const params2 = parseCalendarParams(new URLSearchParams('year=2024&month=7'));
		const params3 = parseCalendarParams(new URLSearchParams('year=2024&month=6'));

		expect(params1.key).toBe('year=2024&month=6');
		expect(params2.key).toBe('year=2024&month=7');
		// Same input => same key
		expect(params3.key).toBe(params1.key);
		// Different input => different key
		expect(params2.key).not.toBe(params1.key);
	});

	it('key changes between month mode and week mode', () => {
		const monthKey = parseCalendarParams(new URLSearchParams('year=2024&month=6')).key;
		const weekKey = parseCalendarParams(new URLSearchParams('startDate=2024-06-01&endDate=2024-06-07')).key;

		expect(weekKey).not.toBe(monthKey);
	});
});

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

describe('calendar page loading structure — source-level regression', () => {
	it('title (h1) is rendered outside contentLoading block', () => {
		const source = readFileSync(pagePath, 'utf-8');
		const titlePos = source.indexOf('ตารางฉาย');
		const loadingPos = source.indexOf('{#if contentLoading}');
		expect(titlePos).toBeGreaterThan(0);
		expect(loadingPos).toBeGreaterThan(0);
		expect(titlePos).toBeLessThan(loadingPos);
	});

	it('view toggle snippet is rendered outside contentLoading block', () => {
		const source = readFileSync(pagePath, 'utf-8');
		const togglePos = source.indexOf('{@render viewToggle()}');
		const loadingPos = source.indexOf('{#if contentLoading}');
		expect(togglePos).toBeGreaterThan(0);
		expect(togglePos).toBeLessThan(loadingPos);
	});

	it('month prev/next controls appear outside (before first) contentLoading block', () => {
		const source = readFileSync(pagePath, 'utf-8');
		const loadingPos = source.indexOf('{#if contentLoading}');
		const prevPos = source.indexOf('onclick={prevMonth}');
		const nextPos = source.indexOf('onclick={nextMonth}');
		expect(prevPos).toBeGreaterThan(0);
		expect(nextPos).toBeGreaterThan(0);
		// In the CURRENT buggy code these are INSIDE {:else} after contentLoading
		// In the FIXED code they will be before any contentLoading block
		expect(prevPos).toBeLessThan(loadingPos);
		expect(nextPos).toBeLessThan(loadingPos);
	});

	it('week prev/next controls appear outside contentLoading block (list view)', () => {
		const source = readFileSync(pagePath, 'utf-8');
		const prevPos = source.indexOf('onclick={prevWeek}');
		const nextPos = source.indexOf('onclick={nextWeek}');
		// Find the contentLoading block that comes AFTER prevWeek (in list view)
		const loadingPos = source.indexOf('{#if contentLoading}', prevPos);
		expect(prevPos).toBeGreaterThan(0);
		expect(nextPos).toBeGreaterThan(0);
		expect(prevPos).toBeLessThan(loadingPos);
		expect(nextPos).toBeLessThan(loadingPos);
	});

	it('goToToday and goToThisWeek appear outside contentLoading block', () => {
		const source = readFileSync(pagePath, 'utf-8');
		const todayPos = source.indexOf('onclick={goToToday}');
		const thisWeekPos = source.indexOf('onclick={goToThisWeek}');
		// Each control should be before the contentLoading block that's nearest in its view
		const todayLoadingPos = source.indexOf('{#if contentLoading}', todayPos);
		const thisWeekLoadingPos = source.indexOf('{#if contentLoading}', thisWeekPos);
		expect(todayPos).toBeGreaterThan(0);
		expect(thisWeekPos).toBeGreaterThan(0);
		expect(todayPos).toBeLessThan(todayLoadingPos);
		expect(thisWeekPos).toBeLessThan(thisWeekLoadingPos);
	});

	it('loading skeleton text appears inside a contentLoading block (after {#if contentLoading})', () => {
		const source = readFileSync(pagePath, 'utf-8');
		const loadingPos = source.indexOf('{#if contentLoading}');
		const skeletonPos = source.indexOf('กำลังโหลดตารางฉาย');
		expect(skeletonPos).toBeGreaterThan(loadingPos);
	});

	it('notes section (หมายเหตุ) appears outside any contentLoading block', () => {
		const source = readFileSync(pagePath, 'utf-8');
		// Find last {@render children()} or {/if} that closes the outermost content-area block
		// In the fixed code, notes will be after all contentLoading {/if} blocks
		const lastClosingIf = source.lastIndexOf('{/if}');
		const notesPos = source.indexOf('หมายเหตุ');
		expect(notesPos).toBeGreaterThan(0);
		expect(notesPos).toBeGreaterThan(lastClosingIf);
	});
});
