<script lang="ts">
	import { page } from '$app/state';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { toProfileMoment } from '$lib/components/moments/types.js';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
	const displayName = $derived(data.profile.displayName || data.profile.username);
	const initial = $derived(displayName.trim().charAt(0).toUpperCase() || '✦');
	const moments = $derived(data.moments.map((moment) => toProfileMoment(moment, page.data.lang)));
	const number = $derived(new Intl.NumberFormat(page.data.lang === 'th' ? 'th-TH' : 'en', { notation: 'compact', maximumFractionDigits: 1 }));
</script>

<header class="border-b border-[#eee9ef] bg-white">
	<div class="relative">
		{#if data.profile.coverUrl}<img src={data.profile.coverUrl} alt="" class="h-28 w-full object-cover" />{:else}<div class="h-28 bg-[#f4edf4]"></div>{/if}
	</div>
	<div class="px-4 pb-4 sm:px-5">
		<div class="-mt-10 flex items-end">
			{#if data.profile.avatarUrl}<img src={data.profile.avatarUrl} alt="" class="relative z-10 h-20 w-20 rounded-full border-4 border-white object-cover" />{:else}<div class="relative z-10 grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-lavender/30 text-xl font-bold">{initial}</div>{/if}
		</div>
		<h1 class="mt-3 font-display text-xl font-extrabold">{displayName}</h1><p class="text-sm text-plum-light">@{data.profile.username}</p>
		<div class="mt-3 flex gap-5 text-sm"><span><strong>{number.format(data.profile.momentCount)}</strong> <span class="text-plum-light">Moments</span></span><span><strong>{number.format(data.profile.glowCount)}</strong> <span class="text-plum-light">Glow</span></span></div>
	</div>
	<div class="relative py-3 text-center text-sm font-bold">Moments<span class="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-coral"></span></div>
</header>
<MomentFeed {moments} initialCursor={data.nextCursor} authorId={data.profile.id} />
