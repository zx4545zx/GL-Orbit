import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSeries, parseSeriesParams } from './series.js';

describe('parseSeriesParams', () => {
	it('extracts search query from search params', () => {
		const params = new URLSearchParams('search=love');
		const result = parseSeriesParams(params);

		expect(result.search).toBe('love');
		expect(result.status).toBe('ALL');
		expect(result.page).toBe(1);
	});

	it('extracts status from search params', () => {
		const params = new URLSearchParams('status=ongoing');
		const result = parseSeriesParams(params);

		expect(result.search).toBe('');
		expect(result.status).toBe('ONGOING');
		expect(result.page).toBe(1);
	});

	it('returns ALL status when status param is missing', () => {
		const params = new URLSearchParams('');
		const result = parseSeriesParams(params);

		expect(result.status).toBe('ALL');
	});

	it('returns ALL status for unrecognized status value', () => {
		const params = new URLSearchParams('status=unknown');
		const result = parseSeriesParams(params);

		expect(result.status).toBe('ALL');
	});

	it('extracts page from search params with default 1', () => {
		const params = new URLSearchParams('page=3');
		const result = parseSeriesParams(params);

		expect(result.page).toBe(3);
	});

	it('returns page 1 when page param is missing', () => {
		const params = new URLSearchParams('');
		const result = parseSeriesParams(params);

		expect(result.page).toBe(1);
	});

	it('returns a stable key derived from the search string for reactivity', () => {
		const params1 = parseSeriesParams(new URLSearchParams('search=love&status=ongoing'));
		const params2 = parseSeriesParams(new URLSearchParams('search=love&status=upcoming'));
		const params3 = parseSeriesParams(new URLSearchParams('search=love&status=ongoing'));

		// Same input => same key
		expect(params3.key).toBe(params1.key);
		// Different input => different key
		expect(params2.key).not.toBe(params1.key);
	});

	it('key changes when search changes', () => {
		const key1 = parseSeriesParams(new URLSearchParams('search=love')).key;
		const key2 = parseSeriesParams(new URLSearchParams('search=drama')).key;

		expect(key2).not.toBe(key1);
	});

	it('key changes when page changes', () => {
		const key1 = parseSeriesParams(new URLSearchParams('page=1')).key;
		const key2 = parseSeriesParams(new URLSearchParams('page=2')).key;

		expect(key2).not.toBe(key1);
	});

	it('handles combined search, status, and page params', () => {
		const params = new URLSearchParams('search=love+&status=ongoing&page=2');
		const result = parseSeriesParams(params);

		expect(result.search).toBe('love ');
		expect(result.status).toBe('ONGOING');
		expect(result.page).toBe(2);
	});
});

describe('fetchSeries URL construction', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ items: [], total: 0, page: 1, totalPages: 0 })
		}));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('calls /api/series with no params when status=ALL and search is empty', async () => {
		await fetchSeries('', 'ALL');
		expect(fetch).toHaveBeenCalledWith('/api/series');
	});

	it('calls /api/series?search=love when search is provided', async () => {
		await fetchSeries('love', 'ALL');
		expect(fetch).toHaveBeenCalledWith('/api/series?search=love');
	});

	it('calls /api/series?status=ongoing when status is ONGOING', async () => {
		await fetchSeries('', 'ONGOING');
		expect(fetch).toHaveBeenCalledWith('/api/series?status=ongoing');
	});

	it('calls /api/series?search=love&status=ongoing when both provided', async () => {
		await fetchSeries('love', 'ONGOING');
		expect(fetch).toHaveBeenCalledWith('/api/series?search=love&status=ongoing');
	});

	it('calls /api/series with page param when pageNum > 1', async () => {
		await fetchSeries('', 'ALL', 3);
		expect(fetch).toHaveBeenCalledWith('/api/series?page=3');
	});

	it('does not add page param when pageNum is 1', async () => {
		await fetchSeries('', 'ALL', 1);
		expect(fetch).toHaveBeenCalledWith('/api/series');
	});
});

describe('fetchSeries error handling', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: false,
			json: () => Promise.resolve({})
		}));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns empty series on API error', async () => {
		const result = await fetchSeries('test', 'ONGOING');
		expect(result.series).toEqual({ items: [], total: 0, page: 1, totalPages: 0 });
		expect(result.filters).toEqual({ search: 'test', status: 'ONGOING' });
	});
});
