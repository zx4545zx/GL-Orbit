<script lang="ts">
	import { page } from '$app/state';
	import Navigation from '$lib/components/Navigation.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import BackToTopButton from '$lib/components/BackToTopButton.svelte';
	import {
		createUnreadNotifications,
		provideUnreadNotifications
	} from '$lib/client/unread-notifications.js';

	let { children } = $props();
	const unreadState = $state({ count: 0 });
	const unreadNotifications = createUnreadNotifications(unreadState, async () => {
		const response = await fetch('/api/notifications/unread-count');
		if (!response.ok) throw new Error('Unread notification count request failed');
		const payload = await response.json() as { count?: unknown };
		return typeof payload.count === 'number' ? payload.count : 0;
	});
	provideUnreadNotifications(unreadNotifications);

	const langPrefix = $derived(`/${page.data.lang}`);
	const currentUser = $derived(page.data.user);
	const isHomePage = $derived(
		page.url.pathname === langPrefix || page.url.pathname === `${langPrefix}/`
	);

	// Show the floating back-to-top button on long list pages, but NOT on detail pages.
	const showBackToTop = $derived(
		page.url.pathname === `${langPrefix}/series` ||
		page.url.pathname === `${langPrefix}/artists` ||
		page.url.pathname === `${langPrefix}/ships` ||
		page.url.pathname.startsWith(`${langPrefix}/explore/series`) ||
		page.url.pathname.startsWith(`${langPrefix}/explore/ships`) ||
		page.url.pathname.startsWith(`${langPrefix}/explore/artists`)
	);

	// Shared scroll state — drives both the auto-hide nav bars and the floating button position.
	let bottomNavHidden = $state(false);
	let navHidden = $state(false);

	$effect(() => {
		const userId = currentUser?.id;
		const navigationKey = `${page.url.pathname}${page.url.search}`;
		const serverCount = (page.data as { unreadCount?: unknown }).unreadCount;

		if (!userId) {
			unreadNotifications.clear();
			return;
		}

		if (typeof serverCount === 'number') {
			unreadNotifications.set(serverCount);
			return;
		}

		if (navigationKey) void unreadNotifications.refresh({ trailing: true });
	});

	function refreshUnreadCountWhenVisible() {
		if (document.visibilityState === 'visible' && currentUser) {
			void unreadNotifications.refresh({ trailing: true });
		}
	}

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
					bottomNavHidden = false;
				} else if (delta > 10) {
					navHidden = true;
					bottomNavHidden = true;
				} else if (delta < -2) {
					navHidden = false;
					bottomNavHidden = false;
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
</script>

<svelte:document onvisibilitychange={refreshUnreadCountWhenVisible} />

<div class="minimal-shell min-h-dvh flex flex-col">
	<Navigation {navHidden} />
	<div class="flex-1 mobile-bottom-safe-space px-4 {isHomePage ? '' : 'md:pt-24'}">
		{@render children()}
	</div>
	<BottomNav {bottomNavHidden} />
	{#if showBackToTop}
		<BackToTopButton {bottomNavHidden} />
	{/if}
</div>
