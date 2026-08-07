import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), sendNotificationToUsers: vi.fn() }));
vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/notifications.js', () => ({ sendNotificationToUsers: mocks.sendNotificationToUsers }));

const { POST } = await import('./+server.js');
const admin = { id: 'admin-1', role: 'ADMIN' } as App.Locals['user'];

function event(body: string, user: App.Locals['user'] | null = admin) {
	return {
		locals: { user },
		request: new Request('http://localhost/api/notifications/send', {
			method: 'POST', headers: { 'content-type': 'application/json' }, body
		})
	} as never;
}

function seriesDb(rows: unknown[]) {
	return { select: vi.fn().mockReturnThis(), from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue(rows) };
}

describe('POST /api/notifications/send', () => {
	beforeEach(() => vi.clearAllMocks());

	it('rejects non-admin callers before database access', async () => {
		for (const user of [null, { id: 'user-1', role: 'USER' }]) {
			const response = await POST(event('{}', user as App.Locals['user']));
			expect(response.status).toBe(403);
		}
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('rejects malformed, invalid, and follower announcements without a series before database access', async () => {
		for (const body of ['{', '{}', JSON.stringify({ seriesId: 'series-1', recipientType: 'everyone', message: 'Hello' }), JSON.stringify({ recipientType: 'followers', message: 'Hello' })]) {
			const response = await POST(event(body));
			expect(response.status).toBe(400);
		}
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('sends a global announcement without a series association', async () => {
		mocks.sendNotificationToUsers.mockResolvedValue(42);

		const response = await POST(event(JSON.stringify({ recipientType: 'global', message: '  Site maintenance  ' })));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, sentCount: 42 });
		expect(mocks.getDb).not.toHaveBeenCalled();
		expect(mocks.sendNotificationToUsers).toHaveBeenCalledWith(null, 'announcement', 'Site maintenance', 'global', 'admin-1');
	});

	it('sends a trimmed announcement to all active users through the existing service', async () => {
		const db = seriesDb([{ id: 'series-1' }]);
		mocks.getDb.mockResolvedValue(db);
		mocks.sendNotificationToUsers.mockResolvedValue(42);

		const response = await POST(event(JSON.stringify({ seriesId: 'series-1', recipientType: 'global', message: '  Updated watch link  ' })));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, sentCount: 42 });
		expect(mocks.sendNotificationToUsers).toHaveBeenCalledWith('series-1', 'announcement', 'Updated watch link', 'global', 'admin-1');
	});
});
