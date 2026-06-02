export interface CalendarEvent {
  time: string;
  series: string;
  seriesId: string;
  episode: string;
  platforms: string[];
  isUncut: boolean;
}

export interface ScheduleDay {
  day: string;
  items: CalendarEvent[];
}

export interface CalendarApiResponse {
  events: Record<string, CalendarEvent[]>;
  allSeries: string[];
  platforms: string[];
  scheduleByDay: ScheduleDay[];
}

export interface CalendarApiErrorResponse {
  error: string;
}
