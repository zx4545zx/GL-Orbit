import { formatDateLocal, getEndOfWeek, getStartOfWeek, parseCalendarParams } from './calendar.js';
import { type CalendarQuery, getCalendarData } from '$lib/server/queries/calendar.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const params = parseCalendarParams(url.searchParams);
	const now = new Date();

	let query: CalendarQuery;
	let displayYear: number;
	let displayMonth: number;

	if (params.year !== undefined && params.month !== undefined) {
		displayYear = params.year;
		displayMonth = params.month;
		query = { type: 'month', year: displayYear, month: displayMonth };
	} else if (params.startDate && params.endDate) {
		const sd = new Date(params.startDate);
		displayYear = isNaN(sd.getTime()) ? now.getFullYear() : sd.getFullYear();
		displayMonth = isNaN(sd.getTime()) ? now.getMonth() + 1 : sd.getMonth() + 1;
		query = { type: 'week', startDate: params.startDate, endDate: params.endDate };
	} else {
		displayYear = now.getFullYear();
		displayMonth = now.getMonth() + 1;
		const start = getStartOfWeek(now);
		const end = getEndOfWeek(now);
		params.startDate = formatDateLocal(start);
		params.endDate = formatDateLocal(end);
		query = { type: 'week', startDate: params.startDate, endDate: params.endDate };
	}

	const calendar = await getCalendarData(query);

	return {
		calendar,
		params: {
			year: displayYear,
			month: displayMonth,
			startDate: params.startDate ?? null,
			endDate: params.endDate ?? null
		}
	};
};
