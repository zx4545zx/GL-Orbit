import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types.js';
import type { CalendarApiResponse } from '$lib/types/calendar.js';

const thaiMonths = [
	'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
	'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const load: PageLoad = async ({ url, fetch }) => {
	const yearParam = url.searchParams.get('year');
	const monthParam = url.searchParams.get('month');
	const startDateParam = url.searchParams.get('startDate');
	const endDateParam = url.searchParams.get('endDate');

	const now = new Date();
	const defaultYear = now.getFullYear();
	const defaultMonth = now.getMonth() + 1;

	let apiUrl: string;
	let displayYear: number;
	let displayMonth: number;

	if (yearParam !== null && monthParam !== null) {
		const y = parseInt(yearParam, 10);
		const m = parseInt(monthParam, 10);
		displayYear = isNaN(y) ? defaultYear : y;
		displayMonth = isNaN(m) || m < 1 || m > 12 ? defaultMonth : m;
		apiUrl = `/api/calendar?year=${displayYear}&month=${displayMonth}`;
	} else if (startDateParam !== null && endDateParam !== null) {
		apiUrl = `/api/calendar?startDate=${startDateParam}&endDate=${endDateParam}`;
		const startDate = new Date(startDateParam);
		displayYear = isNaN(startDate.getTime()) ? defaultYear : startDate.getFullYear();
		displayMonth = isNaN(startDate.getTime()) ? defaultMonth : startDate.getMonth() + 1;
	} else {
		displayYear = defaultYear;
		displayMonth = defaultMonth;
		apiUrl = `/api/calendar?year=${displayYear}&month=${displayMonth}`;
	}

	const res = await fetch(apiUrl);

	if (!res.ok) {
		const body = await res.json().catch(() => ({ error: 'เกิดข้อผิดพลาด' }));
		throw error(res.status, body.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
	}

	const calendar: CalendarApiResponse = await res.json();

	const buddhistYear = displayYear + 543;
	const monthName = thaiMonths[displayMonth - 1];

	return {
		calendar,
		params: {
			year: displayYear,
			month: displayMonth,
			startDate: startDateParam,
			endDate: endDateParam,
		},
		meta: {
			title: `ตารางฉายเดือน${monthName} ${buddhistYear} | GL-Orbit`,
			description: `ตารางฉายซีรีส์ GL เดือน${monthName} ${buddhistYear} อัปเดตล่าสุด พร้อมเวลาฉายและแพลตฟอร์ม`,
		}
	};
};
