<script lang="ts">
	import { navigating, page } from '$app/state';
	import Navigation from '$lib/components/Navigation.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import SeriesPendingShell from '$lib/components/SeriesPendingShell.svelte';
	import SeriesDetailPendingShell from '$lib/components/SeriesDetailPendingShell.svelte';
	import CalendarPendingShell from '$lib/components/CalendarPendingShell.svelte';
	import ProfilePendingShell from '$lib/components/ProfilePendingShell.svelte';

	let { children } = $props();

	const pendingShell = $derived.by(() => {
		const to = navigating.to?.url.pathname;
		const from = page.url.pathname;
		
		if (!to || to === from) return null;
		
		if (to.startsWith('/calendar') && !from.startsWith('/calendar')) {
			return 'calendar';
		}
		if (to.startsWith('/profile') && !from.startsWith('/profile')) {
			return 'profile';
		}
		if (/^\/series\/[^/]+$/.test(to) && !from.startsWith('/series/')) {
			return 'series-detail';
		}
		if (to === '/series' && !from.startsWith('/series')) {
			return 'series';
		}
		
		return null;
	});
</script>

<div class="min-h-screen flex flex-col">
	<Navigation />
	<div class="flex-1 pt-0 md:pt-24 pb-14 md:pb-0 px-4">
		{#if pendingShell === 'calendar'}
			<CalendarPendingShell />
		{:else if pendingShell === 'profile'}
			<ProfilePendingShell />
		{:else if pendingShell === 'series-detail'}
			<SeriesDetailPendingShell />
		{:else if pendingShell === 'series'}
			<SeriesPendingShell />
		{:else}
			{@render children()}
		{/if}
	</div>
	<BottomNav />
</div>
