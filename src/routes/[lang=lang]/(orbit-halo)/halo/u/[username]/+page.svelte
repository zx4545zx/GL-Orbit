<script lang="ts">
	import { page } from '$app/state';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { sampleMoments } from '$lib/components/moments/types.js';
	const isThai = $derived(page.data.lang === 'th');
</script>

<header class="border-b border-[#eee9ef] bg-white">
	<div class="h-28 bg-[#f4edf4]"></div>
	<div class="px-4 pb-4 sm:px-5">
		<div class="-mt-10 flex items-end justify-between"><div class="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-lavender/30 text-xl font-bold">M</div><button class="halo-focus-ring mb-1 rounded-full bg-plum px-5 py-2 text-xs font-bold text-white hover:bg-plum-light">{isThai ? 'ติดตาม' : 'Follow'}</button></div>
		<h1 class="mt-3 font-display text-xl font-extrabold">Mali S.</h1><p class="text-sm text-plum-light">@maliscene</p><p class="mt-3 text-sm leading-5">{isThai ? 'เก็บทุกสายตาและซีนอบอุ่นที่อยากกลับมาดูอีกครั้ง ✦' : 'Collecting every quiet look and soft scene worth returning to. ✦'}</p>
		<div class="mt-3 flex gap-5 text-sm"><span><strong>12</strong> <span class="text-plum-light">Moments</span></span><span><strong>2.4k</strong> <span class="text-plum-light">Glow</span></span></div>
	</div>
	<div class="relative py-3 text-center text-sm font-bold">Moments<span class="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-coral"></span></div>
</header>
<MomentFeed moments={[sampleMoments[0]]} />
