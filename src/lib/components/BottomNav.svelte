<script lang="ts">
	import { navigating, page } from '$app/state';
	import { user } from '$lib/stores/user.js';
	import NotificationBadge from './NotificationBadge.svelte';

	const currentUser = $derived($user);
	let unreadCount = $state(0);

	$effect(() => {
		if (!currentUser) {
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

	const baseItems = [
		{
			href: '/',
			label: 'หน้าแรก',
			icon: (active: boolean) => `
				<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
					<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
				</svg>
			`
		},
		{
			href: '/calendar',
			label: 'ตารางฉาย',
			icon: (active: boolean) => `
				<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
				</svg>
			`
		},
		{
			href: '/series',
			label: 'ซีรีส์',
			icon: (active: boolean) => `
				<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0v-11.25c0-1.036.84-1.875 1.875-1.875h13.5c1.035 0 1.875.84 1.875 1.875v11.25m-18 0a1.125 1.125 0 0 0 1.125 1.125M18.75 19.5v-2.625a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v2.625m0 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125M21 19.5v-2.625a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v2.625m0 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125M9.75 9.75v2.625m3-.375v2.625m3-.375v2.625" />
				</svg>
			`
		}
	];

	const authItem = $derived(
		currentUser
			? {
					href: '/profile',
					label: 'โปรไฟล์',
					icon: (active: boolean) => `
						<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
						</svg>
					`
				}
			: {
					href: '/login',
					label: 'เข้าสู่ระบบ',
					icon: (active: boolean) => `
						<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
						</svg>
					`
				}
	);

	const notificationItem = $derived(
		currentUser
			? {
					href: '/notifications',
					label: 'แจ้งเตือน',
					icon: (active: boolean) => `
						<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
							<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
						</svg>
					`
				}
			: null
	);

	const navItems = $derived.by(() => {
		const items = [...baseItems];
		if (notificationItem) {
			items.push(notificationItem);
		}
		items.push(authItem);
		return items;
	});
	let navHidden = $state(false);

	$effect(() => {
		let lastScrollY = window.scrollY;
		let ticking = false;

		function onScroll() {
			if (ticking) return;
			ticking = true;

			requestAnimationFrame(() => {
				const currentY = window.scrollY;
				const delta = currentY - lastScrollY;
				const atTop = currentY <= 0;

				if (atTop) {
					navHidden = false;
				} else if (delta > 10) {
					navHidden = true;
				} else if (delta < -2) {
					navHidden = false;
				}

				if (!atTop && Math.abs(delta) > 2) {
					lastScrollY = currentY;
				} else if (atTop) {
					lastScrollY = 0;
				}
				ticking = false;
			});
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const activePathname = $derived(navigating.to?.url.pathname ?? page.url.pathname);

	function isActive(href: string) {
		if (href === '/') {
			return activePathname === '/';
		}
		return activePathname.startsWith(href);
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 {navHidden ? 'translate-y-full' : 'translate-y-0'}"
	style="padding-bottom: env(safe-area-inset-bottom, 0px);"
>
	<div class="bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
		<div class="flex items-center justify-around px-2">
			{#each navItems as item}
				{@const active = isActive(item.href)}
				<a
					href={item.href}
					data-sveltekit-preload-data="hover"
					aria-current={active ? 'page' : undefined}
					class="group flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] touch-target transition-all duration-300"
				>
					<div class="relative flex items-center justify-center">
						{#if active}
							<div
								class="absolute inset-0 -m-1 bg-coral/10 rounded-xl transition-all duration-300"
							></div>
						{/if}
						<div class="relative">
							{@html item.icon(active)}
							{#if item.href === '/notifications'}
								<NotificationBadge count={unreadCount} />
							{/if}
						</div>
					</div>
					<span
						class="text-[10px] font-medium leading-none transition-all duration-300 {active ? 'text-coral-dark font-semibold' : 'text-plum-light/70'}"
					>
						{item.label}
					</span>
					{#if active}
						<div class="w-1 h-1 rounded-full bg-coral-dark mt-0.5"></div>
					{:else}
						<div class="w-1 h-1 rounded-full bg-transparent mt-0.5"></div>
					{/if}
				</a>
			{/each}
		</div>
	</div>
</nav>
