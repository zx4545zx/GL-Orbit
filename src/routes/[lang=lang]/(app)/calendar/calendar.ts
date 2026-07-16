/**
 * Pure calendar view utilities (shared client/server).
 * Note: data fetching lives in $lib/server/queries/calendar.ts and is called
 * directly by the page server load — no extra HTTP hop.
 */

export interface CalendarParams {
	year?: number;
	month?: number;
	startDate: string | null;
	endDate: string | null;
	view: 'grid' | 'calendar' | 'list' | 'card' | null;
	/** Stable string derived from the search params, suitable as a reactive dependency key. */
	key: string;
}

/**
 * Parse query search params into structured fetch arguments.
 * Pure function, no side effects, fully testable.
 */
export function parseCalendarParams(searchParams: URLSearchParams): CalendarParams {
	const yearParam = searchParams.get('year');
	const monthParam = searchParams.get('month');
	const startDateParam = searchParams.get('startDate');
	const endDateParam = searchParams.get('endDate');
	const viewParam = searchParams.get('view');

	const year = yearParam ? parseInt(yearParam, 10) : undefined;
	const month = monthParam ? parseInt(monthParam, 10) : undefined;
	const startDate = startDateParam ?? null;
	const endDate = endDateParam ?? null;
	const view = viewParam === 'grid' || viewParam === 'calendar' || viewParam === 'list' || viewParam === 'card'
		? viewParam
		: null;

	const key = searchParams.toString();

	return { year, month, startDate, endDate, view, key };
}

/**
 * Format a Date to YYYY-MM-DD string.
 */
export function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Get Monday of the week containing the given date.
 */
export function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	return new Date(d.setDate(diff));
}

/**
 * Get the end date (exclusive, 7 days after start-of-week) for week-range queries.
 */
export function getEndOfWeek(date: Date): Date {
	const start = getStartOfWeek(date);
	const end = new Date(start);
	end.setDate(end.getDate() + 7);
	return end;
}

/**
 * Build a calendar URL for the given view mode and current params.
 *
 * - For month views (grid, calendar): use year/month params.
 * - For list view: use startDate/endDate (week) params,
 *   calculating the current week if no week params exist.
 */
export function getViewUrl(
	view: 'grid' | 'calendar' | 'list' | 'card',
	lang: string,
	currentYear: number | undefined,
	currentMonth: number | undefined,
	currentStartDate: string | null,
	currentEndDate: string | null
): string {
	const base = `/${lang}/calendar`;

	if (view === 'grid' || view === 'calendar') {
		const y = currentYear ?? new Date().getFullYear();
		const m = currentMonth ?? new Date().getMonth() + 1;
		return `${base}?year=${y}&month=${m}&view=${view}`;
	}

	if (view === 'list' || view === 'card') {
		if (currentStartDate && currentEndDate) {
			return `${base}?startDate=${currentStartDate}&endDate=${currentEndDate}&view=${view}`;
		}
	}
	const today = new Date();
	const start = getStartOfWeek(today);
	const end = getEndOfWeek(today);
	return `${base}?startDate=${formatDateLocal(start)}&endDate=${formatDateLocal(end)}&view=${view}`;
}
