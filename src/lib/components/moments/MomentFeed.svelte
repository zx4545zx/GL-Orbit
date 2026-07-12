<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import MomentCard from './MomentCard.svelte';
	import type { HaloMoment } from './types.js';
	let { moments, expanded = false }: { moments: HaloMoment[]; expanded?: boolean } = $props();
</script>

<div aria-live="polite">
	{#if moments.length}
		{#each moments as moment (moment.id)}<MomentCard {moment} {expanded} />{/each}
		<button type="button" class="halo-focus-ring block w-full border-b border-[#eee9ef] bg-white px-4 py-4 text-center text-sm font-medium text-coral-dark transition hover:bg-[#fafafa]">{m.halo_load_more()}</button>
	{:else}
		<div class="border-b border-[#eee9ef] px-6 py-16 text-center"><p class="font-display text-xl font-bold">{m.halo_no_moments()}</p><p class="mt-1 text-sm text-plum-light">The next moment could be yours.</p></div>
	{/if}
</div>
