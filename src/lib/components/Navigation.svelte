<script lang="ts">
	import { page } from '$app/state';
	import NotificationDropdown from './NotificationDropdown.svelte';

	const navLinks = [
		{ href: '/', label: 'หน้าแรก' },
		{ href: '/calendar', label: 'ตารางฉาย' },
		{ href: '/series', label: 'ซีรีส์ทั้งหมด' }
	];

	const user = $derived(page.data.user);

	let unreadCount = $state(0);

	$effect(() => {
		if (!user) {
			unreadCount = 0;
			return;
		}

		let cancelled = false;

		async function poll() {
			try {
				const res = await fetch('/api/notifications/unread-count');
				if (!cancelled && res.ok) {
					const data = await res.json();
					unreadCount = data.count ?? 0;
				}
			} catch {
				if (!cancelled) unreadCount = 0;
			}
		}

		poll();
		const interval = setInterval(poll, 30000);

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	});
</script>

<nav class="fixed top-0 left-0 right-0 z-50 hidden md:block">
	<div class="glass-card-strong mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-2xl px-4 sm:px-6 py-3 sm:py-4">
		<div class="flex items-center justify-between">
			<!-- Logo -->
			<a href="/" data-sveltekit-preload-data="tap" class="flex items-center gap-2 group touch-target">
				<div class="relative w-8 h-8 sm:w-10 sm:h-10">
					<div class="absolute inset-0 bg-gradient-to-br from-coral to-lavender rounded-xl rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
					<div class="absolute inset-0 bg-white rounded-xl flex items-center justify-center">
						<span class="text-base sm:text-lg font-bold text-gradient">G</span>
					</div>
				</div>
				<span class="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-plum tracking-tight">
					GL-Orbit
				</span>
			</a>

			<!-- Desktop Navigation -->
			<div class="flex items-center gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						data-sveltekit-preload-data="tap"
						class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 touch-target flex items-center {page.url.pathname === link.href ? 'bg-coral/10 text-coral-dark' : 'text-plum-light hover:bg-lavender/20 hover:text-plum'}"
					>
						{link.label}
					</a>
				{/each}
			</div>

			<!-- Auth Section -->
			<div class="flex items-center gap-3">
				{#if user}
					{#if user.role === 'ADMIN'}
						<a
							href="/admin/series"
							data-sveltekit-preload-data="tap"
							class="px-4 py-2 rounded-xl text-sm font-medium text-plum-light hover:bg-lavender/20 hover:text-plum transition-all touch-target flex items-center"
						>
							จัดการ
						</a>
					{/if}
					<NotificationDropdown
						unreadCount={unreadCount}
						onMarkAllRead={() => { unreadCount = 0; }}
					/>
					<a
						href="/profile"
						class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-lavender/20 transition-all touch-target"
					>
						{#if user.avatarUrl}
							<img src={user.avatarUrl} alt="" class="w-7 h-7 rounded-full object-cover" />
						{:else}
							<div class="w-7 h-7 rounded-full bg-gradient-to-br from-coral/20 to-lavender/20 flex items-center justify-center">
								<span class="text-xs font-bold text-coral-dark">{(user.displayName || user.username).charAt(0).toUpperCase()}</span>
							</div>
						{/if}
						<span class="text-sm font-medium text-plum">{user.displayName || user.username}</span>
					</a>
				{:else}
					<div class="flex items-center gap-2">
						<a
							href="/login"
							class="px-4 py-2 rounded-xl text-sm font-medium text-plum-light hover:bg-lavender/20 hover:text-plum transition-all touch-target flex items-center"
						>
							เข้าสู่ระบบ
						</a>
						<a
							href="/register"
							class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white text-sm font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:scale-105 transition-all duration-300 touch-target flex items-center"
						>
							สมัครสมาชิก
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</nav>
