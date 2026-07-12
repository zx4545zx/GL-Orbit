<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { sampleMoments } from '$lib/components/moments/types.js';
	const isThai = $derived(page.data.lang === 'th');
	const displayName = $derived(page.data.user?.username ?? m.halo_guest());
</script>

<header class="border-b border-[#eee9ef] bg-white">
	<div class="h-28 bg-[#f4edf4]"></div>
	<div class="px-4 pb-4 sm:px-5">
		<div class="-mt-10 flex items-end justify-between"><div class="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-coral/20 text-xl font-bold text-coral-dark">{displayName[0]?.toUpperCase() ?? '✦'}</div><a href={`/${page.data.lang}/profile`} class="halo-focus-ring mb-1 rounded-full border border-[#ded8df] px-4 py-2 text-xs font-bold hover:bg-[#fafafa]">{isThai ? 'แก้ไขโปรไฟล์' : 'Edit profile'}</a></div>
		<h1 class="mt-3 font-display text-xl font-extrabold">{displayName}</h1><p class="text-sm text-plum-light">@{page.data.user?.username ?? 'guest'}</p><p class="mt-3 text-sm">{isThai ? 'นักสะสมโมเมนต์อบอุ่น' : 'Collecting soft scenes.'}</p>
		<div class="mt-3 flex gap-5 text-sm"><span><strong>12</strong> <span class="text-plum-light">Moments</span></span><span><strong>248</strong> <span class="text-plum-light">Glow</span></span></div>
	</div>
	<div class="relative py-3 text-center text-sm font-bold">{m.halo_profile_title()}<span class="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-coral"></span></div>
</header>
<MomentFeed moments={[sampleMoments[0]]} />
