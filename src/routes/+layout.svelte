<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<Navigation />
	<div class="flex-1 pt-0 md:pt-24 pb-20 md:pb-0">
		{@render children()}
	</div>
	<!-- <Footer /> -->
	<BottomNav />
</div>
