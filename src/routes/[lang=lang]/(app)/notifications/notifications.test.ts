import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('notifications page client-side fetch', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		vi.stubGlobal('fetch', mockFetch);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('exports a fetchNotifications function that calls /api/notifications', async () => {
		mockFetch.mockResolvedValue(
			new Response(JSON.stringify({
				notifications: [{ id: '1', message: 'Test', type: 'new_episode', createdAt: new Date().toISOString(), isRead: false, seriesId: 's1' }],
				unreadCount: 1,
				totalCount: 1,
				hasMore: false,
				limit: 20,
				offset: 0
			}), { status: 200, headers: { 'content-type': 'application/json' } })
		);

		// Import the client-side fetch module (will be added alongside svelte)
		const { fetchNotifications } = await import('./notifications.js');
		const result = await fetchNotifications();

		expect(mockFetch).toHaveBeenCalledWith('/api/notifications?limit=20&offset=0');
		expect(result.notifications).toHaveLength(1);
		expect(result.hasMore).toBe(false);
	});

	it('handles API errors gracefully', async () => {
		mockFetch.mockResolvedValue(new Response(null, { status: 500 }));

		const { fetchNotifications } = await import('./notifications.js');
		const result = await fetchNotifications();

		expect(result.loadError).toBe('ไม่สามารถโหลดการแจ้งเตือนได้');
		expect(result.notifications).toEqual([]);
	});
});
