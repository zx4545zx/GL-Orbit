import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB
vi.mock('./db/index.js', () => ({
	getDb: vi.fn()
}));

vi.mock('./push-notifications.js', () => ({
	sendPushNotification: vi.fn(),
	sendPushNotifications: vi.fn()
}));

import { createFollowerNotifications } from './notifications.js';
import { getDb } from './db/index.js';
import { sendPushNotifications } from './push-notifications.js';

function mockDb(overrides: Record<string, unknown> = {}) {
	const transaction = vi.fn().mockResolvedValue([]);
	const sqlClient = Object.assign(
		vi.fn((_strings: TemplateStringsArray, ...values: unknown[]) => ({ values })),
		{ transaction }
	);
	const defaultDb = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockResolvedValue([]),
		$client: sqlClient
	};
	return { ...defaultDb, ...overrides };
}

describe('createFollowerNotifications', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should skip when no followers exist', async () => {
		const db = mockDb({
			where: vi.fn().mockResolvedValue([])
		});
		vi.mocked(getDb).mockResolvedValue(db as any);

		const count = await createFollowerNotifications('series-1', 'new_episode', 'New episode!');
		expect(count).toBe(0);
		expect(db.$client.transaction).not.toHaveBeenCalled();
	});

	it('should skip when only actor is the follower', async () => {
		const db = mockDb({
			where: vi.fn().mockResolvedValue([{ userId: 'actor-1' }])
		});
		vi.mocked(getDb).mockResolvedValue(db as any);

		const count = await createFollowerNotifications('series-1', 'new_episode', 'New episode!', 'actor-1');
		expect(count).toBe(0);
		expect(db.$client.transaction).not.toHaveBeenCalled();
	});

	it('should create notifications for followers (excluding actor)', async () => {
		const where = vi.fn()
			.mockResolvedValueOnce([
				{ userId: 'user-1' },
				{ userId: 'actor-1' },
				{ userId: 'user-2' }
			])
			.mockResolvedValueOnce([{ titleEn: 'Series title' }]);
		const db = mockDb({ where });
		db.$client.transaction.mockResolvedValue([[
				{ id: 'n1', userId: 'user-1', seriesId: 'series-1', type: 'status_change', message: 'Status changed', isRead: false, createdAt: new Date() },
				{ id: 'n2', userId: 'user-2', seriesId: 'series-1', type: 'status_change', message: 'Status changed', isRead: false, createdAt: new Date() }
			]]);
		vi.mocked(getDb).mockResolvedValue(db as any);

		const count = await createFollowerNotifications('series-1', 'status_change', 'Status changed', 'actor-1');
		expect(count).toBe(2);
		expect(db.$client.transaction).toHaveBeenCalledTimes(1);
		expect(db.select).toHaveBeenCalledTimes(2);
		expect(sendPushNotifications).toHaveBeenCalledTimes(1);
		expect(vi.mocked(sendPushNotifications).mock.calls[0][0]).toHaveLength(2);
	});

	it('should create notifications for ALL followers when no actorId', async () => {
		const db = mockDb({
			where: vi.fn()
				.mockResolvedValueOnce([
				{ userId: 'user-1' },
				{ userId: 'user-2' }
				])
				.mockResolvedValueOnce([])
		});
		db.$client.transaction.mockResolvedValue([[
				{ id: 'n1', userId: 'user-1', seriesId: 'series-1', type: 'new_episode', message: 'New episode!', isRead: false, createdAt: new Date() },
				{ id: 'n2', userId: 'user-2', seriesId: 'series-1', type: 'new_episode', message: 'New episode!', isRead: false, createdAt: new Date() }
			]]);
		vi.mocked(getDb).mockResolvedValue(db as any);

		const count = await createFollowerNotifications('series-1', 'new_episode', 'New episode!');
		expect(count).toBe(2);
		expect(db.$client.transaction).toHaveBeenCalledTimes(1);
	});

	it('chunks large notification inserts and push delivery', async () => {
		const followers = Array.from({ length: 501 }, (_, index) => ({ userId: `user-${index}` }));
		const inserted = followers.map(({ userId }, index) => ({
			id: `n${index}`,
			userId,
			seriesId: 'series-1',
			type: 'announcement',
			message: 'Announcement',
			isRead: false,
			createdAt: new Date()
		}));
		const db = mockDb({
			where: vi.fn()
				.mockResolvedValueOnce(followers)
				.mockResolvedValueOnce([{ titleEn: 'Series title' }])
		});
		db.$client.transaction.mockResolvedValue([
			inserted.slice(0, 500),
			inserted.slice(500)
		]);
		vi.mocked(getDb).mockResolvedValue(db as any);

		const count = await createFollowerNotifications('series-1', 'announcement', 'Announcement');

		expect(count).toBe(501);
		expect(db.$client).toHaveBeenCalledTimes(2);
		expect(db.$client.transaction).toHaveBeenCalledTimes(1);
		expect(db.$client.transaction.mock.calls[0][0]).toHaveLength(2);
		expect(sendPushNotifications).toHaveBeenCalledTimes(1);
		expect(vi.mocked(sendPushNotifications).mock.calls[0][0]).toHaveLength(501);
	});

	it('does not deliver pushes when the atomic insert fails', async () => {
		const db = mockDb({
			where: vi.fn()
				.mockResolvedValueOnce([{ userId: 'user-1' }])
				.mockResolvedValueOnce([{ titleEn: 'Series title' }])
		});
		db.$client.transaction.mockRejectedValue(new Error('insert failed'));
		vi.mocked(getDb).mockResolvedValue(db as any);

		await expect(createFollowerNotifications('series-1', 'announcement', 'Announcement'))
			.rejects.toThrow('insert failed');
		expect(sendPushNotifications).not.toHaveBeenCalled();
	});

	it('keeps committed notifications when best-effort push delivery fails', async () => {
		const row = {
			id: 'n1', userId: 'user-1', seriesId: 'series-1', type: 'announcement',
			message: 'Announcement', isRead: false, createdAt: new Date()
		};
		const db = mockDb({
			where: vi.fn()
				.mockResolvedValueOnce([{ userId: 'user-1' }])
				.mockResolvedValueOnce([{ titleEn: 'Series title' }])
		});
		db.$client.transaction.mockResolvedValue([[row]]);
		vi.mocked(getDb).mockResolvedValue(db as any);
		vi.mocked(sendPushNotifications).mockRejectedValueOnce(new Error('push failed'));
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		await expect(createFollowerNotifications('series-1', 'announcement', 'Announcement'))
			.resolves.toBe(1);
		expect(consoleError).toHaveBeenCalledOnce();
		consoleError.mockRestore();
	});
});
