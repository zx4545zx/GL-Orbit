<script lang="ts">
	let { videoId, source, title, poster = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }: { videoId: string; source: string; title: string; poster?: string } = $props();
	let playing = $state(false);
	let warmedUp = $state(false);

	function warmup() {
		if (warmedUp) return;
		warmedUp = true;
		for (const href of ['https://www.youtube-nocookie.com', 'https://i.ytimg.com']) {
			if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) continue;
			const link = document.createElement('link');
			link.rel = 'preconnect';
			link.href = href;
			link.crossOrigin = 'anonymous';
			document.head.appendChild(link);
		}
	}
</script>

<div class="overflow-hidden rounded-2xl border border-[#ded8df] bg-black">
	<div class="relative aspect-video">
	{#if playing}
		<iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`} {title} class="block h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
	{:else}
		<button type="button" onclick={() => { warmup(); playing = true; }} onmouseenter={warmup} onfocus={warmup} ontouchstart={warmup} class="halo-focus-ring group relative block h-full w-full bg-black" aria-label={`เล่นวิดีโอ ${title}`}>
			<img src={poster} alt="" loading="lazy" decoding="async" class="h-full w-full object-contain" />
			<span class="absolute left-1/2 top-1/2 grid h-12 w-[68px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-[#ff0000] text-2xl text-white transition group-hover:scale-110">▶</span>
		</button>
	{/if}
	</div>
	<a href={source} target="_blank" rel="noreferrer" class="halo-focus-ring flex items-center justify-between border-t border-white/10 bg-white px-4 py-3 text-xs"><span class="font-medium text-plum">เปิดดูที่ต้นฉบับ</span><span class="text-coral-dark">YouTube ↗</span></a>
</div>
