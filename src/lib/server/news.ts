import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import { parseSafeExternalUrl } from '$lib/server/embeds/url-security.js';
import { getDb } from '$lib/server/db/index.js';
import { news } from '$lib/server/db/schema.js';

export type NewsStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type NewsWriteInput = {
	slug?: unknown;
	titleTh?: unknown;
	titleEn?: unknown;
	contentTh?: unknown;
	contentEn?: unknown;
	coverImageUrl?: unknown;
	sourceUrl?: unknown;
	sourceName?: unknown;
	publishedAt?: unknown;
	status?: unknown;
};

export type ValidatedNewsWrite = {
	slug: string;
	titleTh: string;
	titleEn: string;
	contentTh: string;
	contentEn: string;
	coverImageUrl: string | null;
	sourceUrl: string | null;
	sourceName: string | null;
	publishedAt: Date | null;
	status: NewsStatus;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const statuses = new Set<NewsStatus>(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export function normalizeNewsSlug(value: unknown): string {
	if (typeof value !== 'string') return '';
	return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 255);
}

export function validateNewsWrite(input: NewsWriteInput): { ok: true; data: ValidatedNewsWrite } | { ok: false; error: string } {
	const required = (value: unknown) => typeof value === 'string' ? value.trim() : '';
	const titleTh = required(input.titleTh);
	const titleEn = required(input.titleEn);
	const contentTh = required(input.contentTh);
	const contentEn = required(input.contentEn);
	const slug = normalizeNewsSlug(input.slug || titleEn);
	if (!titleTh || !titleEn || !contentTh || !contentEn) return { ok: false, error: 'กรุณากรอกชื่อและเนื้อหาข่าวทั้งไทยและอังกฤษ' };
	if (!slug || !SLUG_PATTERN.test(slug)) return { ok: false, error: 'slug ต้องเป็นภาษาอังกฤษ ตัวเลข และขีดกลางเท่านั้น' };
	const status = input.status ?? 'DRAFT';
	if (typeof status !== 'string' || !statuses.has(status as NewsStatus)) return { ok: false, error: 'สถานะข่าวไม่ถูกต้อง' };
	let publishedAt: Date | null = null;
	if (input.publishedAt !== null && input.publishedAt !== undefined && input.publishedAt !== '') {
		if (typeof input.publishedAt !== 'string' || !Number.isFinite(Date.parse(input.publishedAt))) return { ok: false, error: 'วันเผยแพร่ไม่ถูกต้อง' };
		publishedAt = new Date(input.publishedAt);
	}
	if (status === 'PUBLISHED' && !publishedAt) return { ok: false, error: 'ข่าวที่เผยแพร่ต้องระบุวันเผยแพร่' };
	if (status !== 'PUBLISHED') publishedAt = null;
	const nullableText = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
	const sourceRaw = nullableText(input.sourceUrl);
	let sourceUrl: string | null = null;
	if (sourceRaw) {
		try { sourceUrl = parseSafeExternalUrl(sourceRaw).toString(); }
		catch { return { ok: false, error: 'URL แหล่งที่มาต้องเป็น HTTPS URL ที่ปลอดภัย' }; }
	}
	return { ok: true, data: { slug, titleTh, titleEn, contentTh, contentEn, coverImageUrl: nullableText(input.coverImageUrl), sourceUrl, sourceName: nullableText(input.sourceName), publishedAt, status: status as NewsStatus } };
}

export async function hasNewsSlugConflict(slug: string, existingId?: string): Promise<boolean> {
	const db = await getDb();
	const conditions = [eq(news.slug, slug)];
	if (existingId) conditions.push(ne(news.id, existingId));
	const [existing] = await db.select({ id: news.id }).from(news).where(and(...conditions)).limit(1);
	return Boolean(existing);
}

export async function listPublishedNews() {
	const db = await getDb();
	return db.select().from(news).where(and(eq(news.status, 'PUBLISHED'), isNull(news.deletedAt))).orderBy(desc(news.publishedAt), desc(news.id));
}

export async function getPublishedNewsBySlug(slug: string) {
	const db = await getDb();
	const [item] = await db.select().from(news).where(and(eq(news.slug, slug), eq(news.status, 'PUBLISHED'), isNull(news.deletedAt))).limit(1);
	return item ?? null;
}
