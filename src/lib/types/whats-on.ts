export type EventView = 'all' | 'week' | 'calendar';
export type WhatsOnSourceStatus = 'live' | 'unavailable';

export interface NewsItem {
	id: string;
	slug: string;
	headline: string;
	blurb: string;
	coverImageUrl: string | null;
	sourceUrl: string | null;
	sourceName: string;
	publishedDate: string;
	status: 'approved';
}

export interface EventType {
	id: string;
	name: string;
	colorName: 'Blue' | 'Purple' | 'Lavender' | 'Grey' | 'Green' | 'Orange' | 'Red' | 'Yellow';
}

export interface OrbitEvent {
	id: string;
	title: string;
	performer: string | null;
	fullTitle: string;
	dateKey: string;
	endDateKey: string | null;
	startsAt: string;
	endsAt: string | null;
	allDay: boolean;
	location: string | null;
	eventTypeId: string | null;
	sourceTimezone: string;
}

export interface WhatsOnData {
	news: NewsItem[];
	eventTypes: EventType[];
	events: OrbitEvent[];
	sourceStatus: {
		news: WhatsOnSourceStatus;
		events: WhatsOnSourceStatus;
	};
}
