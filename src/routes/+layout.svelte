<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/state';
	import { onMount } from 'svelte';
	import { user, userLoading } from '$lib/stores/user.js';

	let { children } = $props();

	onMount(async () => {
		try {
			const res = await fetch('/api/user');
			if (res.ok) {
				const data = await res.json();
				user.set(data.user);
			}
		} catch {
			// ignore
		} finally {
			userLoading.set(false);
		}
	});
</script>

{#if navigating.to && (!navigating.from || navigating.to.url.pathname !== navigating.from.url.pathname)}
	<div class="fixed top-0 left-0 right-0 z-[60]">
		<div class="h-1 w-full bg-coral/10 overflow-hidden">
			<div class="h-full w-1/3 bg-gradient-to-r from-coral via-coral-dark to-coral animate-[loading-slide_1s_ease-in-out_infinite]"></div>
		</div>
	</div>
{/if}

{@render children()}
