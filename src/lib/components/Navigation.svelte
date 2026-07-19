<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';
import { page } from '$app/state';
import { onMount } from 'svelte';
import { connectNotificationStream } from '$lib/client/notification-stream.js';
import NotificationDropdown from './NotificationDropdown.svelte';
import LanguageSwitcher from './LanguageSwitcher.svelte';
import ThemeToggle from './ThemeToggle.svelte';
import Picture from './Picture.svelte';

	let { navHidden = false }: { navHidden?: boolean } = $props();

	const navLinks = $derived([
		{
			href: `/${page.data.lang}/`,
			label: m.nav_home(),
			icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" /></svg>'
		},
		{
			href: `/${page.data.lang}/calendar`,
			label: m.nav_calendar(),
			icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>'
		},
		{
			href: `/${page.data.lang}/explore/series`,
			label: m.nav_explore(),
			icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm.93-13.43 1.5 5.26c.12.4.44.72.84.84l5.26 1.5a.75.75 0 0 0 .92-.92l-1.5-5.26a1.27 1.27 0 0 0-.84-.84l-5.26-1.5a.75.75 0 0 0-.92.92Zm.3 4.2-2.5 2.5" /></svg>'
		},
	]);

	function isActive(href: string) {
		const p = page.url.pathname;
		const langPrefix = `/${page.data.lang}`;
		if (href === `${langPrefix}/`) return p === langPrefix || p === `${langPrefix}/`;
		// "สำรวจ" ครอบทั้ง /th/explore/series และ /th/explore/artists
		if (href.startsWith(`${langPrefix}/explore`)) return p.startsWith(`${langPrefix}/explore`);
		return p === href || p.startsWith(href + '/');
	}

	const currentUser = $derived(page.data.user);

	let unreadCount = $state(0);
	let mounted = $state(false);
	let profileMenuOpen = $state(false);
	let profileMenuRoot = $state<HTMLDivElement | null>(null);

	function toggleProfileMenu() {
		profileMenuOpen = !profileMenuOpen;
	}

	function handleWindowClick(event: MouseEvent) {
		if (profileMenuRoot && event.target instanceof Node && !profileMenuRoot.contains(event.target)) {
			profileMenuOpen = false;
		}
	}

	function closeProfileMenu() {
		profileMenuOpen = false;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') profileMenuOpen = false;
	}

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
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<nav class="fixed top-[var(--pwa-safe-top)] left-0 right-0 z-50 hidden md:block transition-transform duration-300 ease-out {navHidden ? '-translate-y-full' : 'translate-y-0'}">
	<div class="border-b border-[var(--orbit-line-strong)] bg-white">
		<div class="mx-auto grid max-w-7xl grid-cols-[minmax(12rem,1fr)_auto_minmax(12rem,1fr)] items-center gap-3 px-6 py-2">
			<!-- Logo -->
			<a href="/{page.data.lang}/" class="justify-self-start flex items-center gap-2 group touch-target">
				<div class="relative h-8 w-8 rounded-md bg-white sm:h-9 sm:w-9">
					<img
						src="/icons/gl-orbit-logo.svg"
						alt=""
						width="40"
						height="40"
						loading="eager"
						decoding="async"
						class="h-full w-full rounded-xl object-contain"
					/>
				</div>
				<span class="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-plum tracking-tight">
					GL-Orbit
				</span>
			</a>

			<!-- Desktop Navigation -->
			<div class="justify-self-center flex items-center gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						aria-label={link.label}
						title={link.label}
						class="relative flex items-center justify-center gap-2 whitespace-nowrap border-x border-transparent px-3 py-2 text-sm font-medium transition-colors touch-target xl:px-4 {isActive(link.href) ? 'border-[var(--orbit-line-strong)] bg-plum text-white font-semibold' : 'text-plum-light hover:border-[var(--orbit-line)] hover:bg-cream hover:text-coral-dark'}"
					>
						<span class="flex-shrink-0" aria-hidden="true">{@html link.icon}</span>
						<span class="hidden xl:inline">{link.label}</span>
					</a>
				{/each}
			</div>

			<!-- Auth Section -->
			<div class="justify-self-end flex items-center gap-2 xl:gap-3 min-w-0">
				<LanguageSwitcher variant="icon" className="hidden lg:inline-flex" />
			<ThemeToggle />
				{#if currentUser}
				<NotificationDropdown
					unreadCount={unreadCount}
					onMarkAllRead={() => { unreadCount = 0; }}
					onUnreadCountChange={(count) => { unreadCount = count; }}
				/>
					<div bind:this={profileMenuRoot} class="relative">
						<button
							type="button"
							onclick={toggleProfileMenu}
							aria-haspopup="menu"
							aria-expanded={profileMenuOpen}
							class="flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-plum/5 touch-target"
						>
							{#if currentUser.avatarUrl}
								<Picture src={currentUser.avatarUrl} type="profiles" sizes="56px" alt="" width={28} height={28} loading="eager" class="orbit-round-data w-7 h-7 object-cover" />
							{:else}
								<div class="orbit-round-data flex h-7 w-7 items-center justify-center bg-coral/20">
									<span class="text-xs font-bold text-coral-dark">{(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}</span>
								</div>
							{/if}
							<span class="hidden 2xl:inline text-sm font-medium text-plum whitespace-nowrap">{currentUser.displayName || currentUser.username}</span>
							<svg class="h-4 w-4 text-plum-light transition-transform duration-200 {profileMenuOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
							</svg>
						</button>

						{#if profileMenuOpen}
							<div
								role="menu"
							class="absolute right-0 top-full z-[60] mt-2 w-56 overflow-hidden border border-[var(--orbit-line-strong)] bg-white p-2 shadow-[var(--orbit-shadow-raised)]"
							>
								<a
									href="/{page.data.lang}/profile"
									role="menuitem"
									onclick={closeProfileMenu}
									class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-plum/5 hover:text-coral-dark"
								>
									<svg class="h-5 w-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
									</svg>
									{m.menus_profile_title()}
								</a>
								{#if currentUser.role === 'ADMIN'}
									<a
										href="/{page.data.lang}/admin/series"
										role="menuitem"
										onclick={closeProfileMenu}
										class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-plum/5 hover:text-coral-dark"
									>
										<svg class="h-5 w-5 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h.008v.008H3.75V6Zm0 6h.008v.008H3.75V12Zm0 6h.008v.008H3.75V18Z" />
										</svg>
										{m.nav_admin()}
									</a>
								{/if}
								<form method="POST" action="/{page.data.lang}/logout">
									<button
										type="submit"
										role="menuitem"
										class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-coral-dark transition-colors hover:bg-coral/10"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
										</svg>
										{m.nav_logout()}
									</button>
								</form>
							</div>
						{/if}
					</div>
				{:else}
					<div class="flex items-center gap-2">
						<a
							href="/{page.data.lang}/login"
							class="flex items-center rounded-md px-4 py-2 text-sm font-medium text-plum hover:bg-plum/5 hover:text-coral-dark transition-colors touch-target"
						>
							{m.nav_login()}
						</a>
						<a
							href="/{page.data.lang}/register"
						class="flex items-center border border-coral bg-coral px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-dark touch-target"
						>
							{m.nav_register()}
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</nav>
