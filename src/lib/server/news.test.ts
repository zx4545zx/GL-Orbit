import { describe, expect, it } from 'vitest';
import { normalizeNewsSlug, validateNewsWrite } from './news.js';

const valid = { slug: 'hello-world', titleTh: 'ข่าวไทย', titleEn: 'Hello world', contentTh: 'เนื้อหา', contentEn: 'Content', status: 'DRAFT' };

describe('news validation', () => {
	it('normalizes and restricts public slugs', () => {
		expect(normalizeNewsSlug(' Hello, WORLD! ')).toBe('hello-world');
		expect(validateNewsWrite({ ...valid, slug: 'ไทย' }).ok).toBe(false);
	});
	it('requires bilingual fields and scheduled publication', () => {
		expect(validateNewsWrite({ ...valid, titleEn: '' }).ok).toBe(false);
		expect(validateNewsWrite({ ...valid, status: 'PUBLISHED' }).ok).toBe(false);
		expect(validateNewsWrite({ ...valid, status: 'PUBLISHED', publishedAt: '2026-08-08T12:00:00.000Z' }).ok).toBe(true);
	});
	it('accepts only safe HTTPS source URLs', () => {
		expect(validateNewsWrite({ ...valid, sourceUrl: 'http://example.com' }).ok).toBe(false);
		expect(validateNewsWrite({ ...valid, sourceUrl: 'https://example.com/news' }).ok).toBe(true);
	});
});
