/**
 * Client-side fetch module for home page.
 */

export interface FeaturedSeriesItem {
	id: string;
	poster: string;
	title: string;
	status: string;
	studio: string;
	subtitle: string;
}

export interface UpcomingScheduleItem {
	day: string;
	time: string;
	series: string;
	isUncut: boolean;
	episode: string;
	platform: string;
}

export interface HomeApiResponse {
	featuredSeries: FeaturedSeriesItem[];
	upcomingSchedule: UpcomingScheduleItem[];
}

export async function fetchHome(): Promise<HomeApiResponse> {
	const res = await fetch('/api/home');
	const data = await res.json();
	return {
		featuredSeries: data.featuredSeries ?? [],
		upcomingSchedule: data.upcomingSchedule ?? []
	};
}
