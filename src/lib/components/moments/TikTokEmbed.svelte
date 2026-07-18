<script lang="ts">
	let { postId, postUrl, title, poster = null }: { postId: string; postUrl: string; title: string; poster?: string | null } = $props();
	let activated = $state(false);
	let warmedUp = $state(false);

	function warmup() {
		if (warmedUp) return;
		warmedUp = true;
		if (document.querySelector('link[rel="preconnect"][href="https://www.tiktok.com"]')) return;
		const link = document.createElement('link');
		link.rel = 'preconnect'; link.href = 'https://www.tiktok.com'; link.crossOrigin = 'anonymous';
		document.head.appendChild(link);
	}
</script>

<div class="max-w-[420px] overflow-hidden rounded-2xl border border-[#ded8df] bg-black">
	{#if activated}
		<iframe src={`https://www.tiktok.com/player/v1/${postId}?autoplay=1&controls=1&description=0&music_info=0&rel=0`} {title} class="block aspect-[9/16] w-full border-0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
	{:else}
		<button type="button" onclick={() => { warmup(); activated = true; }} onmouseenter={warmup} onfocus={warmup} ontouchstart={warmup} class="halo-focus-ring group relative block aspect-[9/16] w-full bg-black" aria-label={`เล่น ${title}`}>
			{#if poster}<img src={poster} alt="" loading="lazy" decoding="async" class="h-full w-full object-contain" />{:else}<span class="grid h-full place-items-center bg-plum text-5xl text-white">♪</span>{/if}
			<span class="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-2xl text-white transition group-hover:scale-110">▶</span>
		</button>
	{/if}
	<a href={postUrl} target="_blank" rel="noreferrer" class="halo-focus-ring flex items-center justify-between border-t border-white/10 bg-white px-4 py-3 text-xs"><span class="font-medium text-plum">เปิดดูที่ต้นฉบับ</span><span class="text-coral-dark">TikTok ↗</span></a>
</div>
