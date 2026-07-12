<script lang="ts">
	import { latestMomentsHref } from '$lib/moments/latest-moments.js';
	let { lang, entity, entityId }: { lang: string; entity: 'series' | 'artist' | 'ship'; entityId: string } = $props();
	const href = $derived(latestMomentsHref(lang, entity, entityId));
</script>

<section class="mt-8 rounded-2xl border border-lavender/20 bg-white/70 p-5 shadow-sm shadow-lavender/10 backdrop-blur-sm">
	<div class="flex flex-wrap items-center justify-between gap-3"><div><p class="text-[10px] font-bold uppercase tracking-[0.22em] text-coral-dark">Orbit Halo</p><h2 class="text-xl font-bold text-plum">Latest Moments</h2></div><a href={href} class="rounded-full bg-plum px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral">ดู Moment ทั้งหมด</a></div>
</section>
