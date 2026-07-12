<script lang="ts">
	import { page } from '$app/state';
	import MomentComposer from '$lib/components/moments/MomentComposer.svelte';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { toProfileMoment } from '$lib/components/moments/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const feed = $derived(data.moments.map((moment) => toProfileMoment(moment, page.data.lang)));
	const homeLabel = $derived(page.data.lang === 'th' ? 'หน้าแรก' : 'Home');
	const paginationQuery = $derived.by(() => {
		const params = new URLSearchParams();
		if (data.filters.seriesId) params.set('seriesId', data.filters.seriesId);
		if (data.filters.artistId) params.set('artistId', data.filters.artistId);
		if (data.filters.shipId) params.set('shipId', data.filters.shipId);
		return params.toString();
	});
</script>

<svelte:head><title>Orbit Halo · GL-Orbit</title></svelte:head>

<div class="relative border-b border-[#eee9ef] bg-white px-4 py-3.5 text-center text-sm font-bold text-plum">
	{homeLabel}<span class="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-coral"></span>
</div>
<div id="compose" class="scroll-mt-20 border-b border-[#eee9ef]"><MomentComposer /></div>
<MomentFeed moments={feed} initialCursor={data.nextCursor} {paginationQuery} />
