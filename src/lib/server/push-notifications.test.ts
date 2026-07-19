import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	sendNotification: vi.fn().mockResolvedValue(undefined),
	setVapidDetails: vi.fn()
}));

vi.mock('./db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('web-push', () => ({
	default: {
		sendNotification: mocks.sendNotification,
		setVapidDetails: mocks.setVapidDetails
	}
}));

describe('sendPushNotifications', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.stubEnv('VAPID_PUBLIC_KEY', 'public-key');
		vi.stubEnv('VAPID_PRIVATE_KEY', 'private-key');
	});

	it('loads subscriptions in bounded batches', async () => {
		const where = vi.fn()
			.mockResolvedValueOnce([
				{ userId: 'user-0', endpoint: 'endpoint-0', p256dh: 'key-0', auth: 'auth-0' }
			])
			.mockResolvedValueOnce([
				{ userId: 'user-500', endpoint: 'endpoint-500', p256dh: 'key-500', auth: 'auth-500' }
			]);
		const db = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where
		};
		mocks.getDb.mockResolvedValue(db);

		const { sendPushNotifications } = await import('./push-notifications.js');
		await sendPushNotifications(Array.from({ length: 501 }, (_, index) => ({
			userId: `user-${index}`,
			item: {
				id: `notification-${index}`,
				seriesId: null,
				seriesTitle: null,
				type: 'new_episode' as const,
				message: 'New episode',
				isRead: false,
				createdAt: new Date().toISOString()
			}
		})));

		expect(db.select).toHaveBeenCalledTimes(2);
		expect(where).toHaveBeenCalledTimes(2);
		expect(mocks.sendNotification).toHaveBeenCalledTimes(2);
	});

	it('limits concurrent push deliveries', async () => {
		let activeDeliveries = 0;
		let maxActiveDeliveries = 0;
		mocks.sendNotification.mockImplementation(async () => {
			activeDeliveries += 1;
			maxActiveDeliveries = Math.max(maxActiveDeliveries, activeDeliveries);
			await Promise.resolve();
			activeDeliveries -= 1;
		});
		const subscriptions = Array.from({ length: 101 }, (_, index) => ({
			id: `subscription-${index}`,
			userId: `user-${index}`,
			endpoint: `endpoint-${index}`,
			p256dh: `key-${index}`,
			auth: `auth-${index}`,
			updatedAt: new Date()
		}));
		const db = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue(subscriptions)
		};
		mocks.getDb.mockResolvedValue(db);

		const { sendPushNotifications } = await import('./push-notifications.js');
		await sendPushNotifications(subscriptions.map(({ userId }, index) => ({
			userId,
			item: {
				id: `notification-${index}`,
				seriesId: null,
				seriesTitle: null,
				type: 'announcement' as const,
				message: 'Announcement',
				isRead: false,
				createdAt: new Date().toISOString()
			}
		})));

		expect(mocks.sendNotification).toHaveBeenCalledTimes(101);
		expect(maxActiveDeliveries).toBe(50);
	});

	it('deletes stale subscriptions only when credentials still match', async () => {
		mocks.sendNotification.mockRejectedValueOnce({ statusCode: 410 });
		const subscription = {
			id: 'subscription-1',
			userId: 'user-1',
			endpoint: 'endpoint-1',
			p256dh: 'key-1',
			auth: 'auth-1',
			updatedAt: new Date('2026-01-01T00:00:00.000123Z')
		};
		const deleteWhere = vi.fn().mockResolvedValue(undefined);
		const db = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([subscription]),
			delete: vi.fn().mockReturnValue({ where: deleteWhere })
		};
		mocks.getDb.mockResolvedValue(db);

		const { sendPushNotifications } = await import('./push-notifications.js');
		await sendPushNotifications([{
			userId: 'user-1',
			item: {
				id: 'notification-1',
				seriesId: null,
				seriesTitle: null,
				type: 'announcement',
				message: 'Announcement',
				isRead: false,
				createdAt: new Date().toISOString()
			}
		}]);

		expect(db.delete).toHaveBeenCalledOnce();
		expect(deleteWhere).toHaveBeenCalledOnce();
	});
});
