<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { page } from '$app/state';
	import MomentComposer from '$lib/components/moments/MomentComposer.svelte';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { sampleMoments } from '$lib/components/moments/types.js';

	type Tab = 'halo' | 'following';
	let tab = $state<Tab>('halo');
	const feed = $derived(tab === 'following' ? sampleMoments.filter((moment) => moment.following) : sampleMoments);
	const homeLabel = $derived(page.data.lang === 'th' ? 'หน้าแรก' : 'Home');
</script>

<svelte:head><title>Orbit Halo · GL-Orbit</title></svelte:head>

<div class="flex border-b border-[#eee9ef] bg-white" role="tablist" aria-label="Feed filter">
	<button
		onclick={() => (tab = 'halo')}
		aria-selected={tab === 'halo'}
		class="relative flex-1 px-4 py-3.5 text-sm {tab === 'halo' ? 'font-bold text-plum' : 'font-medium text-plum-light hover:bg-[#fafafa]'}"
	>{homeLabel}{#if tab === 'halo'}<span class="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-coral"></span>{/if}</button>
	<button
		onclick={() => (tab = 'following')}
		aria-selected={tab === 'following'}
		class="relative flex-1 px-4 py-3.5 text-center text-sm {tab === 'following' ? 'font-bold text-plum' : 'font-medium text-plum-light hover:bg-[#fafafa]'}"
	>{m.halo_following()}{#if tab === 'following'}<span class="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-coral"></span>{/if}</button>
</div>
<div id="compose" class="scroll-mt-20 border-b border-[#eee9ef]"><MomentComposer /></div>
<MomentFeed moments={feed} />
