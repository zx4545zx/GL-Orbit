import { describe, expect, it, vi } from 'vitest';
import { createUnreadNotifications } from './unread-notifications.js';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

describe('createUnreadNotifications', () => {
	it('deduplicates concurrent refreshes', async () => {
		const pending = deferred<number>();
		const loadCount = vi.fn(() => pending.promise);
		const state = { count: 0 };
		const notifications = createUnreadNotifications(state, loadCount);

		const first = notifications.refresh();
		const second = notifications.refresh();

		expect(first).toBe(second);
		expect(loadCount).toHaveBeenCalledTimes(1);

		pending.resolve(4);
		await first;
		expect(state.count).toBe(4);
	});

	it('does not overwrite a local update with a stale refresh', async () => {
		const pending = deferred<number>();
		const state = { count: 5 };
		const notifications = createUnreadNotifications(state, () => pending.promise);

		const refresh = notifications.refresh();
		notifications.decrement();
		pending.resolve(9);
		await refresh;

		expect(state.count).toBe(4);
	});

	it('preserves the last count after failure and allows retry', async () => {
		const loadCount = vi.fn()
			.mockRejectedValueOnce(new Error('network'))
			.mockResolvedValueOnce(7);
		const state = { count: 3 };
		const notifications = createUnreadNotifications(state, loadCount);

		await notifications.refresh();
		expect(state.count).toBe(3);

		await notifications.refresh();
		expect(state.count).toBe(7);
		expect(loadCount).toHaveBeenCalledTimes(2);
	});

	it('queues one trailing refresh when requested during an active load', async () => {
		const first = deferred<number>();
		const second = deferred<number>();
		const loadCount = vi.fn()
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);
		const state = { count: 0 };
		const notifications = createUnreadNotifications(state, loadCount);

		const active = notifications.refresh();
		notifications.refresh({ trailing: true });
		notifications.refresh({ trailing: true });
		first.resolve(2);
		await active;
		await vi.waitFor(() => expect(loadCount).toHaveBeenCalledTimes(2));

		second.resolve(3);
		await vi.waitFor(() => expect(state.count).toBe(3));
	});

	it('serializes mutation requests', async () => {
		const first = deferred<void>();
		const second = vi.fn().mockResolvedValue(undefined);
		const notifications = createUnreadNotifications({ count: 0 }, async () => 0);

		const firstMutation = notifications.runMutation(() => first.promise);
		const secondMutation = notifications.runMutation(second);
		expect(second).not.toHaveBeenCalled();

		first.resolve();
		await firstMutation;
		await secondMutation;
		expect(second).toHaveBeenCalledTimes(1);
	});
});
