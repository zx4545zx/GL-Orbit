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

/**
 * ซีรีส์ที่กำลังจะฉายภายใน 7 วัน สำหรับนับถอยหลังบนหน้าแรก
 * `airDate` เป็น ISO string (UTC) เพื่อให้ client คำนวณเวลาที่เหลือได้แม่นยำในทุก timezone
 */
export interface CountdownItem {
	id: string;
	seriesId: string;
	title: string;
	subtitle: string;
	poster: string;
	episode: string;
	platform: string;
	airDate: string;
	isUncut: boolean;
}

export interface HomeApiResponse {
	featuredSeries: FeaturedSeriesItem[];
	upcomingSchedule: UpcomingScheduleItem[];
	countdown: CountdownItem[];
}
