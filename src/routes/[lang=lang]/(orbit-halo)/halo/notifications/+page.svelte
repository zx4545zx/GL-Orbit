<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import HaloIcon from '$lib/components/moments/HaloIcon.svelte';
	import HaloPageHeader from '$lib/components/moments/HaloPageHeader.svelte';
	import type { NotificationItem, NotificationsListResponse } from '$lib/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function initialPageState() {
		return {
			notifications: data.notifications,
			unreadCount: data.unreadCount,
			offset: data.offset + data.notifications.length,
			hasMore: data.hasMore
		};
	}

	const initial = initialPageState();
	const isThai = $derived(page.data.lang === 'th');
	let notifications = $state<NotificationItem[]>(initial.notifications);
	let unreadCount = $state(initial.unreadCount);
	let offset = $state(initial.offset);
	let hasMore = $state(initial.hasMore);
	let loadingMore = $state(false);
	let markingAll = $state(false);
	let loadError = $state('');
	let notificationMutationQueue = Promise.resolve();

	function runNotificationMutation<T>(mutation: () => Promise<T>): Promise<T> {
		const result = notificationMutationQueue.then(mutation, mutation);
		notificationMutationQueue = result.then(() => undefined, () => undefined);
		return result;
	}

	$effect(() => {
		notifications = data.notifications;
		unreadCount = data.unreadCount;
		offset = data.offset + data.notifications.length;
		hasMore = data.hasMore;
		loadError = '';
	});

	function formatRelativeTime(dateString: string): string {
		const timestamp = new Date(dateString).getTime();
		if (!Number.isFinite(timestamp)) return '';

		const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
		const elapsedMinutes = Math.floor(elapsedSeconds / 60);
		const elapsedHours = Math.floor(elapsedMinutes / 60);
		const elapsedDays = Math.floor(elapsedHours / 24);
		const locale = page.data.lang === 'th' ? 'th-TH' : 'en';
		const relativeTime = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

		if (elapsedSeconds < 60) return relativeTime.format(-elapsedSeconds, 'second');
		if (elapsedMinutes < 60) return relativeTime.format(-elapsedMinutes, 'minute');
		if (elapsedHours < 24) return relativeTime.format(-elapsedHours, 'hour');
		if (elapsedDays < 7) return relativeTime.format(-elapsedDays, 'day');

		return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
			new Date(timestamp)
		);
	}

	function notificationIcon(type: NotificationItem['type']): string {
		if (type === 'moment_like') return 'heart';
		if (type === 'moment_comment') return 'comment';
		return 'spark';
	}

	function notificationCopy(notification: NotificationItem): string {
		if (notification.type === 'moment_like') {
			return isThai ? 'มีคนถูกใจ Moment ของคุณ' : 'Someone liked your Moment.';
		}
		if (notification.type === 'moment_comment') {
			return isThai ? 'มีความคิดเห็นใหม่ใน Moment ของคุณ' : 'Your Moment has a new comment.';
		}
		return notification.message;
	}

	function notificationName(notification: NotificationItem): string {
		return notification.seriesTitle || 'Orbit Halo';
	}

	function notificationHref(notification: NotificationItem): string {
		const target = notification.targetUrl;
		if (target?.startsWith(`/${page.data.lang}/`)) return target;
		if (target?.startsWith('/halo/') || target?.startsWith('/series/')) {
			return `/${page.data.lang}${target}`;
		}
		if (notification.momentId) return `/${page.data.lang}/halo/moments/${notification.momentId}`;
		if (notification.seriesId) return `/${page.data.lang}/series/${notification.seriesId}`;
		return `/${page.data.lang}/halo/notifications`;
	}

	async function openNotification(event: MouseEvent, notification: NotificationItem) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();

		if (!notification.isRead) {
			notifications = notifications.map((item) =>
				item.id === notification.id ? { ...item, isRead: true } : item
			);
			unreadCount = Math.max(0, unreadCount - 1);
		}

		void goto(notificationHref(notification));
		try {
			const result = await runNotificationMutation(async () => {
				const response = await fetch('/api/notifications', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ notificationId: notification.id })
				});
				return response.ok ? await response.json() : null;
			});
			if (result) unreadCount = result.unreadCount ?? unreadCount;
		} catch {
			// The next page load reconciles the optimistic state.
		}
	}

	async function markAllRead() {
		markingAll = true;
		loadError = '';
		try {
			const result = await runNotificationMutation(async () => {
				const response = await fetch('/api/notifications', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({})
				});
				if (!response.ok) throw new Error('mark-all-failed');
				return await response.json();
			});
			notifications = notifications.map((notification) => ({ ...notification, isRead: true }));
			unreadCount = result.unreadCount ?? 0;
		} catch {
			loadError = m.notifications_load_error();
		} finally {
			markingAll = false;
		}
	}

	async function loadMore() {
		loadingMore = true;
		loadError = '';
		try {
			const response = await fetch(`/api/notifications?limit=20&offset=${offset}`);
			if (!response.ok) throw new Error('load-more-failed');
			const result: NotificationsListResponse = await response.json();
			const knownIds = new Set(notifications.map((notification) => notification.id));
			const nextNotifications = result.notifications.filter((notification) => !knownIds.has(notification.id));
			notifications = [...notifications, ...nextNotifications];
			offset = result.offset + result.notifications.length;
			hasMore = result.hasMore;
			unreadCount = result.unreadCount;
		} catch {
			loadError = m.notifications_load_error();
		} finally {
			loadingMore = false;
		}
	}
</script>

<svelte:head>
	<title>{m.notifications_seo_title()}</title>
	<meta name="description" content={m.notifications_seo_description()} />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<HaloPageHeader
	kicker={isThai ? 'ล่าสุด' : 'Latest'}
	title={m.halo_alerts_title()}
	icon="bell"
	meta={isThai ? `${unreadCount} ใหม่` : `${unreadCount} new`}
/>

{#if unreadCount > 0}
	<div class="flex justify-end border-b border-[#eee9ef] px-4 py-2 sm:px-5">
		<button
			type="button"
			onclick={markAllRead}
			disabled={markingAll}
			class="halo-focus-ring min-h-9 rounded-full px-3 text-xs font-bold text-coral-dark transition hover:bg-coral/[.08] disabled:cursor-wait disabled:opacity-60"
		>
			{markingAll ? m.notifications_mark_all_loading() : m.notifications_mark_all()}
		</button>
	</div>
{/if}

{#if notifications.length === 0}
	<div class="grid min-h-64 place-items-center px-6 py-16 text-center">
		<div>
			<span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lavender/15 text-plum-light">
				<HaloIcon name="bell" size={24} />
			</span>
			<p class="mt-4 text-sm font-medium text-plum-light">{m.notifications_empty()}</p>
		</div>
	</div>
{:else}
	<div aria-live="polite">
		{#each notifications as notification (notification.id)}
			<a
				href={notificationHref(notification)}
				onclick={(event) => openNotification(event, notification)}
				class="halo-focus-ring relative flex gap-3 border-b border-[#eee9ef] px-4 py-4 transition hover:bg-[#fafafa] sm:px-5"
			>
				{#if !notification.isRead}
					<span class="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-coral"></span>
				{/if}
				<span class="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral/10 text-coral-dark">
					<HaloIcon name={notificationIcon(notification.type)} size={16} />
				</span>
				<span class="min-w-0 flex-1 text-sm leading-5 text-plum">
					<strong>{notificationName(notification)}</strong> {notificationCopy(notification)}
					<span class="mt-1 block text-xs text-plum-light">{formatRelativeTime(notification.createdAt)}</span>
				</span>
			</a>
		{/each}
	</div>
{/if}

{#if hasMore}
	<div class="border-b border-[#eee9ef] px-4 py-5 text-center sm:px-5">
		<button
			type="button"
			onclick={loadMore}
			disabled={loadingMore}
			class="halo-focus-ring min-h-10 rounded-full border border-[#ded8df] px-5 text-sm font-bold text-plum transition hover:bg-[#fafafa] disabled:cursor-wait disabled:opacity-60"
		>
			{loadingMore ? m.notifications_load_more_loading() : m.notifications_load_more()}
		</button>
	</div>
{/if}

{#if loadError}
	<div class="px-4 py-4 text-center sm:px-5" role="alert">
		<p class="text-sm text-coral-dark">{loadError}</p>
		{#if hasMore}
			<button type="button" onclick={loadMore} class="halo-focus-ring mt-2 rounded-full px-3 py-2 text-xs font-bold text-coral-dark hover:bg-coral/[.08]">
				{m.notifications_retry()}
			</button>
		{/if}
	</div>
{/if}
