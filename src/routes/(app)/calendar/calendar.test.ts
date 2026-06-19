import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseCalendarParams, getViewUrl } from './calendar.js';

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

describe('getViewUrl', () => {
	it('returns week URL (startDate/endDate) for list view', () => {
		const url = getViewUrl('list', 2026, 6, null, null);
		expect(url).toMatch(/^\/calendar\?startDate=\d{4}-\d{2}-\d{2}&endDate=\d{4}-\d{2}-\d{2}$/);
	});

	it('returns month URL (year/month) for grid view', () => {
		const url = getViewUrl('grid', 2026, 6, null, null);
		expect(url).toBe('/calendar?year=2026&month=6');
	});

	it('returns month URL (year/month) for calendar view', () => {
		const url = getViewUrl('calendar', 2026, 6, null, null);
		expect(url).toBe('/calendar?year=2026&month=6');
	});

	it('preserves existing week params when switching to list view', () => {
		const url = getViewUrl('list', undefined, undefined, '2026-06-01', '2026-06-07');
		expect(url).toBe('/calendar?startDate=2026-06-01&endDate=2026-06-07');
	});

	it('returns month URL for grid view even when week params exist (switching FROM list)', () => {
		const url = getViewUrl('grid', 2026, 6, '2026-06-01', '2026-06-07');
		expect(url).toBe('/calendar?year=2026&month=6');
	});

	it('returns month URL for calendar view even when week params exist (switching FROM list)', () => {
		const url = getViewUrl('calendar', 2026, 6, '2026-06-01', '2026-06-07');
		expect(url).toBe('/calendar?year=2026&month=6');
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

	it('removes text-based loading indicator กำลังโหลดตารางฉาย', () => {
		const source = readFileSync(pagePath, 'utf-8');
		expect(source).not.toContain('กำลังโหลดตารางฉาย');
	});

	it('grid view has structural table skeleton with day headers and series rows', () => {
		const source = readFileSync(pagePath, 'utf-8');
		const gridSkeletonPos = source.indexOf('grid-loading-skeleton');
		expect(gridSkeletonPos).toBeGreaterThan(0);
		// Assert it's inside a grid view contentLoading block
		const gridViewBlock = source.indexOf('{#if viewMode === \'grid\'}');
		expect(gridSkeletonPos).toBeGreaterThan(gridViewBlock);
	});

	it('calendar view has 7-column month grid skeleton', () => {
		const source = readFileSync(pagePath, 'utf-8');
		const calSkeletonPos = source.indexOf('calendar-loading-skeleton');
		expect(calSkeletonPos).toBeGreaterThan(0);
	});

	it('list view has grouped day-card skeleton with event rows', () => {
		const source = readFileSync(pagePath, 'utf-8');
		const listSkeletonPos = source.indexOf('list-loading-skeleton');
		expect(listSkeletonPos).toBeGreaterThan(0);
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

	it('view toggle onclick delegates to goto(getViewUrl(...)) for ALL view modes (not just list)', () => {
		const source = readFileSync(pagePath, 'utf-8');
		// The onclick handler should NOT have a per-mode guard like `if (btn.key === 'list')`.
		// Instead it should call goto(getViewUrl(btn.key, ...)) unconditionally.
		// This ensures switching back from list to grid/calendar also changes the URL.
		const hasPerModeGuard = source.includes(`if (btn.key === 'list')`);
		// The correct pattern is unconditional goto with btn.key
		const hasBtnKeyPattern = source.includes(`goto(getViewUrl(btn.key`);
		expect(hasPerModeGuard).toBe(false);
		expect(hasBtnKeyPattern).toBe(true);
	});
});
