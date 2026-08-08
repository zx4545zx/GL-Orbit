import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ listPublishedNews: vi.fn() }));
vi.mock('$lib/server/news.js', () => ({ listPublishedNews: mocks.listPublishedNews }));
import { getWhatsOnData } from './whats-on.js';

const env = {
	WHATS_ON_API_URL: 'https://example.supabase.co',
	WHATS_ON_API_KEY: 'publishable-test-key'
};
const eventWindow = {
	start: '2026-07-24T17:00:00.000Z',
	end: '2026-09-06T17:00:00.000Z'
};

afterEach(() => vi.restoreAllMocks());

describe('getWhatsOnData', () => {
	it('maps local published news and authenticates only external events', async () => {
		mocks.listPublishedNews.mockResolvedValue([{ id: 'news-1', slug: 'approved-story', titleTh: 'ข่าวไทย', titleEn: 'Approved story', contentTh: 'สรุป', contentEn: 'Story summary', coverImageUrl: null, sourceUrl: 'https://x.com/example/status/1', sourceName: 'X', publishedAt: new Date('2026-07-24T00:00:00.000Z'), status: 'PUBLISHED' }]);
		const calls: Array<{ url: URL; headers: Headers }> = [];
		const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = new URL(input instanceof Request ? input.url : input.toString());
			calls.push({ url, headers: new Headers(init?.headers) });
			return Response.json([
				{
					event_id: 'event-1',
					title: 'Pairing | Two-day fan meeting',
					performer: 'Pairing',
					full_title: null,
					starts_at: '2026-08-03T17:00:00.000Z',
					ends_at: '2026-08-05T17:00:00.000Z',
					all_day: true,
					location: 'Bangkok',
					event_type: '860930d2-bade-42ca-b020-15e5862217f7',
					source_timezone: 'Asia/Bangkok'
				}
			]);
		}) as typeof fetch;

		const result = await getWhatsOnData({ env, eventWindow, fetcher, language: 'en' });

		expect(result.sourceStatus).toEqual({ news: 'live', events: 'live' });
		expect(result.news).toEqual([
			expect.objectContaining({ id: 'news-1', slug: 'approved-story', headline: 'Approved story', sourceUrl: 'https://x.com/example/status/1', status: 'approved' })
		]);
		expect(result.events).toEqual([
			expect.objectContaining({
				id: 'event-1',
				title: 'Two-day fan meeting',
				fullTitle: 'Pairing | Two-day fan meeting',
				dateKey: '2026-08-04',
				endDateKey: '2026-08-05'
			})
		]);
		expect(calls).toHaveLength(1);
		for (const call of calls) {
			expect(call.headers.get('apikey')).toBe('publishable-test-key');
			expect(call.headers.get('authorization')).toBe('Bearer publishable-test-key');
		}
		const eventsUrl = calls.find(({ url }) => url.pathname.endsWith('/events'))?.url;
		expect(eventsUrl?.searchParams.getAll('starts_at')).toEqual([
			'gte.2026-07-24T17:00:00.000Z',
			'lt.2026-09-06T17:00:00.000Z'
		]);
	});

	it('keeps local news live when the external event request fails', async () => {
		mocks.listPublishedNews.mockResolvedValue([]);
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const fetcher = vi.fn(async (input: RequestInfo | URL) => {
			return new Response(null, { status: 503 });
		}) as typeof fetch;

		const result = await getWhatsOnData({ env, eventWindow, fetcher });

		expect(result.news).toEqual([]);
		expect(result.events).toEqual([]);
		expect(result.sourceStatus).toEqual({ news: 'live', events: 'unavailable' });
	});

	it('fails closed without exposing requests when configuration is missing', async () => {
		mocks.listPublishedNews.mockResolvedValue([]);
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const fetcher = vi.fn<typeof fetch>();

		const result = await getWhatsOnData({ env: {}, eventWindow, fetcher });

		expect(fetcher).not.toHaveBeenCalled();
		expect(result.sourceStatus).toEqual({ news: 'live', events: 'unavailable' });
		expect(result.eventTypes).toHaveLength(8);
	});
});
