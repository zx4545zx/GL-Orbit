<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<Navigation />
	<div class="flex-1 pt-0 md:pt-24 mobile-bottom-safe-space px-4">
		{@render children()}
	</div>
	<BottomNav />
</div>
