import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetDb = vi.fn();

vi.mock('$lib/server/db/index.js', () => ({ getDb: mockGetDb }));

vi.mock('$lib/server/db/schema.js', () => {
	const table = (name: string) =>
		new Proxy(
			{},
			{
				get(_, prop) {
					if (typeof prop === 'string') return { _: { name, field: prop } };
					return undefined;
				}
			}
		);

	return {
		artists: table('artists'),
		series: table('series')
	};
});

vi.mock('drizzle-orm', () => ({
	asc: vi.fn((value) => value),
	isNull: vi.fn((value) => ({ isNull: value }))
}));

function makeMockDb(seriesRows: Array<{ id: string }> = [], artistRows: Array<{ id: string }> = []) {
	let selectCount = 0;
	return {
		select: vi.fn(() => {
			const rows = selectCount === 0 ? seriesRows : artistRows;
			selectCount += 1;
			return {
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => Promise.resolve(rows))
					}))
				}))
			};
		})
	};
}

describe('GET /sitemap.xml', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it('lists localized public canonical pages and excludes private pages', async () => {
		mockGetDb.mockResolvedValue(
			makeMockDb([{ id: 'series-1' }], [{ id: 'artist-1' }])
		);
		const { GET } = await import('./+server.js');

		const response = (await GET({
			url: new URL('https://gl-orbit.com/sitemap.xml')
		} as never)) as Response;
		const body = await response.text();

		expect(response.headers.get('content-type')).toContain('application/xml');
		expect(body).toContain('<loc>https://gl-orbit.com/th</loc>');
		expect(body).toContain('<loc>https://gl-orbit.com/en</loc>');
		expect(body).toContain('<loc>https://gl-orbit.com/th/series</loc>');
		expect(body).toContain('<loc>https://gl-orbit.com/en/series</loc>');
		expect(body).toContain('<loc>https://gl-orbit.com/th/artists</loc>');
		expect(body).toContain('<loc>https://gl-orbit.com/en/artists</loc>');
		expect(body).toContain('<loc>https://gl-orbit.com/th/countdown</loc>');
		expect(body).toContain('<loc>https://gl-orbit.com/en/explore/series</loc>');
		expect(body).toContain('<loc>https://gl-orbit.com/th/series/series-1</loc>');
		expect(body).toContain('<loc>https://gl-orbit.com/en/artists/artist-1</loc>');
		expect(body).not.toContain('<loc>https://gl-orbit.com/</loc>');
		expect(body).not.toContain('<loc>https://gl-orbit.com/series</loc>');
		expect(body).not.toContain('/profile');
		expect(body).not.toContain('/admin');
		expect(body).not.toContain('/notifications');
	});
});
