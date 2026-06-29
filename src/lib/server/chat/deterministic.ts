export type DeterministicChatIntent =
	| 'schedule_today'
	| 'schedule_tomorrow'
	| 'schedule_week'
	| 'schedule_month'
	| 'schedule_weekday'
	| 'schedule_next'
	| 'schedule_yesterday'
	| 'schedule_last_week'
	| 'schedule_last_month'
	| 'schedule_past'
	| 'series_all'
	| 'series_ongoing'
	| 'series_upcoming'
	| 'series_ended'
	| 'series_uncut'
	| 'series_by_genre'
	| 'series_by_platform'
	| 'series_by_studio'
	| 'series_artists_by_series'
	| 'artists_all'
	| 'platforms_all'
	| 'studios_all';

export type DeterministicChatSql = {
	intent: DeterministicChatIntent;
	sql: string;
};

const WEEKDAY_MAP = new Map<string, number>([
	['อาทิตย์', 0],
	['จันทร์', 1],
	['อังคาร', 2],
	['พุธ', 3],
	['พฤหัสบดี', 4],
	['พฤหัส', 4],
	['ศุกร์', 5],
	['เสาร์', 6]
]);

function scheduleForDateSql(dateExpression: string) {
	return `
SELECT
	s.id AS id,
	s.id AS series_id,
	s.title_th,
	s.title_en,
	p.name AS platform_name,
	NULL::timestamp AS air_date,
	ss.day_of_week,
	ss.air_time,
	NULL::text AS stream_link,
	ss.is_uncut,
	'weekly' AS schedule_type
FROM series_schedules ss
JOIN series s ON s.id = ss.series_id
LEFT JOIN platforms p ON p.id = ss.platform_id
WHERE s.deleted_at IS NULL
	AND s.status IN ('ONGOING', 'UPCOMING')
	AND p.deleted_at IS NULL
	AND ss.day_of_week = EXTRACT(DOW FROM ${dateExpression})::integer
UNION ALL
SELECT
	s.id AS id,
	s.id AS series_id,
	s.title_th,
	s.title_en,
	p.name AS platform_name,
	(es.air_date AT TIME ZONE 'Asia/Bangkok') AS air_date,
	NULL::integer AS day_of_week,
	(es.air_date AT TIME ZONE 'Asia/Bangkok')::time AS air_time,
	es.stream_link,
	es.is_uncut,
	'episode' AS schedule_type
FROM episode_schedules es
JOIN episodes e ON e.id = es.episode_id
JOIN series s ON s.id = e.series_id
LEFT JOIN platforms p ON p.id = es.platform_id
WHERE es.deleted_at IS NULL
	AND e.deleted_at IS NULL
	AND s.deleted_at IS NULL
	AND s.status IN ('ONGOING', 'UPCOMING')
	AND p.deleted_at IS NULL
	AND (es.air_date AT TIME ZONE 'Asia/Bangkok')::date = ${dateExpression}
ORDER BY air_time, title_en, platform_name
LIMIT 20`.trim();
}

const TODAY_SCHEDULE_SQL = scheduleForDateSql("(NOW() AT TIME ZONE 'Asia/Bangkok')::date");
const TOMORROW_SCHEDULE_SQL = scheduleForDateSql("((NOW() AT TIME ZONE 'Asia/Bangkok')::date + INTERVAL '1 day')::date");

function scheduleForRangeSql(range: 'week' | 'month') {
	const trunc = range === 'week' ? 'week' : 'month';
	const interval = range === 'week' ? '7 days' : '1 month';
	return `
SELECT
	s.id AS id,
	s.id AS series_id,
	s.title_th,
	s.title_en,
	p.name AS platform_name,
	NULL::timestamp AS air_date,
	ss.day_of_week,
	ss.air_time,
	NULL::text AS stream_link,
	ss.is_uncut,
	'weekly' AS schedule_type
FROM series_schedules ss
JOIN series s ON s.id = ss.series_id
LEFT JOIN platforms p ON p.id = ss.platform_id
WHERE s.deleted_at IS NULL
	AND s.status IN ('ONGOING', 'UPCOMING')
	AND p.deleted_at IS NULL
UNION ALL
SELECT
	s.id AS id,
	s.id AS series_id,
	s.title_th,
	s.title_en,
	p.name AS platform_name,
	(es.air_date AT TIME ZONE 'Asia/Bangkok') AS air_date,
	EXTRACT(DOW FROM (es.air_date AT TIME ZONE 'Asia/Bangkok'))::integer AS day_of_week,
	(es.air_date AT TIME ZONE 'Asia/Bangkok')::time AS air_time,
	es.stream_link,
	es.is_uncut,
	'episode' AS schedule_type
FROM episode_schedules es
JOIN episodes e ON e.id = es.episode_id
JOIN series s ON s.id = e.series_id
LEFT JOIN platforms p ON p.id = es.platform_id
WHERE es.deleted_at IS NULL
	AND e.deleted_at IS NULL
	AND s.deleted_at IS NULL
	AND s.status IN ('ONGOING', 'UPCOMING')
	AND p.deleted_at IS NULL
	AND (es.air_date AT TIME ZONE 'Asia/Bangkok')::date >= date_trunc('${trunc}', (NOW() AT TIME ZONE 'Asia/Bangkok'))::date
	AND (es.air_date AT TIME ZONE 'Asia/Bangkok')::date < (date_trunc('${trunc}', (NOW() AT TIME ZONE 'Asia/Bangkok'))::date + INTERVAL '${interval}')::date
ORDER BY day_of_week, air_time, title_en, platform_name
LIMIT 20`.trim();
}

const WEEK_SCHEDULE_SQL = scheduleForRangeSql('week');
const MONTH_SCHEDULE_SQL = scheduleForRangeSql('month');

function scheduleForWeekdaySql(dayOfWeek: number) {
	return `
SELECT
	s.id AS id,
	s.id AS series_id,
	s.title_th,
	s.title_en,
	p.name AS platform_name,
	NULL::timestamp AS air_date,
	ss.day_of_week,
	ss.air_time,
	NULL::text AS stream_link,
	ss.is_uncut,
	'weekly' AS schedule_type
FROM series_schedules ss
JOIN series s ON s.id = ss.series_id
LEFT JOIN platforms p ON p.id = ss.platform_id
WHERE s.deleted_at IS NULL
	AND s.status IN ('ONGOING', 'UPCOMING')
	AND p.deleted_at IS NULL
	AND ss.day_of_week = ${dayOfWeek}
UNION ALL
SELECT
	s.id AS id,
	s.id AS series_id,
	s.title_th,
	s.title_en,
	p.name AS platform_name,
	(es.air_date AT TIME ZONE 'Asia/Bangkok') AS air_date,
	EXTRACT(DOW FROM (es.air_date AT TIME ZONE 'Asia/Bangkok'))::integer AS day_of_week,
	(es.air_date AT TIME ZONE 'Asia/Bangkok')::time AS air_time,
	es.stream_link,
	es.is_uncut,
	'episode' AS schedule_type
FROM episode_schedules es
JOIN episodes e ON e.id = es.episode_id
JOIN series s ON s.id = e.series_id
LEFT JOIN platforms p ON p.id = es.platform_id
WHERE es.deleted_at IS NULL
	AND e.deleted_at IS NULL
	AND s.deleted_at IS NULL
	AND s.status IN ('ONGOING', 'UPCOMING')
	AND p.deleted_at IS NULL
	AND EXTRACT(DOW FROM (es.air_date AT TIME ZONE 'Asia/Bangkok'))::integer = ${dayOfWeek}
	AND (es.air_date AT TIME ZONE 'Asia/Bangkok')::date >= (NOW() AT TIME ZONE 'Asia/Bangkok')::date
ORDER BY air_time, title_en, platform_name
LIMIT 20`.trim();
}

const NEXT_SCHEDULE_SQL = `
SELECT
	s.id AS id,
	s.id AS series_id,
	s.title_th,
	s.title_en,
	e.episode_number,
	e.title AS episode_title,
	p.name AS platform_name,
	(es.air_date AT TIME ZONE 'Asia/Bangkok') AS air_date,
	es.stream_link,
	es.is_uncut
FROM episode_schedules es
JOIN episodes e ON e.id = es.episode_id
JOIN series s ON s.id = e.series_id
LEFT JOIN platforms p ON p.id = es.platform_id
WHERE es.deleted_at IS NULL
	AND e.deleted_at IS NULL
	AND s.deleted_at IS NULL
	AND s.status IN ('ONGOING', 'UPCOMING')
	AND p.deleted_at IS NULL
	AND (es.air_date AT TIME ZONE 'Asia/Bangkok') >= (NOW() AT TIME ZONE 'Asia/Bangkok')
ORDER BY es.air_date, s.title_en, e.episode_number
LIMIT 20`.trim();

function pastScheduleSelect(whereClause: string) {
	return `
SELECT
	s.id AS id,
	s.id AS series_id,
	s.title_th,
	s.title_en,
	s.status,
	e.episode_number,
	e.title AS episode_title,
	p.name AS platform_name,
	(es.air_date AT TIME ZONE 'Asia/Bangkok') AS air_date,
	(es.air_date AT TIME ZONE 'Asia/Bangkok')::time AS air_time,
	es.stream_link,
	es.is_uncut,
	'episode' AS schedule_type
FROM episode_schedules es
JOIN episodes e ON e.id = es.episode_id
JOIN series s ON s.id = e.series_id
LEFT JOIN platforms p ON p.id = es.platform_id
WHERE es.deleted_at IS NULL
	AND e.deleted_at IS NULL
	AND s.deleted_at IS NULL
	AND p.deleted_at IS NULL
	${whereClause}
ORDER BY air_date DESC, s.title_en, e.episode_number
LIMIT 20`.trim();
}

const YESTERDAY_SCHEDULE_SQL = pastScheduleSelect("AND (es.air_date AT TIME ZONE 'Asia/Bangkok')::date = ((NOW() AT TIME ZONE 'Asia/Bangkok')::date - INTERVAL '1 day')::date");
const LAST_WEEK_SCHEDULE_SQL = pastScheduleSelect("AND (es.air_date AT TIME ZONE 'Asia/Bangkok')::date >= (date_trunc('week', (NOW() AT TIME ZONE 'Asia/Bangkok'))::date - INTERVAL '7 days')::date\n\tAND (es.air_date AT TIME ZONE 'Asia/Bangkok')::date < date_trunc('week', (NOW() AT TIME ZONE 'Asia/Bangkok'))::date");
const LAST_MONTH_SCHEDULE_SQL = pastScheduleSelect("AND (es.air_date AT TIME ZONE 'Asia/Bangkok')::date >= (date_trunc('month', (NOW() AT TIME ZONE 'Asia/Bangkok'))::date - INTERVAL '1 month')::date\n\tAND (es.air_date AT TIME ZONE 'Asia/Bangkok')::date < date_trunc('month', (NOW() AT TIME ZONE 'Asia/Bangkok'))::date");
const PAST_SCHEDULE_SQL = pastScheduleSelect("AND (es.air_date AT TIME ZONE 'Asia/Bangkok') < (NOW() AT TIME ZONE 'Asia/Bangkok')");

function seriesListSql(extraWhere = '', joins = '') {
	return `
SELECT DISTINCT
	s.id AS id,
	s.title_th,
	s.title_en,
	s.status,
	s.poster_url,
	st.name AS studio_name
FROM series s
${joins}LEFT JOIN studios st ON st.id = s.studio_id
WHERE s.deleted_at IS NULL
	AND (st.id IS NULL OR st.deleted_at IS NULL)${extraWhere}
ORDER BY s.status, s.title_en
LIMIT 20`.trim();
}

function seriesByStatusSql(status: 'ONGOING' | 'UPCOMING' | 'ENDED') {
	return seriesListSql(`
	AND s.status = '${status}'`);
}

function seriesByGenreSql(genre: string) {
	return `
SELECT DISTINCT
	s.id AS id,
	s.title_th,
	s.title_en,
	s.status,
	s.poster_url,
	g.name AS genre_name,
	st.name AS studio_name
FROM series s
JOIN series_genres sg ON sg.series_id = s.id
JOIN genres g ON g.id = sg.genre_id
LEFT JOIN studios st ON st.id = s.studio_id
WHERE s.deleted_at IS NULL
	AND (st.id IS NULL OR st.deleted_at IS NULL)
	AND g.name ILIKE '%${genre}%'
ORDER BY s.status, s.title_en
LIMIT 20`.trim();
}

const SERIES_UNCUT_SQL = `
SELECT DISTINCT
	s.id AS id,
	s.title_th,
	s.title_en,
	s.status,
	p.name AS platform_name,
	'weekly' AS source_type
FROM series s
JOIN series_schedules ss ON ss.series_id = s.id
LEFT JOIN platforms p ON p.id = ss.platform_id
WHERE s.deleted_at IS NULL
	AND p.deleted_at IS NULL
	AND ss.is_uncut = true
UNION
SELECT DISTINCT
	s.id AS id,
	s.title_th,
	s.title_en,
	s.status,
	p.name AS platform_name,
	'episode' AS source_type
FROM series s
JOIN episodes e ON e.series_id = s.id
JOIN episode_schedules es ON es.episode_id = e.id
LEFT JOIN platforms p ON p.id = es.platform_id
WHERE s.deleted_at IS NULL
	AND e.deleted_at IS NULL
	AND es.deleted_at IS NULL
	AND p.deleted_at IS NULL
	AND es.is_uncut = true
ORDER BY title_en, platform_name
LIMIT 20`.trim();

function seriesByPlatformSql(platform: string) {
	return `
SELECT DISTINCT
	s.id AS id,
	s.title_th,
	s.title_en,
	s.status,
	p.name AS platform_name
FROM series s
LEFT JOIN series_schedules ss ON ss.series_id = s.id
LEFT JOIN episode_schedules es ON es.platform_id IS NOT NULL
LEFT JOIN episodes e ON e.id = es.episode_id AND e.series_id = s.id
JOIN platforms p ON p.id = ss.platform_id OR p.id = es.platform_id
WHERE s.deleted_at IS NULL
	AND (e.id IS NULL OR e.deleted_at IS NULL)
	AND (es.id IS NULL OR es.deleted_at IS NULL)
	AND p.deleted_at IS NULL
	AND p.name ILIKE '%${platform}%'
ORDER BY s.status, s.title_en
LIMIT 20`.trim();
}

function seriesByStudioSql(studio: string) {
	return seriesListSql(`
	AND st.name ILIKE '%${studio}%'`, 'JOIN studios st ON st.id = s.studio_id\n').replace('LEFT JOIN studios st ON st.id = s.studio_id\n', '');
}

function seriesArtistsBySeriesSql(seriesTitle: string) {
	return `
SELECT
	a.id AS id,
	a.id AS artist_id,
	a.nickname,
	a.full_name_th,
	a.full_name_en,
	a.profile_image_url,
	sa.role_name,
	s.id AS series_id,
	s.title_th,
	s.title_en
FROM series s
JOIN series_artists sa ON sa.series_id = s.id
JOIN artists a ON a.id = sa.artist_id
WHERE s.deleted_at IS NULL
	AND a.deleted_at IS NULL
	AND (s.title_th ILIKE '%${seriesTitle}%' OR s.title_en ILIKE '%${seriesTitle}%')
ORDER BY a.nickname
LIMIT 20`.trim();
}

const ARTISTS_ALL_SQL = `
SELECT
	id,
	nickname,
	full_name_th,
	full_name_en,
	profile_image_url
FROM artists
WHERE deleted_at IS NULL
ORDER BY nickname
LIMIT 20`.trim();

const PLATFORMS_ALL_SQL = `
SELECT
	id,
	name,
	logo_url,
	base_url
FROM platforms
WHERE deleted_at IS NULL
ORDER BY name
LIMIT 20`.trim();

const STUDIOS_ALL_SQL = `
SELECT
	id,
	name,
	logo_url,
	official_site
FROM studios
WHERE deleted_at IS NULL
ORDER BY name
LIMIT 20`.trim();

function normalizeQuestion(message: string) {
	return message.toLowerCase().replace(/\s+/g, ' ').trim();
}

function hasAny(normalized: string, terms: string[]) {
	return terms.some((term) => normalized.includes(term));
}

function cleanSearchTerm(term: string | undefined) {
	return term
		?.replace(/[%'_;\\]/g, '')
		.replace(/--/g, '')
		.replace(/\b(บ้าง|ไหม|มั้ย|หรือเปล่า|อะไร|เรื่องไหน|เรื่อง|ซีรีส์|series|ดูได้|ได้)\b/gi, '')
		.trim()
		.slice(0, 60) || null;
}

function extractWeekday(normalized: string) {
	for (const [name, day] of WEEKDAY_MAP) {
		if (normalized.includes(`วัน${name}`) || normalized.includes(name)) return day;
	}
	return null;
}

function extractGenre(normalized: string) {
	const match = normalized.match(/แนว\s*([^?？]+?)(?:เรื่อง|มี|อะไร|บ้าง|แนะนำ|$)/);
	return cleanSearchTerm(match?.[1]);
}

function extractPlatform(normalized: string) {
	const known = ['iqiyi', 'youtube', 'netflix', 'wetv', 'viu', 'gagaoolala', 'linetv', 'gmmtv app', 'gmm-tv app'];
	const found = known.find((name) => normalized.includes(name));
	if (found) return cleanSearchTerm(found);
	const match = normalized.match(/(?:บน|ใน|ทาง|ผ่าน|ที่)\s*([^?？]+?)(?:บ้าง|ไหม|มั้ย|$)/);
	return cleanSearchTerm(match?.[1]);
}

function extractStudio(normalized: string) {
	const match = normalized.match(/(?:ค่าย|สตูดิโอ|studio)\s*([^?？]+?)(?:มี|ทำ|ผลิต|บ้าง|$)/);
	return cleanSearchTerm(match?.[1]);
}

function extractSeriesTitleForArtistQuestion(normalized: string) {
	const afterSeriesWord = normalized.match(/(?:นักแสดง|ศิลปิน|artist).*?(?:เรื่อง|ซีรีส์|series)\s*([^?？]+?)(?:มี|เป็น|คือ|ใคร|บ้าง|$)/);
	const beforeArtistWord = normalized.match(/^([^?？]+?)\s*(?:มี)?\s*(?:นักแสดง|ศิลปิน|artist)/);
	const title = cleanSearchTerm(afterSeriesWord?.[1] ?? beforeArtistWord?.[1]);
	if (!title || ['มี', 'ทั้งหมด', 'รายชื่อ', 'คนไหน'].includes(title)) return null;
	return title;
}

function asksSeriesArtists(normalized: string) {
	return hasAny(normalized, ['นักแสดง', 'ศิลปิน', 'artist']) && hasAny(normalized, ['ใคร', 'มี', 'เป็น', 'บ้าง', 'cast']);
}

export function getDeterministicChatSql(message: string): DeterministicChatSql | null {
	const normalized = normalizeQuestion(message);
	const asksSchedule = hasAny(normalized, ['ตารางฉาย', 'ฉายอะไร', 'อะไรฉาย', 'มีอะไรฉาย', 'มีอะไรบ้าง', 'ย้อนหลัง', 'ดูย้อนหลัง', 'ที่ผ่านมา', 'ที่แล้ว']) || normalized.includes('ฉาย');
	const asksSeries = hasAny(normalized, ['ซีรีส์', 'series', 'เรื่อง']);

	if (asksSeriesArtists(normalized)) {
		const seriesTitle = extractSeriesTitleForArtistQuestion(normalized);
		if (seriesTitle) return { intent: 'series_artists_by_series', sql: seriesArtistsBySeriesSql(seriesTitle) };
	}

	if (hasAny(normalized, ['นักแสดง', 'ศิลปิน', 'artist']) && hasAny(normalized, ['มี', 'ทั้งหมด', 'คนไหน', 'อะไรบ้าง']) && !normalized.includes('เรื่อง')) {
		return { intent: 'artists_all', sql: ARTISTS_ALL_SQL };
	}

	if (hasAny(normalized, ['แพลตฟอร์ม', 'platform']) && hasAny(normalized, ['มี', 'ทั้งหมด', 'อะไรบ้าง'])) {
		return { intent: 'platforms_all', sql: PLATFORMS_ALL_SQL };
	}

	if (hasAny(normalized, ['สตูดิโอ', 'studio']) && hasAny(normalized, ['มี', 'ทั้งหมด', 'อะไรบ้าง'])) {
		return { intent: 'studios_all', sql: STUDIOS_ALL_SQL };
	}

	if (asksSchedule && (normalized.includes('เมื่อวาน') || normalized.includes('yesterday'))) {
		return { intent: 'schedule_yesterday', sql: YESTERDAY_SCHEDULE_SQL };
	}

	if (asksSchedule && (normalized.includes('สัปดาห์ที่แล้ว') || normalized.includes('อาทิตย์ที่แล้ว') || normalized.includes('last week'))) {
		return { intent: 'schedule_last_week', sql: LAST_WEEK_SCHEDULE_SQL };
	}

	if (asksSchedule && (normalized.includes('เดือนที่แล้ว') || normalized.includes('last month'))) {
		return { intent: 'schedule_last_month', sql: LAST_MONTH_SCHEDULE_SQL };
	}

	if (asksSchedule && hasAny(normalized, ['ย้อนหลัง', 'ดูย้อนหลัง', 'ฉายไปแล้ว', 'ที่ผ่านมา', 'past episodes', 'previous episodes'])) {
		return { intent: 'schedule_past', sql: PAST_SCHEDULE_SQL };
	}

	if (asksSchedule && (normalized.includes('พรุ่งนี้') || normalized.includes('tomorrow'))) {
		return { intent: 'schedule_tomorrow', sql: TOMORROW_SCHEDULE_SQL };
	}

	if (asksSchedule && (normalized.includes('เดือนนี้') || normalized.includes('this month'))) {
		return { intent: 'schedule_month', sql: MONTH_SCHEDULE_SQL };
	}

	if (asksSchedule && (normalized.includes('สัปดาห์นี้') || normalized.includes('อาทิตย์นี้') || normalized.includes('this week'))) {
		return { intent: 'schedule_week', sql: WEEK_SCHEDULE_SQL };
	}

	if (asksSchedule) {
		const weekday = extractWeekday(normalized);
		if (weekday !== null) return { intent: 'schedule_weekday', sql: scheduleForWeekdaySql(weekday) };
	}

	if (asksSchedule && (/\b(today)\b/i.test(normalized) || normalized.includes('วันนี้'))) {
		return { intent: 'schedule_today', sql: TODAY_SCHEDULE_SQL };
	}

	if (asksSchedule && hasAny(normalized, ['ตอนต่อไป', 'ตอนหน้า', 'ฉายต่อไป', 'ต่อไป', 'next episode', 'next'])) {
		return { intent: 'schedule_next', sql: NEXT_SCHEDULE_SQL };
	}

	const studio = extractStudio(normalized);
	if (studio && asksSeries) {
		return { intent: 'series_by_studio', sql: seriesByStudioSql(studio) };
	}

	const platform = extractPlatform(normalized);
	if (platform && asksSeries && hasAny(normalized, ['ดู', 'บน', 'ใน', 'แพลตฟอร์ม', 'platform', 'stream'])) {
		return { intent: 'series_by_platform', sql: seriesByPlatformSql(platform) };
	}

	if (asksSeries && hasAny(normalized, ['uncut', 'ไม่ตัด', 'ไม่เซ็นเซอร์', 'เต็ม'])) {
		return { intent: 'series_uncut', sql: SERIES_UNCUT_SQL };
	}

	if (asksSeries && hasAny(normalized, ['กำลังจะฉาย', 'รอฉาย', 'เร็วๆ นี้', 'เร็ว ๆ นี้', 'upcoming'])) {
		return { intent: 'series_upcoming', sql: seriesByStatusSql('UPCOMING') };
	}

	if (asksSeries && hasAny(normalized, ['กำลังฉาย', 'กำลังฉายอยู่', 'ongoing'])) {
		return { intent: 'series_ongoing', sql: seriesByStatusSql('ONGOING') };
	}

	if (asksSeries && hasAny(normalized, ['จบแล้ว', 'จบเรื่อง', 'ended'])) {
		return { intent: 'series_ended', sql: seriesByStatusSql('ENDED') };
	}

	const genre = extractGenre(normalized);
	if (genre && asksSeries) {
		return { intent: 'series_by_genre', sql: seriesByGenreSql(genre) };
	}

	if (asksSeries && hasAny(normalized, ['มี', 'ทั้งหมด', 'อะไรบ้าง', 'เรื่องไหนบ้าง', 'แนะนำ']) && !hasAny(normalized, ['นักแสดง', 'ศิลปิน', 'artist'])) {
		return { intent: 'series_all', sql: seriesListSql() };
	}

	return null;
}
