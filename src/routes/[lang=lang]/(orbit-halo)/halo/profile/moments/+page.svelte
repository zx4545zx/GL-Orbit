<script lang="ts">
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { toProfileMoment } from '$lib/components/moments/types.js';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
	const displayName = $derived(data.profile.displayName || data.profile.username);
	const initial = $derived(displayName.trim().charAt(0).toUpperCase() || '✦');
	const profileMoments = $derived(data.moments.map(toProfileMoment));
</script>

<header class="border-b border-[#eee9ef] bg-white">
	{#if data.profile.coverUrl}<img src={data.profile.coverUrl} alt="" class="h-28 w-full object-cover" />{:else}<div class="h-28 bg-[#f4edf4]"></div>{/if}
	<div class="px-4 pb-4 sm:px-5">
		<div class="-mt-10 flex items-end justify-between">{#if data.profile.avatarUrl}<img src={data.profile.avatarUrl} alt="" class="h-20 w-20 rounded-full border-4 border-white object-cover" />{:else}<div class="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-coral/20 text-xl font-bold text-coral-dark">{initial}</div>{/if}<a href={`/${data.lang}/profile`} class="halo-focus-ring mb-1 rounded-full border border-[#ded8df] px-4 py-2 text-xs font-bold hover:bg-[#fafafa]">แก้ไขโปรไฟล์</a></div>
		<h1 class="mt-3 font-display text-xl font-extrabold">{displayName}</h1><p class="text-sm text-plum-light">@{data.profile.username}</p>
	</div>
	<div class="relative py-3 text-center text-sm font-bold">Moments<span class="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-coral"></span></div>
</header>
<MomentFeed moments={profileMoments} initialCursor={data.nextCursor} authorId={data.profile.id} />
