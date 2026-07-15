<script lang="ts">
	import { page } from '$app/state';
	import MomentComposer from '$lib/components/moments/MomentComposer.svelte';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { toProfileMoment } from '$lib/components/moments/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const feed = $derived(data.moments.map((moment) => toProfileMoment(moment, page.data.lang)));
	const homeLabel = $derived(page.data.lang === 'th' ? 'หน้าแรก' : 'Home');
	const followingLabel = $derived(page.data.lang === 'th' ? 'กำลังติดตาม' : 'Following');
	const paginationQuery = $derived.by(() => {
		const params = new URLSearchParams();
		if (data.filters.seriesId) params.set('seriesId', data.filters.seriesId);
		if (data.filters.artistId) params.set('artistId', data.filters.artistId);
		if (data.filters.shipId) params.set('shipId', data.filters.shipId);
		return params.toString();
	});
</script>

<svelte:head><title>Orbit Halo · GL-Orbit</title></svelte:head>

<div class="border-b border-[#eee9ef] bg-white px-4">
	<div class="mx-auto flex max-w-xs justify-between text-sm font-bold">
		<div class="relative px-2 py-3.5 text-plum" aria-current="page">{homeLabel}<span class="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-coral"></span></div>
		<div class="px-2 py-3.5 text-plum-light">{followingLabel}</div>
	</div>
</div>
<div id="compose" class="scroll-mt-20 border-b border-[#eee9ef]"><MomentComposer seriesOptions={data.seriesOptions} /></div>
<MomentFeed moments={feed} initialCursor={data.nextCursor} {paginationQuery} />
