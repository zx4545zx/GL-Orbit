<script lang="ts">
	import { navigating, page } from '$app/state';
	import Navigation from '$lib/components/Navigation.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import SeriesPendingShell from '$lib/components/SeriesPendingShell.svelte';
	import SeriesDetailPendingShell from '$lib/components/SeriesDetailPendingShell.svelte';
	import CalendarPendingShell from '$lib/components/CalendarPendingShell.svelte';
	import ProfilePendingShell from '$lib/components/ProfilePendingShell.svelte';
	import LoginPendingShell from '$lib/components/LoginPendingShell.svelte';
	import RegisterPendingShell from '$lib/components/RegisterPendingShell.svelte';
	import HomePendingShell from '$lib/components/HomePendingShell.svelte';

	let { children } = $props();

	let showShell = $state<string | null>(null);
	let shellTimeout: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		const to = navigating.to?.url.pathname;
		const from = page.url.pathname;
		
		if (!to || to === from) {
			// Navigation complete or same route - hide shell after minimum display time
			if (shellTimeout) clearTimeout(shellTimeout);
			shellTimeout = setTimeout(() => {
				showShell = null;
			}, 500); // Minimum 500ms display time
			return;
		}
		
		let shellType: string | null = null;
		
		if (to === '/' && from !== '/') {
			shellType = 'home';
		} else if (to === '/login' && from !== '/login') {
			shellType = 'login';
		} else if (to === '/register' && from !== '/register') {
			shellType = 'register';
		} else if (to.startsWith('/calendar') && !from.startsWith('/calendar')) {
			shellType = 'calendar';
		} else if (to.startsWith('/profile') && !from.startsWith('/profile')) {
			shellType = 'profile';
		} else if (/^\/series\/[^/]+$/.test(to) && !from.startsWith('/series/')) {
			shellType = 'series-detail';
		} else if (to === '/series' && !from.startsWith('/series')) {
			shellType = 'series';
		}
		
		if (shellType) {
			if (shellTimeout) clearTimeout(shellTimeout);
			showShell = shellType;
		}
	});
</script>

<div class="min-h-screen flex flex-col">
	<Navigation />
	<div class="flex-1 pt-0 md:pt-24 pb-4 md:pb-0 px-4">
		{#if showShell === 'home'}
			<HomePendingShell />
		{:else if showShell === 'login'}
			<LoginPendingShell />
		{:else if showShell === 'register'}
			<RegisterPendingShell />
		{:else if showShell === 'calendar'}
			<CalendarPendingShell />
		{:else if showShell === 'profile'}
			<ProfilePendingShell />
		{:else if showShell === 'series-detail'}
			<SeriesDetailPendingShell />
		{:else if showShell === 'series'}
			<SeriesPendingShell />
		{:else}
			{@render children()}
		{/if}
	</div>
	<BottomNav />
</div>
