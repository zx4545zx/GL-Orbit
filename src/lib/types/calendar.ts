export interface CalendarEvent {
  time: string;
  series: string;
  seriesId: string;
  posterUrl: string;
  episode: string;
  platforms: string[];
  isUncut: boolean;
}

export interface ScheduleDay {
  day: string;
  dayIndex: number;
  items: CalendarEvent[];
}

export interface CalendarApiResponse {
  events: Record<string, CalendarEvent[]>;
  allSeries: string[];
  seriesPosters: Record<string, string>;
  platforms: string[];
  scheduleByDay: ScheduleDay[];
}

export interface CalendarApiErrorResponse {
  error: string;
}
