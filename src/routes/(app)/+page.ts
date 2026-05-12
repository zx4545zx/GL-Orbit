import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch }) => {
	return {
		featuredSeries: fetch('/api/home')
			.then((r) => r.json())
			.then((data) => data.featuredSeries),
		upcomingSchedule: fetch('/api/home')
			.then((r) => r.json())
			.then((data) => data.upcomingSchedule)
	};
};
