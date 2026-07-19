import { getContext, setContext } from 'svelte';

export interface UnreadNotificationsState {
	count: number;
}

export interface UnreadNotifications {
	state: UnreadNotificationsState;
	refresh: (options?: { trailing?: boolean }) => Promise<void>;
	beginMutation: () => number;
	reconcile: (count: number, mutationRevision: number) => void;
	runMutation: <T>(mutation: () => Promise<T>) => Promise<T>;
	set: (count: number) => number;
	decrement: () => number;
	clear: () => number;
}

const unreadNotificationsContext = Symbol('unread-notifications');

function normalizeCount(count: number): number {
	return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
}

export function createUnreadNotifications(
	state: UnreadNotificationsState,
	loadCount: () => Promise<number>
): UnreadNotifications {
	let activeRefresh: Promise<void> | null = null;
	let trailingRefresh = false;
	let mutationQueue = Promise.resolve();
	let revision = 0;

	function beginMutation(): number {
		revision += 1;
		return revision;
	}

	function set(count: number): number {
		const mutationRevision = beginMutation();
		state.count = normalizeCount(count);
		return mutationRevision;
	}

	function refresh(options?: { trailing?: boolean }): Promise<void> {
		if (activeRefresh) {
			if (options?.trailing) trailingRefresh = true;
			return activeRefresh;
		}

		const startedAtRevision = revision;
		activeRefresh = (async () => {
			try {
				const count = await loadCount();
				if (revision === startedAtRevision) state.count = normalizeCount(count);
			} catch {
				// Keep the last known count; a later navigation or tab focus retries.
			} finally {
				activeRefresh = null;
				if (trailingRefresh) {
					trailingRefresh = false;
					void refresh();
				}
			}
		})();

		return activeRefresh;
	}

	function reconcile(count: number, mutationRevision: number): void {
		if (revision === mutationRevision) set(count);
	}

	function runMutation<T>(mutation: () => Promise<T>): Promise<T> {
		const result = mutationQueue.then(mutation, mutation);
		mutationQueue = result.then(() => undefined, () => undefined);
		return result;
	}

	return {
		state,
		refresh,
		beginMutation,
		reconcile,
		runMutation,
		set,
		decrement: () => set(state.count - 1),
		clear: () => set(0)
	};
}

export function provideUnreadNotifications(notifications: UnreadNotifications): void {
	setContext(unreadNotificationsContext, notifications);
}

export function useUnreadNotifications(): UnreadNotifications {
	const notifications = getContext<UnreadNotifications | undefined>(unreadNotificationsContext);
	if (!notifications) throw new Error('Unread notifications context is unavailable');
	return notifications;
}
