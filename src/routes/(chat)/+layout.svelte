<script lang="ts">
	let { children } = $props();
</script>

<div class="h-[calc(100dvh-var(--pwa-safe-top))] overflow-hidden bg-[#f7f7f8] text-plum">
	{@render children()}
</div>
