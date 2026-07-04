import { describe, expect, it } from 'vitest';
import { getDeterministicChatSql } from './deterministic.js';

describe('deterministic chat SQL shortcuts', () => {
	it('recognizes Thai today schedule questions', () => {
		const result = getDeterministicChatSql('ตารางฉายวันนี้มีอะไรบ้าง?');

		expect(result?.intent).toBe('schedule_today');
		expect(result?.sql).toContain('series_schedules');
		expect(result?.sql).toContain('episode_schedules');
		expect(result?.sql).toContain("Asia/Bangkok");
		expect(result?.sql).toMatch(/LIMIT\s+20/i);
	});

	it('excludes ended series from today weekly schedule shortcuts', () => {
		const result = getDeterministicChatSql('ตารางฉายวันนี้มีอะไรบ้าง?');

		expect(result?.intent).toBe('schedule_today');
		expect(result?.sql).toMatch(/s\.status IN \('ONGOING', 'UPCOMING'\)/);
		expect(result?.sql).not.toMatch(/s\.status\s*=\s*'ENDED'/);
	});

	it('recognizes tomorrow and this-week schedule questions', () => {
		const tomorrow = getDeterministicChatSql('พรุ่งนี้มีอะไรฉายบ้าง');
		const week = getDeterministicChatSql('ตารางฉายสัปดาห์นี้มีเรื่องไหนบ้าง');

		expect(tomorrow?.intent).toBe('schedule_tomorrow');
		expect(tomorrow?.sql).toContain("+ INTERVAL '1 day'");
		expect(week?.intent).toBe('schedule_week');
		expect(week?.sql).toContain("date_trunc('week'");
	});

	it('recognizes weekday schedule questions', () => {
		const result = getDeterministicChatSql('วันจันทร์มีเรื่องอะไรฉายบ้าง');

		expect(result?.intent).toBe('schedule_weekday');
		expect(result?.sql).toContain('ss.day_of_week = 1');
	});

	it('recognizes common chat page status prompts', () => {
		const ongoing = getDeterministicChatSql('ตอนนี้มีซีรีส์เรื่องไหนกำลังฉายอยู่บ้าง?');
		const upcoming = getDeterministicChatSql('ซีรีส์ที่กำลังจะฉายมีเรื่องอะไรบ้าง?');

		expect(ongoing?.intent).toBe('series_ongoing');
		expect(ongoing?.sql).toContain("s.status = 'ONGOING'");
		expect(upcoming?.intent).toBe('series_upcoming');
		expect(upcoming?.sql).toContain("s.status = 'UPCOMING'");
	});

	it('recognizes common genre recommendation prompts', () => {
		const result = getDeterministicChatSql('มีซีรีส์แนวโรแมนติกเรื่องอะไรบ้าง?');

		expect(result?.intent).toBe('series_by_genre');
		expect(result?.sql).toContain('JOIN series_genres');
		expect(result?.sql).toContain('JOIN genres');
		expect(result?.sql).toContain("g.name ILIKE '%โรแมนติก%'");
	});

	it('recognizes next and monthly schedule questions', () => {
		const next = getDeterministicChatSql('ตอนต่อไปมีอะไรฉายบ้าง');
		const month = getDeterministicChatSql('ตารางฉายเดือนนี้มีเรื่องไหนบ้าง');

		expect(next?.intent).toBe('schedule_next');
		expect(next?.sql).toContain('episode_schedules');
		expect(next?.sql).toContain('ORDER BY es.air_date');
		expect(month?.intent).toBe('schedule_month');
		expect(month?.sql).toContain("date_trunc('month'");
	});

	it('recognizes broad series list and uncut questions', () => {
		const all = getDeterministicChatSql('มีซีรีส์อะไรบ้าง');
		const uncut = getDeterministicChatSql('มีซีรีส์เรื่องไหนเป็น uncut บ้าง');

		expect(all?.intent).toBe('series_all');
		expect(all?.sql).toContain('FROM series s');
		expect(uncut?.intent).toBe('series_uncut');
		expect(uncut?.sql).toContain('is_uncut = true');
	});

	it('recognizes platform and studio series questions', () => {
		const platform = getDeterministicChatSql('มีซีรีส์เรื่องไหนดูได้บน iQIYI บ้าง');
		const studio = getDeterministicChatSql('ค่าย GMMTV มีเรื่องอะไรบ้าง');

		expect(platform?.intent).toBe('series_by_platform');
		expect(platform?.sql).toContain('platforms p');
		expect(platform?.sql).toContain("p.name ILIKE '%iqiyi%'");
		expect(studio?.intent).toBe('series_by_studio');
		expect(studio?.sql).toContain('JOIN studios st');
		expect(studio?.sql).toContain("st.name ILIKE '%gmmtv%'");
	});

	it('recognizes catalog questions for artists, platforms, and studios', () => {
		const artists = getDeterministicChatSql('มีนักแสดงคนไหนบ้าง');
		const platforms = getDeterministicChatSql('มีแพลตฟอร์มอะไรบ้าง');
		const studios = getDeterministicChatSql('มีสตูดิโออะไรบ้าง');

		expect(artists?.intent).toBe('artists_all');
		expect(artists?.sql).toContain('FROM artists');
		expect(platforms?.intent).toBe('platforms_all');
		expect(platforms?.sql).toContain('FROM platforms');
		expect(studios?.intent).toBe('studios_all');
		expect(studios?.sql).toContain('FROM studios');
	});

	it('recognizes cast questions for a specific series title', () => {
		const thai = getDeterministicChatSql('พี่เองก็ลำบาก มีนักแสดงเป็นใครบ้าง');
		const withPrefix = getDeterministicChatSql('นักแสดงเรื่อง Pluto มีใครบ้าง');

		expect(thai?.intent).toBe('series_artists_by_series');
		expect(thai?.sql).toContain('JOIN series_artists');
		expect(thai?.sql).toContain('JOIN artists');
		expect(thai?.sql).toContain("s.title_th ILIKE '%พี่เองก็ลำบาก%'");
		expect(withPrefix?.intent).toBe('series_artists_by_series');
		expect(withPrefix?.sql).toContain("s.title_th ILIKE '%pluto%'");
	});

	it('does not shortcut unrelated questions', () => {
		expect(getDeterministicChatSql('วันนี้กินอะไรดี')).toBeNull();
	});
});
