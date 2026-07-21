import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));

const { GET } = await import('./+server.js');
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as NonNullable<App.Locals['user']>;
const currentSession = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' } as NonNullable<
	App.Locals['session']
>;

function makeDb(rows: unknown[]) {
	const deleteWhere = vi.fn().mockResolvedValue(undefined);
	const selectWhere = vi.fn().mockResolvedValue(rows);
	return {
		db: {
			delete: vi.fn(() => ({ where: deleteWhere })),
			select: vi.fn(() => ({ from: vi.fn(() => ({ where: selectWhere })) }))
		},
		deleteWhere,
		selectWhere
	};
}

describe('GET /api/profile/sessions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('requires both user and database-backed current session locals', async () => {
		for (const locals of [{}, { user }, { session: currentSession }]) {
			const response = await GET({ locals } as never);
			expect(response.status).toBe(401);
		}
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('cleans expired sessions and returns scoped safe active sessions current-first', async () => {
		const createdAt = new Date('2026-07-01T09:00:00.000Z');
		const rows = [
			{
				id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
				browser: 'Firefox', operatingSystem: 'Linux', deviceType: 'desktop',
				maskedIp: null, city: null, countryCode: null,
				createdAt: new Date('2026-07-20T08:00:00.000Z'),
				lastSeenAt: new Date('2026-07-21T07:00:00.000Z'),
				expiresAt: new Date('2026-08-19T08:00:00.000Z'), tokenHash: 'must-not-leak'
			},
			{
				id: currentSession.id,
				browser: 'Chrome', operatingSystem: 'Windows', deviceType: 'unexpected-value',
				maskedIp: '203.0.113.xxx', city: 'Bangkok', countryCode: 'TH',
				createdAt, lastSeenAt: null,
				expiresAt: new Date('2026-08-01T09:00:00.000Z'), tokenHash: 'must-not-leak'
			}
		];
		const database = makeDb(rows);
		mocks.getDb.mockResolvedValue(database.db);

		const response = await GET({ locals: { user, session: currentSession } } as never);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(database.deleteWhere).toHaveBeenCalledOnce();
		expect(database.selectWhere).toHaveBeenCalledOnce();
		expect(body).toEqual({
			sessions: [
				{
					id: currentSession.id,
					browser: 'Chrome', operatingSystem: 'Windows', deviceType: 'unknown',
					maskedIp: '203.0.113.xxx', city: 'Bangkok', countryCode: 'TH',
					createdAt: createdAt.toISOString(), lastSeenAt: createdAt.toISOString(),
					expiresAt: '2026-08-01T09:00:00.000Z', isCurrent: true
				},
				{
					id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
					browser: 'Firefox', operatingSystem: 'Linux', deviceType: 'desktop',
					maskedIp: null, city: null, countryCode: null,
					createdAt: '2026-07-20T08:00:00.000Z', lastSeenAt: '2026-07-21T07:00:00.000Z',
					expiresAt: '2026-08-19T08:00:00.000Z', isCurrent: false
				}
			]
		});
		expect(JSON.stringify(body)).not.toContain('tokenHash');
		expect(JSON.stringify(body)).not.toContain('must-not-leak');
	});
});
