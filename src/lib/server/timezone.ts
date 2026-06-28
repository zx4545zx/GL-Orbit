const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;

export function toThailandTime(date: Date): Date {
	return new Date(date.getTime() + THAILAND_OFFSET_MS);
}

export function formatThailandDate(date: Date): string {
	const thai = toThailandTime(date);
	const year = thai.getUTCFullYear();
	const month = String(thai.getUTCMonth() + 1).padStart(2, '0');
	const day = String(thai.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function formatThailandTime(date: Date): string {
	const thai = toThailandTime(date);
	const hours = String(thai.getUTCHours()).padStart(2, '0');
	const minutes = String(thai.getUTCMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}

export function formatThailandDateTime(date: Date): string {
	const thai = toThailandTime(date);
	return thai.toISOString().replace('Z', '+07:00');
}

export function getThailandDayOfWeek(date: Date): number {
	return toThailandTime(date).getUTCDay();
}
