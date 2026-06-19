import { fetchCalendar, parseCalendarParams } from './calendar.js';
import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch, url }) => {
	const params = parseCalendarParams(url.searchParams);
	return await fetchCalendar(params.year, params.month, params.startDate, params.endDate, fetch);
};
