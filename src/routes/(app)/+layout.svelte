<script lang="ts">
	import { navigating, page } from '$app/state';
	import Navigation from '$lib/components/Navigation.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import SeriesPendingShell from '$lib/components/SeriesPendingShell.svelte';
	import SeriesDetailPendingShell from '$lib/components/SeriesDetailPendingShell.svelte';
	import HomePendingShell from '$lib/components/HomePendingShell.svelte';

	let { children } = $props();

	let showShell = $state<string | null>(null);

	$effect(() => {
		const to = navigating.to?.url.pathname;
		const from = page.url.pathname;
		
		if (!to || to === from) {
			// Navigation complete or same route - hide shell immediately
			showShell = null;
			return;
		}
		
		let shellType: string | null = null;
		
		if (to === '/' && from !== '/') {
			shellType = 'home';
		} else if (/^\/series\/[^/]+$/.test(to) && !from.startsWith('/series/')) {
			shellType = 'series-detail';
		} else if (to === '/series' && !from.startsWith('/series')) {
			shellType = 'series';
		}
		
		if (shellType) {
			showShell = shellType;
		}
	});
</script>

<div class="min-h-screen flex flex-col">
	<Navigation />
	<div class="flex-1 pt-0 md:pt-24 pb-4 md:pb-0 px-4">
		{#if showShell === 'home'}
			<HomePendingShell />
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
