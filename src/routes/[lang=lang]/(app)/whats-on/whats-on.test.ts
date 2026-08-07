import { describe, expect, it } from 'vitest';
import type { OrbitEvent } from '$lib/types/whats-on.js';
import { buildWhatsOnUrl, eventsForDate, getWhatsOnEventWindow, googleMapsSearchUrl, parseWhatsOnParams, venueName } from './whats-on.js';

const multiDayEvent: OrbitEvent = {
	id: 'event-1',
	title: 'Two-day event',
	performer: null,
	fullTitle: 'Two-day event',
	dateKey: '2026-08-03',
	endDateKey: '2026-08-04',
	startsAt: '2026-08-03T00:00:00+07:00',
	endsAt: '2026-08-04T23:59:00+07:00',
	allDay: true,
	location: null,
	eventTypeId: null,
	sourceTimezone: 'Asia/Bangkok'
};

describe('parseWhatsOnParams', () => {
	it('defaults to the all view and provided fallback date', () => {
		expect(parseWhatsOnParams(new URLSearchParams(), new Date('2026-08-03T12:00:00+07:00'))).toEqual({
			view: 'all',
			year: 2026,
			month: 8,
			anchorDate: '2026-08-03'
		});
	});

	it('accepts valid month parameters and rejects unknown views', () => {
		expect(parseWhatsOnParams(new URLSearchParams('view=calendar&year=2026&month=9&date=bad'), new Date('2026-08-03T12:00:00+07:00'))).toEqual({
			view: 'calendar',
			year: 2026,
			month: 9,
			anchorDate: '2026-08-03'
		});
		expect(parseWhatsOnParams(new URLSearchParams('view=unknown'), new Date('2026-08-03T12:00:00+07:00')).view).toBe('all');
	});
});

describe('getWhatsOnEventWindow', () => {
	it('uses bounded ranges for all, week, and calendar views', () => {
		const shared = { year: 2026, month: 8, anchorDate: '2026-08-03' };
		expect(getWhatsOnEventWindow({ ...shared, view: 'all' })).toEqual({
			start: '2026-07-02T17:00:00.000Z',
			end: '2027-02-01T17:00:00.000Z'
		});
		expect(getWhatsOnEventWindow({ ...shared, view: 'week' })).toEqual({
			start: '2026-07-02T17:00:00.000Z',
			end: '2026-08-09T17:00:00.000Z'
		});
		expect(getWhatsOnEventWindow({ ...shared, view: 'calendar' })).toEqual({
			start: '2026-06-25T17:00:00.000Z',
			end: '2026-09-06T17:00:00.000Z'
		});
	});
});

describe('eventsForDate', () => {
	it('includes all dates covered by a multi-day event', () => {
		expect(eventsForDate([multiDayEvent], '2026-08-03')).toHaveLength(1);
		expect(eventsForDate([multiDayEvent], '2026-08-04')).toHaveLength(1);
		expect(eventsForDate([multiDayEvent], '2026-08-05')).toHaveLength(0);
	});
});

describe('buildWhatsOnUrl', () => {
	it('keeps all clean and uses the right period parameters for week and calendar', () => {
		expect(buildWhatsOnUrl('th', { view: 'all', year: 2026, month: 8, anchorDate: '2026-08-03' }))
			.toBe('/th/whats-on?view=all');
		expect(buildWhatsOnUrl('th', { view: 'week', year: 2026, month: 8, anchorDate: '2026-08-03' }))
			.toBe('/th/whats-on?view=week&date=2026-08-03');
		expect(buildWhatsOnUrl('en', { view: 'calendar', year: 2026, month: 8, anchorDate: '2026-08-03' }))
			.toBe('/en/whats-on?view=calendar&year=2026&month=8');
	});
});

describe('venueName', () => {
	it('keeps venue names and excludes missing or URL locations', () => {
		expect(venueName('Queen Sirikit National Convention Center')).toBe('Queen Sirikit National Convention Center');
		expect(venueName(null)).toBeNull();
		expect(venueName('https://example.com/location')).toBeNull();
	});
});

describe('googleMapsSearchUrl', () => {
	it('URL-encodes the venue for a Google Maps search', () => {
		expect(googleMapsSearchUrl('Queen Sirikit & Hall')).toBe('https://www.google.com/maps?q=Queen%20Sirikit%20%26%20Hall');
	});
});
