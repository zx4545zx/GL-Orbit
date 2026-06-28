<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-dvh bg-[#f7f7f8] text-plum" style="padding-bottom: var(--bottom-nav-reserved-space, 0px);">
	{@render children()}
</div>
