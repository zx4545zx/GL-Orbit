export interface SeriesVideoRegistryEntry {
	key: string;
	labelTh: string;
	labelEn: string;
}

export const SERIES_VIDEO_TYPES = [
	{ key: 'TRAILER', labelTh: 'ตัวอย่าง', labelEn: 'Trailer' },
	{ key: 'PILOT', labelTh: 'ไพล็อต', labelEn: 'Pilot' }
] as const satisfies readonly SeriesVideoRegistryEntry[];

export type SeriesVideoType = (typeof SERIES_VIDEO_TYPES)[number]['key'];

export function getSeriesVideoType(value: unknown): (typeof SERIES_VIDEO_TYPES)[number] | null {
	return SERIES_VIDEO_TYPES.find(({ key }) => key === value) ?? null;
}

export function isSeriesVideoType(value: unknown): value is SeriesVideoType {
	return getSeriesVideoType(value) !== null;
}

export function seriesVideoTypeLabel(type: SeriesVideoType, lang: 'th' | 'en'): string {
	const entry = getSeriesVideoType(type)!;
	return lang === 'th' ? entry.labelTh : entry.labelEn;
}

export function sortSeriesVideosByRegistry<T extends {
	id: string;
	type: SeriesVideoType;
	sortOrder: number;
	createdAt: Date;
}>(videos: readonly T[]): T[] {
	const order = new Map(SERIES_VIDEO_TYPES.map((entry, index) => [entry.key, index]));
	return [...videos].sort((a, b) =>
		(order.get(a.type)! - order.get(b.type)!) ||
		(a.sortOrder - b.sortOrder) ||
		(a.createdAt.getTime() - b.createdAt.getTime()) ||
		a.id.localeCompare(b.id)
	);
}
