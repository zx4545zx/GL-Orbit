import { eq, and, isNull, gte, lte, asc, inArray } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { series, episodes, episodeSchedules, platforms } from '$lib/server/db/schema.js';
import { getCached, setCached } from '$lib/server/cache.js';
import type { CountdownItem } from '$lib/types/home.js';

const CACHE_KEY = 'query:countdown';
const CACHE_TTL = 30_000;

export interface CountdownRow {
	id: string;
	airDate: Date;
	isUncut: boolean;
	episodeNumber: number;
	episodeTitle: string | null;
	seriesId: string;
	seriesTitleEn: string;
	seriesTitleTh: string | null;
	posterUrl: string | null;
	platformName: string;
}

/**
 * รวมแถวที่เป็นซีรีส์เดียวกัน + วันเวลาฉายเดียวกัน (seriesId + airDate) ให้เป็นการ์ดเดียว
 * โดยรวมชื่อแพลตฟอร์มคั่นด้วยลูกน้ำ (เช่น "iqiyi, youtube") และ OR ค่า isUncut
 * ลำดับผลลัพธ์คงเดิมตาม airDate (เรียงจากใกล้สุด) เพราะ rows เข้ามาเรียงอยู่แล้ว
 */
export function dedupeCountdownRows(rows: CountdownRow[]): CountdownRow[] {
	const groups = new Map<string, CountdownRow[]>();
	for (const row of rows) {
		const key = `${row.seriesId}::${row.airDate.getTime()}`;
		const group = groups.get(key);
		if (group) group.push(row);
		else groups.set(key, [row]);
	}

	const result: CountdownRow[] = [];
	for (const group of groups.values()) {
		// กรณีตอนต่างกันแต่เวลาเดียวกัน: ใช้ตอนที่เลขน้อยที่สุดเป็นตัวแทน
		group.sort((a, b) => a.episodeNumber - b.episodeNumber);
		const head = group[0];

		const platformSet = new Set<string>();
		for (const r of group) platformSet.add(r.platformName);
		const platforms = Array.from(platformSet).sort((a, b) => a.localeCompare(b)).join(', ');

		result.push({
			...head,
			platformName: platforms,
			isUncut: group.some((r) => r.isUncut)
		});
	}
	return result;
}

/**
 * ซีรีส์ที่กำลังฉาย (ONGOING) หรือยังไม่ฉาย (UPCOMING)
 * และมีตอนที่จะออกอากาศภายใน 7 วันข้างหน้า
 * `airDate` เป็น ISO string (UTC) เพื่อให้ client นับถอยหลังได้แม่นยำในทุก timezone
 */
export async function getCountdownData(): Promise<CountdownItem[]> {
	const cached = getCached<CountdownItem[]>(CACHE_KEY, CACHE_TTL);
	if (cached) {
		return cached;
	}

	const db = await getDb();
	const raw = await db
		.select({
			id: episodeSchedules.id,
			airDate: episodeSchedules.airDate,
			isUncut: episodeSchedules.isUncut,
			episodeNumber: episodes.episodeNumber,
			episodeTitle: episodes.title,
			seriesId: series.id,
			seriesTitleEn: series.titleEn,
			seriesTitleTh: series.titleTh,
			posterUrl: series.posterUrl,
			platformName: platforms.name
		})
		.from(episodeSchedules)
		.innerJoin(episodes, eq(episodeSchedules.episodeId, episodes.id))
		.innerJoin(series, eq(episodes.seriesId, series.id))
		.innerJoin(platforms, eq(episodeSchedules.platformId, platforms.id))
		.where(and(
			gte(episodeSchedules.airDate, new Date()),
			lte(episodeSchedules.airDate, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
			inArray(series.status, ['ONGOING', 'UPCOMING']),
			isNull(episodeSchedules.deletedAt),
			isNull(episodes.deletedAt),
			isNull(series.deletedAt)
		))
		.orderBy(asc(episodeSchedules.airDate))
		.limit(100);

	// รวมการ์ดที่เป็นซีรีส์เดียวกัน + เวลาฉายเดียวกัน, merge แพลตฟอร์มคั่นด้วยลูกน้ำ
	const rows = dedupeCountdownRows(raw);

	const result: CountdownItem[] = rows.map((s) => ({
		id: s.id,
		seriesId: s.seriesId,
		title: s.seriesTitleEn,
		subtitle: s.seriesTitleTh ?? '',
		poster: s.posterUrl ?? '/placeholders/poster.svg',
		episode: s.episodeTitle ?? `EP.${s.episodeNumber}`,
		platform: s.platformName,
		airDate: s.airDate.toISOString(),
		isUncut: s.isUncut
	}));

	setCached(CACHE_KEY, result, CACHE_TTL);
	return result;
}
