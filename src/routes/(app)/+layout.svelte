<script lang="ts">
	import { navigating, page } from '$app/state';
	import Navigation from '$lib/components/Navigation.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import SeriesPendingShell from '$lib/components/SeriesPendingShell.svelte';

	let { children } = $props();

	const isPendingSeriesNavigation = $derived(
		navigating.to?.url.pathname.startsWith('/series') === true &&
		!page.url.pathname.startsWith('/series')
	);
</script>

<div class="min-h-screen flex flex-col">
	<Navigation />
	<div class="flex-1 pt-0 md:pt-24 pb-14 md:pb-0 px-4">
		{#if isPendingSeriesNavigation}
			<SeriesPendingShell />
		{:else}
			{@render children()}
		{/if}
	</div>
	<BottomNav />
</div>
