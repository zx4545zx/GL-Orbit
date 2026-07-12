<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import HaloIcon from '$lib/components/moments/HaloIcon.svelte';
	import HaloPageHeader from '$lib/components/moments/HaloPageHeader.svelte';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { sampleMoments } from '$lib/components/moments/types.js';
	let active = $state('all');
	const isThai = $derived(page.data.lang === 'th');
	const filters = $derived([{ id: 'all', label: isThai ? 'ทั้งหมด' : 'All' }, { id: 'series', label: isThai ? 'ซีรีส์' : 'Series' }, { id: 'artists', label: isThai ? 'นักแสดง' : 'Artists' }, { id: 'ships', label: isThai ? 'คู่จิ้น' : 'Ships' }]);
</script>

<HaloPageHeader kicker="Discover" title={m.halo_explore_title()} description={isThai ? 'ค้นหาซีรีส์ นักแสดง คู่จิ้น และแฮชแท็ก' : 'Find series, artists, ships and tags.'} icon="explore" />
<div class="border-b border-[#eee9ef] p-3">
	<label class="flex h-11 items-center gap-3 rounded-full bg-[#f7f7f8] px-4 text-plum-light focus-within:ring-1 focus-within:ring-coral"><HaloIcon name="explore" size={17} /><span class="sr-only">Search</span><input type="search" placeholder={isThai ? 'ค้นหา Orbit Halo' : 'Search Orbit Halo'} class="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
</div>
<div class="halo-scrollbar flex gap-2 overflow-x-auto border-b border-[#eee9ef] px-4 py-3">
	{#each filters as filter}<button onclick={() => (active = filter.id)} class="halo-focus-ring shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium {active === filter.id ? 'border-plum bg-plum text-white' : 'border-[#ded8df] bg-white text-plum'}">{filter.label}</button>{/each}
</div>
<section class="border-b border-[#eee9ef] px-4 py-4">
	<h2 class="font-display text-lg font-bold">{isThai ? 'กำลังได้รับความสนใจ' : 'Trending now'}</h2>
	<div class="mt-3 divide-y divide-[#f2eef3]">
		<a href="#feed" class="block py-2.5"><span class="text-[11px] text-plum-light">Series</span><strong class="block text-sm">#TheSecretOfUs</strong><span class="text-[11px] text-plum-light">316 moments</span></a>
		<a href="#feed" class="block py-2.5"><span class="text-[11px] text-plum-light">Ship</span><strong class="block text-sm">#LingOrm</strong><span class="text-[11px] text-plum-light">428 moments</span></a>
	</div>
</section>
<div id="feed"><MomentFeed moments={sampleMoments} /></div>
