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
	seriesId: string;
	isUncut: boolean;
	episode: string;
	platform: string;
}

export interface HomeApiResponse {
	featuredSeries: FeaturedSeriesItem[];
	upcomingSchedule: UpcomingScheduleItem[];
}
