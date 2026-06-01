<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { NotificationItem } from '$lib/types.js';

	let {
		unreadCount = 0,
		onMarkAllRead
	}: {
		unreadCount: number;
		onMarkAllRead?: () => void;
	} = $props();

	let isOpen = $state(false);
	let notifications: NotificationItem[] = $state([]);
	let loading = $state(false);
	let error = $state('');
	let dropdownEl = $state<HTMLDivElement>();

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
			return `<svg class="w-4 h-4 text-mint-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
		}
		// status_change
		return `<svg class="w-4 h-4 text-lavender-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
	}

	async function openDropdown() {
		if (isOpen) {
			isOpen = false;
			return;
		}
		isOpen = true;
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/notifications?limit=5');
			if (!res.ok) throw new Error('ไม่สามารถโหลดการแจ้งเตือนได้');
			const data = await res.json();
			notifications = data.notifications ?? [];
		} catch (e) {
			error = 'ไม่สามารถโหลดการแจ้งเตือนได้';
			notifications = [];
		} finally {
			loading = false;
		}
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

	async function markAllRead() {
		try {
			const res = await fetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			if (res.ok) {
				const data = await res.json();
				notifications = [];
				onMarkAllRead?.();
			}
		} catch {
			// Fail silent
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (dropdownEl && !dropdownEl.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div bind:this={dropdownEl} class="relative">
	<!-- Bell Button -->
	<button
		onclick={openDropdown}
		class="relative p-2 rounded-xl hover:bg-lavender/20 transition-all touch-target flex items-center justify-center"
		aria-label="การแจ้งเตือน"
		aria-expanded={isOpen}
	>
		<svg class="w-5 h-5 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
		</svg>
		{#if unreadCount > 0}
			<span class="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-coral text-white text-[9px] font-bold leading-none shadow-lg shadow-coral/30">
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</button>

	<!-- Dropdown -->
	{#if isOpen}
		<div class="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card rounded-2xl shadow-xl shadow-lavender/20 border border-white/50 overflow-hidden z-50 animate-fade-in">
			<!-- Header -->
			<div class="flex items-center justify-between px-4 py-3 border-b border-lavender/10">
				<h3 class="text-sm font-semibold text-plum">การแจ้งเตือน</h3>
				{#if notifications.length > 0}
					<button
						onclick={markAllRead}
						class="text-xs text-coral hover:text-coral-dark font-medium transition-colors touch-target px-2 py-1"
					>
						อ่านทั้งหมด
					</button>
				{/if}
			</div>

			<!-- Content -->
			<div class="max-h-80 overflow-y-auto">
				{#if loading}
					<div class="flex items-center justify-center py-8">
						<div class="w-5 h-5 border-2 border-coral border-t-transparent rounded-full animate-spin"></div>
					</div>
				{:else if error}
					<div class="text-center py-8 px-4">
						<p class="text-sm text-plum-light/60">{error}</p>
					</div>
				{:else if notifications.length === 0}
					<div class="text-center py-8 px-4">
						<svg class="w-10 h-10 mx-auto text-lavender/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
							<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
						</svg>
						<p class="text-sm text-plum-light/60">ไม่มีการแจ้งเตือน</p>
					</div>
				{:else}
					{#each notifications as n}
						<button
							onclick={() => markRead(n)}
							class="w-full text-left px-4 py-3 hover:bg-lavender/10 transition-colors border-b border-lavender/5 last:border-b-0 flex items-start gap-3 {n.isRead ? '' : 'bg-coral/[0.02]'}"
						>
							<div class="mt-0.5 shrink-0">
								{@html getTypeIcon(n.type)}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm text-plum leading-snug">{n.message}</p>
								<p class="text-xs text-plum-light/50 mt-1">{formatRelativeTime(n.createdAt)}</p>
							</div>
							{#if !n.isRead}
								<div class="w-2 h-2 rounded-full bg-coral shrink-0 mt-1.5"></div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
