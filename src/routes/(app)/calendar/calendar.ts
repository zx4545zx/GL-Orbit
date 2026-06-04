/**
 * Client-side fetch module for calendar page.
 */

import type { CalendarApiResponse } from '$lib/types/calendar.js';

export async function fetchCalendar(year?: number, month?: number, startDate?: string | null, endDate?: string | null): Promise<{ calendar: CalendarApiResponse; params: { year: number; month: number; startDate: string | null; endDate: string | null } }> {
	let apiUrl: string;
	let displayYear: number;
	let displayMonth: number;

	const now = new Date();
	const defaultYear = now.getFullYear();
	const defaultMonth = now.getMonth() + 1;

	if (year !== undefined && month !== undefined) {
		displayYear = year;
		displayMonth = month;
		apiUrl = `/api/calendar?year=${year}&month=${month}`;
	} else if (startDate !== null && endDate !== null && startDate !== undefined && endDate !== undefined) {
		apiUrl = `/api/calendar?startDate=${startDate}&endDate=${endDate}`;
		const sd = new Date(startDate);
		displayYear = isNaN(sd.getTime()) ? defaultYear : sd.getFullYear();
		displayMonth = isNaN(sd.getTime()) ? defaultMonth : sd.getMonth() + 1;
	} else {
		displayYear = defaultYear;
		displayMonth = defaultMonth;
		apiUrl = `/api/calendar?year=${displayYear}&month=${displayMonth}`;
	}

	const res = await fetch(apiUrl);

	if (!res.ok) {
		const body = await res.json().catch(() => ({ error: 'เกิดข้อผิดพลาด' }));
		throw new Error(body.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
	}

	const calendar: CalendarApiResponse = await res.json();

	return {
		calendar,
		params: {
			year: displayYear,
			month: displayMonth,
			startDate: startDate ?? null,
			endDate: endDate ?? null,
		}
	};
}
