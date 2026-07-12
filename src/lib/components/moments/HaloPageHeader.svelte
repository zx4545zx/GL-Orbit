<script lang="ts">
	import HaloIcon from './HaloIcon.svelte';
	let { kicker, title, description, icon = 'spark', meta }: { kicker: string; title: string; description?: string; icon?: string; meta?: string } = $props();
</script>

<header class="border-b border-[#eee9ef] px-4 py-4 sm:px-5">
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0">
			<div class="flex items-center gap-2"><span class="text-coral-dark"><HaloIcon name={icon} size={16} /></span><span class="text-[11px] font-medium text-plum-light">{kicker}</span></div>
			<h1 class="mt-1 font-display text-xl font-extrabold tracking-tight text-plum">{title}</h1>
			{#if description}<p class="mt-1 max-w-lg text-sm leading-5 text-plum-light">{description}</p>{/if}
		</div>
		{#if meta}<span class="shrink-0 rounded-full border border-[#eee9ef] px-3 py-1.5 text-[10px] font-medium text-plum-light">{meta}</span>{/if}
	</div>
</header>
