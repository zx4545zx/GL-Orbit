<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import MomentCard from './MomentCard.svelte';
	import type { HaloMoment } from './types.js';
	let { moments, expanded = false }: { moments: HaloMoment[]; expanded?: boolean } = $props();
</script>
<div class="space-y-4" aria-live="polite">{#if moments.length}{#each moments as moment (moment.id)}<MomentCard {moment} {expanded} />{/each}<button type="button" class="mx-auto block rounded-xl border border-lavender/30 bg-white/70 px-4 py-2.5 text-sm font-bold text-plum transition hover:border-lavender">{m.halo_load_more()}</button>{:else}<p class="rounded-2xl bg-white/70 p-8 text-center text-plum-light">{m.halo_no_moments()}</p>{/if}</div>
