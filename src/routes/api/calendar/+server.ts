import { json } from '@sveltejs/kit';
import { validateCalendarQuery, getCalendarData } from '$lib/server/queries/calendar.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
	const validation = validateCalendarQuery(url);

	if (!validation.ok) {
		return json({ error: validation.error }, { status: 400 });
	}

	try {
		return json(await getCalendarData(validation.query));
	} catch (err) {
		console.error('Calendar API error:', err);
		return json({ error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' }, { status: 500 });
	}
};
