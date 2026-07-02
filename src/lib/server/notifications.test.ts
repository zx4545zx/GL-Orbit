import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB
vi.mock('./db/index.js', () => ({
	getDb: vi.fn()
}));

import { createFollowerNotifications } from './notifications.js';
import { getDb } from './db/index.js';

function mockDb(overrides: Record<string, unknown> = {}) {
	const defaultDb = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockResolvedValue([])
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
		expect(db.insert).not.toHaveBeenCalled();
	});

	it('should skip when only actor is the follower', async () => {
		const db = mockDb({
			where: vi.fn().mockResolvedValue([{ userId: 'actor-1' }])
		});
		vi.mocked(getDb).mockResolvedValue(db as any);

		const count = await createFollowerNotifications('series-1', 'new_episode', 'New episode!', 'actor-1');
		expect(count).toBe(0);
		expect(db.insert).not.toHaveBeenCalled();
	});

	it('should create notifications for followers (excluding actor)', async () => {
		const db = mockDb({
			where: vi.fn().mockResolvedValue([
				{ userId: 'user-1' },
				{ userId: 'actor-1' },
				{ userId: 'user-2' }
			]),
			returning: vi.fn().mockResolvedValue([
				{ id: 'n1', userId: 'user-1', seriesId: 'series-1', type: 'status_change', message: 'Status changed', isRead: false, createdAt: new Date() },
				{ id: 'n2', userId: 'user-2', seriesId: 'series-1', type: 'status_change', message: 'Status changed', isRead: false, createdAt: new Date() }
			])
		});
		vi.mocked(getDb).mockResolvedValue(db as any);

		const count = await createFollowerNotifications('series-1', 'status_change', 'Status changed', 'actor-1');
		expect(count).toBe(2);
		expect(db.insert).toHaveBeenCalled();
	});

	it('should create notifications for ALL followers when no actorId', async () => {
		const db = mockDb({
			where: vi.fn().mockResolvedValue([
				{ userId: 'user-1' },
				{ userId: 'user-2' }
			]),
			returning: vi.fn().mockResolvedValue([
				{ id: 'n1', userId: 'user-1', seriesId: 'series-1', type: 'new_episode', message: 'New episode!', isRead: false, createdAt: new Date() },
				{ id: 'n2', userId: 'user-2', seriesId: 'series-1', type: 'new_episode', message: 'New episode!', isRead: false, createdAt: new Date() }
			])
		});
		vi.mocked(getDb).mockResolvedValue(db as any);

		const count = await createFollowerNotifications('series-1', 'new_episode', 'New episode!');
		expect(count).toBe(2);
		expect(db.insert).toHaveBeenCalled();
	});
});
