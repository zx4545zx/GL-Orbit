<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import HaloIcon from '$lib/components/moments/HaloIcon.svelte';
	import MomentCard from '$lib/components/moments/MomentCard.svelte';
	import { toProfileMoment } from '$lib/components/moments/types.js';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
	const moment = $derived(toProfileMoment(data.moment, page.data.lang));
</script>

<header class="sticky top-[var(--pwa-safe-top)] z-30 flex items-center gap-5 border-b border-[#eee9ef] bg-white/95 px-3 py-2 backdrop-blur-md"><a href={`/${page.data.lang}/halo`} class="halo-focus-ring grid h-9 w-9 place-items-center rounded-full hover:bg-plum/[.05]" aria-label={m.halo_feed()}><HaloIcon name="arrow-left" size={19} /></a><h1 class="font-display text-lg font-extrabold">{m.halo_detail()}</h1></header>
<div id="comments"><MomentCard {moment} expanded /></div>
