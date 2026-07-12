<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';
import { navigating, page } from '$app/state';
import { onMount } from 'svelte';
import { connectNotificationStream } from '$lib/client/notification-stream.js';
import NotificationBadge from './NotificationBadge.svelte';

	let { bottomNavHidden = false }: { bottomNavHidden?: boolean } = $props();

	const currentUser = $derived(page.data.user);
	let unreadCount = $state(0);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		return () => {
			mounted = false;
		};
	});

	$effect(() => {
		if (!mounted) return;

		if (!currentUser) {
			unreadCount = 0;
			return;
		}

		let disconnect: (() => void) | undefined;

		async function init() {
			try {
				const res = await fetch('/api/notifications/unread-count');
				if (res.ok) {
					const data = await res.json();
					unreadCount = data.count ?? 0;
				}
			} catch {
				unreadCount = 0;
			}
			disconnect = connectNotificationStream({
				onNotification: () => {
					unreadCount += 1;
				},
				onCount: (count) => {
					unreadCount = count;
				},
				onCleared: () => {
					unreadCount = 0;
				}
			});
		}

		init();

		return () => {
			disconnect?.();
		};
	});

	const homeItem = $derived({
		href: `/${page.data.lang}/`,
		label: m.nav_home(),
		icon: (active: boolean) => `
			<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
				<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
			</svg>
		`
	});

	const secondaryItems = $derived([
		{
			href: `/${page.data.lang}/calendar`,
			label: m.nav_calendar(),
			icon: (active: boolean) => `
				<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
					</svg>
				`
			},
			{
				href: `/${page.data.lang}/explore/series`,
				label: m.nav_explore(),
				icon: (active: boolean) => `
					<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm.93-13.43 1.5 5.26c.12.4.44.72.84.84l5.26 1.5a.75.75 0 0 0 .92-.92l-1.5-5.26a1.27 1.27 0 0 0-.84-.84l-5.26-1.5a.75.75 0 0 0-.92.92Zm.3 4.2-2.5 2.5" />
					</svg>
				`
			},
			{
				href: `/${page.data.lang}/halo`,
				label: m.nav_halo(),
				icon: (active: boolean) => `
					<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3.75 14.37 8.55l5.3.77-3.84 3.74.9 5.28L12 15.85l-4.74 2.49.9-5.28-3.84-3.74 5.3-.77L12 3.75Z" /></svg>
				`
			}
		]);

	const menuItem = $derived({
		href: `/${page.data.lang}/menus`,
		label: m.nav_menus(),
		icon: (active: boolean) => `
			<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '2.3' : '1.7'}">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
			</svg>
		`
	});

	const notificationItem = $derived(
		currentUser
			? {
					href: `/${page.data.lang}/notifications`,
					label: m.nav_notifications(),
					icon: (active: boolean) => `
						<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
							<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
						</svg>
					`
				}
			: null
	);

	const navItems = $derived.by(() => {
		const items = [homeItem, ...secondaryItems];
		if (notificationItem) {
			items.push(notificationItem);
		}
		items.push(menuItem);
		return items;
	});

	const activePathname = $derived(navigating.to?.url.pathname ?? page.url.pathname);

	function isActive(href: string) {
		const langPrefix = `/${page.data.lang}`;
		if (href === `${langPrefix}/`) {
			return activePathname === langPrefix || activePathname === `${langPrefix}/`;
		}
		// "สำรวจ" ครอบทั้ง /th/explore/series และ /th/explore/artists
		if (href.startsWith(`${langPrefix}/explore`)) {
			return activePathname.startsWith(`${langPrefix}/explore`);
		}
		return activePathname === href || activePathname.startsWith(href + '/');
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 {bottomNavHidden ? 'translate-y-full' : 'translate-y-0'}"
>
	<div class="bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(196,181,253,0.3)] overflow-hidden border-t border-lavender/15 safe-area-bottom">
		<div class="flex items-stretch px-1">
			{#each navItems as item}
				{@const active = isActive(item.href)}
				<a
					href={item.href}
					data-sveltekit-preload-data="hover"
					aria-current={active ? 'page' : undefined}
					class="group flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 py-2 touch-target transition-all duration-300"
				>
					<div class="relative flex items-center justify-center">
						{#if active}
							<div
								class="absolute inset-0 -m-1 bg-gradient-to-br from-coral/15 to-lavender/15 rounded-xl transition-all duration-300"
							></div>
						{/if}
						<div class="relative">
							{@html item.icon(active)}
							{#if item.href === `/${page.data.lang}/notifications`}
								<NotificationBadge count={unreadCount} />
							{/if}
						</div>
					</div>
					<span
						class="block max-w-full truncate text-center text-[10px] font-medium leading-none transition-all duration-300 {active ? 'text-plum font-semibold' : 'text-plum-light'}"
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
