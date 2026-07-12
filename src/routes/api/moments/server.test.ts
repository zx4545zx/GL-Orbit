import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getMoments: vi.fn() }));

vi.mock('$lib/server/moments/queries.js', () => ({ getMoments: mocks.getMoments }));
vi.mock('$lib/server/moments/mutations.js', () => ({ createMoment: vi.fn() }));
vi.mock('$lib/server/moments/cursor.js', () => ({ decodeCursor: vi.fn(() => null) }));
vi.mock('./service.js', () => ({ parseMomentRequest: vi.fn() }));

describe('GET /api/moments', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getMoments.mockResolvedValue({ moments: [], nextCursor: null });
	});

	it('keeps the bookmarked feed private', async () => {
		const { GET } = await import('./+server.js');
		const response = await GET({ locals: { user: null }, url: new URL('http://localhost/api/moments?bookmarked=true') } as never) as Response;
		expect(response.status).toBe(401);
		expect(mocks.getMoments).not.toHaveBeenCalled();
	});

	it('allows guests to read the public feed', async () => {
		const { GET } = await import('./+server.js');
		const response = await GET({ locals: { user: null }, url: new URL('http://localhost/api/moments?limit=10') } as never) as Response;
		expect(response.status).toBe(200);
		expect(mocks.getMoments).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, viewerId: undefined, bookmarked: false }));
	});
});
