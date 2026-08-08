import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getPublishedNewsBySlug: vi.fn() }));
vi.mock('$lib/server/news.js', () => ({ getPublishedNewsBySlug: mocks.getPublishedNewsBySlug }));
vi.mock('$lib/i18n/paraglide.js', () => ({ m: { news_not_found: () => 'News not found' } }));
const { load } = await import('./+page.server.js');

describe('public news detail load', () => {
	it('returns only the localized published article', async () => {
		mocks.getPublishedNewsBySlug.mockResolvedValue({ slug: 'hello-world', titleTh: 'สวัสดี', titleEn: 'Hello', contentTh: 'ไทย', contentEn: 'English' });
		const setHeaders = vi.fn();
		const result = await load({ params: { slug: 'hello-world', lang: 'th' }, setHeaders } as never);
		expect(mocks.getPublishedNewsBySlug).toHaveBeenCalledWith('hello-world');
		expect(result).toMatchObject({ localized: { title: 'สวัสดี', content: 'ไทย' } });
		expect(setHeaders).toHaveBeenCalledWith({ 'cache-control': 'public, max-age=60, s-maxage=300' });
	});
	it('returns 404 when the article is draft, archived, deleted, or missing', async () => {
		mocks.getPublishedNewsBySlug.mockResolvedValue(null);
		await expect(load({ params: { slug: 'private', lang: 'en' }, setHeaders: vi.fn() } as never)).rejects.toMatchObject({ status: 404 });
	});
});
