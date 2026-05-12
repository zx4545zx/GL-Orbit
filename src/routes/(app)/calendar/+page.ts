import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch }) => {
	return {
		events: fetch('/api/calendar')
			.then((r) => r.json())
			.then((data) => data.events),
		allSeries: fetch('/api/calendar')
			.then((r) => r.json())
			.then((data) => data.allSeries),
		platforms: fetch('/api/calendar')
			.then((r) => r.json())
			.then((data) => data.platforms),
		scheduleByDay: fetch('/api/calendar')
			.then((r) => r.json())
			.then((data) => data.scheduleByDay)
	};
};
