<script lang="ts">
	import { goto } from '$app/navigation';
	import type { NotificationItem, NotificationsListResponse } from '$lib/types.js';

	let notifications = $state<NotificationItem[]>([]);
	let offset = $state(0);
	let hasMore = $state(false);
	let initialLoading = $state(true);
	let loading = $state(false);
	let loadError = $state('');
	let markingAll = $state(false);

	$effect(() => {
		async function loadInitial() {
			initialLoading = true;
			try {
				const res = await fetch('/api/notifications?limit=20&offset=0');
				if (res.status === 401) { goto('/login'); return; }
				if (!res.ok) { loadError = 'ไม่สามารถโหลดการแจ้งเตือนได้'; return; }
				const data: NotificationsListResponse = await res.json();
				notifications = data.notifications ?? [];
				offset = data.notifications.length;
				hasMore = data.hasMore;
			} catch {
				loadError = 'ไม่สามารถโหลดการแจ้งเตือนได้';
			} finally {
				initialLoading = false;
			}
		}
		loadInitial();
	});

	function formatRelativeTime(dateStr: string): string {
		const now = Date.now();
		const date = new Date(dateStr).getTime();
		const diffMs = now - date;
		const diffSeconds = Math.floor(diffMs / 1000);
		const diffMinutes = Math.floor(diffSeconds / 60);
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffSeconds < 60) return 'เมื่อสักครู่';
		if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
		if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
		if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
		return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
	}

	function getTypeIcon(type: string): string {
		if (type === 'new_episode') {
			return `<svg class="w-5 h-5 text-mint-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
		}
		return `<svg class="w-5 h-5 text-lavender-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
	}

	async function markRead(n: NotificationItem) {
		try {
			await fetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notificationId: n.id })
			});
		} catch {
			// Fail silent — notification will still open
		}
		goto(`/series/${n.seriesId}`);
	}

	async function loadMore() {
		loading = true;
		loadError = '';
		try {
			const res = await fetch(`/api/notifications?limit=20&offset=${offset}`);
			if (!res.ok) throw new Error('ไม่สามารถโหลดการแจ้งเตือนได้');
			const data: NotificationsListResponse = await res.json();
			const newItems: NotificationItem[] = data.notifications ?? [];
			notifications = [...notifications, ...newItems];
			offset += newItems.length;
			hasMore = data.hasMore;
		} catch (e) {
			loadError = 'ไม่สามารถโหลดการแจ้งเตือนได้';
		} finally {
			loading = false;
		}
	}

	async function markAllRead() {
		markingAll = true;
		try {
			const res = await fetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			if (res.ok) {
				notifications = notifications.map((n) => ({ ...n, isRead: true }));
			}
		} catch {
			// Fail silent
		} finally {
			markingAll = false;
		}
	}
</script>

<div class="max-w-2xl mx-auto py-6 px-1">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-plum font-[family-name:var(--font-display)]">
			การแจ้งเตือน
		</h1>
		{#if notifications.length > 0}
			<button
				onclick={markAllRead}
				disabled={markingAll}
				class="text-sm font-medium text-coral hover:text-coral-dark transition-colors disabled:opacity-50 touch-target px-3 py-1.5"
			>
				{markingAll ? 'กำลังดำเนินการ...' : 'อ่านทั้งหมด'}
			</button>
		{/if}
	</div>

	<!-- Initial Loading State -->
	{#if initialLoading}
		<div class="space-y-2">
			{#each Array(5) as _}
				<div class="glass-card rounded-2xl p-4 animate-pulse flex items-start gap-3.5">
					<div class="w-5 h-5 rounded-full bg-lavender/10 mt-0.5 shrink-0"></div>
					<div class="flex-1 space-y-2">
						<div class="h-4 w-3/4 rounded bg-lavender/10"></div>
						<div class="h-3 w-1/4 rounded bg-lavender/10"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if loadError && notifications.length === 0}
		<div class="glass-card rounded-2xl py-16 px-6 text-center">
			<p class="text-coral mb-4">{loadError}</p>
		</div>
	{:else if notifications.length === 0}
		<!-- Empty State (only after initial load completes) -->
		<div class="glass-card rounded-2xl py-16 px-6 text-center">
			<svg class="w-16 h-16 mx-auto text-lavender/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
				<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
			</svg>
			<p class="text-plum-light/60 text-base">ไม่มีการแจ้งเตือน</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each notifications as n}
				<button
					onclick={() => markRead(n)}
					class="w-full text-left glass-card rounded-2xl px-4 py-3.5 transition-all duration-200 hover:bg-lavender/5 flex items-start gap-3.5 {n.isRead ? '' : 'border-l-2 border-l-coral'}"
				>
					<div class="mt-0.5 shrink-0">
						{@html getTypeIcon(n.type)}
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm text-plum leading-snug">{n.message}</p>
						<p class="text-xs text-plum-light/50 mt-1.5">{formatRelativeTime(n.createdAt)}</p>
					</div>
					{#if !n.isRead}
						<div class="w-2.5 h-2.5 rounded-full bg-coral shrink-0 mt-1.5 animate-pulse-glow"></div>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Load More -->
		{#if hasMore}
			<div class="mt-6 text-center">
				<button
					onclick={loadMore}
					disabled={loading}
					class="px-6 py-3 rounded-xl bg-lavender/10 hover:bg-lavender/20 text-plum font-medium text-sm transition-all duration-200 disabled:opacity-50 touch-target"
				>
					{#if loading}
						<span class="flex items-center gap-2 justify-center">
							<div class="w-4 h-4 border-2 border-coral border-t-transparent rounded-full animate-spin"></div>
							กำลังโหลด...
						</span>
					{:else}
						โหลดเพิ่ม
					{/if}
				</button>
			</div>
		{/if}

		<!-- Error -->
		{#if loadError}
			<div class="mt-4 text-center">
				<p class="text-sm text-coral mb-2">{loadError}</p>
				<button
					onclick={loadMore}
					class="text-sm text-coral hover:text-coral-dark font-medium underline touch-target px-3 py-1"
				>
					ลองอีกครั้ง
				</button>
			</div>
		{/if}

		<!-- Total count -->
		<p class="text-center text-xs text-plum-light/40 mt-6">
			แสดง {notifications.length} รายการ
		</p>
	{/if}
</div>
