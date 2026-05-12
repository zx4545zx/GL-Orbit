<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';

	let { children } = $props();
</script>

{#if $navigating}
	<div class="fixed top-0 left-0 right-0 z-[60]">
		<div class="h-1 w-full bg-coral/10 overflow-hidden">
			<div class="h-full w-1/3 bg-gradient-to-r from-coral via-coral-dark to-coral animate-[loading-slide_1s_ease-in-out_infinite]"></div>
		</div>
	</div>
{/if}

{@render children()}
