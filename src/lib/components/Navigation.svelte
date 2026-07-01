<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { page } from '$app/state';
	import NotificationDropdown from './NotificationDropdown.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';

	let { navHidden = false }: { navHidden?: boolean } = $props();

	const navLinks = [
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
		{
			href: `/${page.data.lang}/chat`,
			label: m.nav_chat(),
			icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 12c0 4.142-4.03 7.5-9 7.5a10.55 10.55 0 0 1-3.72-.66L3 20.25l1.46-3.98A6.82 6.82 0 0 1 3 12c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5Z" /></svg>'
		}
	];

	function isActive(href: string) {
		const p = page.url.pathname;
		const langPrefix = `/${page.data.lang}`;
		if (href === `${langPrefix}/`) return p === `${langPrefix}/`;
		// "สำรวจ" ครอบทั้ง /th/explore/series และ /th/explore/artists
		if (href.startsWith(`${langPrefix}/explore`)) return p.startsWith(`${langPrefix}/explore`);
		return p === href || p.startsWith(href + '/');
	}

	const currentUser = $derived(page.data.user);

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
</script>

<nav class="fixed top-[var(--pwa-safe-top)] left-0 right-0 z-50 hidden md:block transition-transform duration-300 ease-out {navHidden ? '-translate-y-full' : 'translate-y-0'}">
	<div class="bg-white mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-2xl shadow-lg shadow-lavender/25 border border-lavender/15 overflow-hidden">
		<div class="grid grid-cols-[minmax(12rem,1fr)_auto_minmax(12rem,1fr)] items-center gap-3 px-4 sm:px-6 py-3 sm:py-4">
			<!-- Logo -->
			<a href="/{page.data.lang}/" class="justify-self-start flex items-center gap-2 group touch-target">
				<div class="relative w-8 h-8 sm:w-10 sm:h-10">
					<div class="absolute inset-0 bg-gradient-to-br from-coral via-lavender to-mint rounded-xl"></div>
					<div class="absolute inset-[2px] bg-white rounded-[0.625rem] flex items-center justify-center">
						<span class="text-base sm:text-lg font-bold text-gradient">G</span>
					</div>
					<!-- ดาวเทียมโคจร (GL-Orbit) -->
					<div class="absolute inset-0 animate-[spin_9s_linear_infinite] pointer-events-none">
						<span class="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-coral shadow-[0_0_5px_rgba(255,107,157,0.9)]"></span>
					</div>
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
						class="relative px-3 xl:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 touch-target flex items-center justify-center gap-2 whitespace-nowrap {isActive(link.href) ? 'bg-coral/15 text-coral-dark font-semibold' : 'text-plum-light hover:bg-lavender/20 hover:text-plum'}"
					>
						<span class="flex-shrink-0" aria-hidden="true">{@html link.icon}</span>
						<span class="hidden xl:inline">{link.label}</span>
					</a>
				{/each}
			</div>

			<!-- Auth Section -->
			<div class="justify-self-end flex items-center gap-2 xl:gap-3 min-w-0">
				<LanguageSwitcher className="hidden lg:flex" />
				{#if currentUser}
					{#if currentUser.role === 'ADMIN'}
						<a
							href="/{page.data.lang}/admin/series"
							aria-label={m.nav_admin()}
							title={m.nav_admin()}
							class="px-3 xl:px-4 py-2 rounded-xl text-sm font-medium text-plum-light hover:bg-lavender/20 hover:text-plum transition-all touch-target flex items-center justify-center gap-2 whitespace-nowrap"
						>
							<svg class="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h.008v.008H3.75V6Zm0 6h.008v.008H3.75V12Zm0 6h.008v.008H3.75V18Z" />
							</svg>
							<span class="hidden xl:inline">{m.nav_admin()}</span>
						</a>
					{/if}
					<NotificationDropdown
						unreadCount={unreadCount}
						onMarkAllRead={() => { unreadCount = 0; }}
					/>
					<a
						href="/{page.data.lang}/profile"
						class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-lavender/20 transition-all touch-target"
					>
						{#if currentUser.avatarUrl}
							<img src={currentUser.avatarUrl} alt="" width={28} height={28} loading="eager" decoding="async" class="w-7 h-7 rounded-full object-cover" />
						{:else}
							<div class="w-7 h-7 rounded-full bg-gradient-to-br from-coral/20 to-lavender/20 flex items-center justify-center">
								<span class="text-xs font-bold text-coral-dark">{(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}</span>
							</div>
						{/if}
						<span class="hidden 2xl:inline text-sm font-medium text-plum whitespace-nowrap">{currentUser.displayName || currentUser.username}</span>
					</a>
				{:else}
					<div class="flex items-center gap-2">
						<a
							href="/{page.data.lang}/login"
							class="px-4 py-2 rounded-xl text-sm font-medium text-plum-light hover:bg-lavender/20 hover:text-plum transition-all touch-target flex items-center"
						>
							{m.nav_login()}
						</a>
						<a
							href="/{page.data.lang}/register"
							class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white text-sm font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:scale-105 transition-all duration-300 touch-target flex items-center"
						>
							{m.nav_register()}
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</nav>
