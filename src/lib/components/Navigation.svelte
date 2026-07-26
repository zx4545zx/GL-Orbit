<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';
import { page } from '$app/state';
	import { useUnreadNotifications } from '$lib/client/unread-notifications.js';
import NotificationDropdown from './NotificationDropdown.svelte';
import NotificationBadge from './NotificationBadge.svelte';
import LanguageSwitcher from './LanguageSwitcher.svelte';
import ThemeMenu from './ThemeMenu.svelte';
import Picture from './Picture.svelte';

	const currentUser = $derived(page.data.user);
	const unreadNotifications = useUnreadNotifications();

	const navLinks = $derived.by(() => {
		const links = [
			{ href: `/${page.data.lang}/`, label: m.nav_home() },
			{ href: `/${page.data.lang}/calendar`, label: m.nav_calendar() },
			{ href: `/${page.data.lang}/explore`, label: m.nav_explore() }
			// Orbit Halo hidden while the feature is closed — restore the /halo entry here.
		];
		if (currentUser) {
			links.push({ href: `/${page.data.lang}/notifications`, label: m.nav_notifications() });
		}
		return links;
	});

	function isActive(href: string) {
		const p = page.url.pathname;
		const langPrefix = `/${page.data.lang}`;
		if (href === `${langPrefix}/`) return p === langPrefix || p === `${langPrefix}/`;
		// "สำรวจ" ครอบทั้ง /th/explore/series และ /th/explore/artists
		if (href.startsWith(`${langPrefix}/explore`)) return p.startsWith(`${langPrefix}/explore`);
		if (href.startsWith(`${langPrefix}/halo`)) return p.startsWith(`${langPrefix}/halo`);
		return p === href || p.startsWith(href + '/');
	}

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

</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<header class="shell-topbar">
	<!-- Centered zine brand topbar -->
	<div>
		<a href="/{page.data.lang}/" class="zine-brand touch-target text-2xl sm:text-3xl" data-sveltekit-preload-data="hover">GL Orbit</a>
		<p class="shell-tagline zine-hand mt-1.5 text-xs text-[var(--orbit-muted)] sm:text-sm">{m.home_zine_tagline()}</p>
	</div>

	<!-- Controls: corner cluster on desktop, centered wrap on mobile -->
	<div class="shell-controls">
		<LanguageSwitcher variant="icon" />
		<ThemeMenu />
		{#if currentUser}
			<NotificationDropdown />
			<div bind:this={profileMenuRoot} class="relative">
				<button
					type="button"
					onclick={toggleProfileMenu}
					aria-haspopup="menu"
					aria-expanded={profileMenuOpen}
					class="flex items-center gap-2 px-2 py-1.5 text-[var(--orbit-ink)] transition-colors hover:text-[var(--orbit-coral-dark)] touch-target"
				>
					{#if currentUser.avatarUrl}
						<Picture src={currentUser.avatarUrl} type="profiles" sizes="56px" alt="" width={28} height={28} loading="eager" class="orbit-round-data w-7 h-7 object-cover" />
					{:else}
						<div class="orbit-round-data flex h-7 w-7 items-center justify-center bg-[var(--orbit-coral-soft)]">
							<span class="text-xs font-bold text-[var(--orbit-coral-dark)]">{(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}</span>
						</div>
					{/if}
					<svg class="h-4 w-4 opacity-70 transition-transform duration-200 {profileMenuOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
					</svg>
				</button>

				{#if profileMenuOpen}
					<div
						role="menu"
						class="orbit-menu absolute right-0 top-full z-[60] mt-2 w-56 overflow-hidden p-2"
					>
						<a
							href="/{page.data.lang}/profile"
							role="menuitem"
							onclick={closeProfileMenu}
							class="orbit-menu-item"
						>
							<svg class="h-5 w-5 text-[var(--orbit-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
							</svg>
							{m.menus_profile_title()}
						</a>
						<a
							href="/{page.data.lang}/subscriptions"
							role="menuitem"
							onclick={closeProfileMenu}
							class="orbit-menu-item"
						>
							<svg class="h-5 w-5 text-[var(--orbit-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 7.5h16.5m-16.5 0A2.25 2.25 0 0 1 6 5.25h12a2.25 2.25 0 0 1 2.25 2.25m-16.5 0v9A2.25 2.25 0 0 0 6 18.75h12a2.25 2.25 0 0 0 2.25-2.25v-9M7.5 14.25h3" />
							</svg>
							{m.subscriptions_nav()}
						</a>
						{#if currentUser.role === 'ADMIN'}
							<a
								href="/{page.data.lang}/admin/series"
								role="menuitem"
								onclick={closeProfileMenu}
								class="orbit-menu-item"
							>
								<svg class="h-5 w-5 text-[var(--orbit-coral-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h.008v.008H3.75V6Zm0 6h.008v.008H3.75V12Zm0 6h.008v.008H3.75V18Z" />
								</svg>
								{m.nav_admin()}
							</a>
						{/if}
						<form method="POST" action="/{page.data.lang}/logout">
							<button
								type="submit"
								role="menuitem"
								class="orbit-menu-item text-[var(--orbit-coral-dark)]"
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
			<a
				href="/{page.data.lang}/login"
				class="orbit-control flex items-center px-4 py-2 text-sm touch-target"
			>
				{m.nav_login()}
			</a>
			<a
				href="/{page.data.lang}/register"
				class="orbit-action flex items-center px-5 py-2.5 text-sm touch-target"
			>
				{m.nav_register()}
			</a>
		{/if}
	</div>
</header>

<!-- Desktop nav row under the brand -->
<nav class="orbit-navigation shell-navrow hidden md:flex">
	{#each navLinks as link}
		{@const active = isActive(link.href)}
		<a
			href={link.href}
			data-sveltekit-preload-data="hover"
			aria-current={active ? 'page' : undefined}
			class="orbit-nav-item shell-navlink touch-target {active ? 'orbit-nav-active' : ''}"
		>
			<span>{link.label}</span>
			{#if link.href === `/${page.data.lang}/notifications`}
				<NotificationBadge count={unreadNotifications.state.count} />
			{/if}
			<span class="orbit-nav-indicator" aria-hidden="true"></span>
		</a>
	{/each}
</nav>
