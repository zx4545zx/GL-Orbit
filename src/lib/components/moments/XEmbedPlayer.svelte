<script lang="ts">
	import { onMount } from 'svelte';
	import { loadXWidgets } from '$lib/x-widgets.js';
	let { tweetId, source, lazy = false }: { tweetId: string; source: string; lazy?: boolean } = $props();
	let container = $state<HTMLDivElement>();
	let loading = $state(false);
	let loaded = $state(false);
	let failed = $state(false);

	onMount(() => {
		let rendered = false;
		const render = async () => {
			if (rendered || !container) return;
			rendered = true; loading = true;
			try { const twttr = await loadXWidgets(); container.replaceChildren(); await twttr.widgets.createTweet(tweetId, container, { theme: 'light', dnt: true, conversation: 'none', align: 'center' }); loaded = true; }
			catch { failed = true; }
			finally { loading = false; }
		};
		if (!lazy) { void render(); return; }
		const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { observer.disconnect(); void render(); } }, { rootMargin: '600px 0px', threshold: 0 });
		if (container) observer.observe(container);
		return () => observer.disconnect();
	});
</script>

<div class="x-widget-media relative mx-auto min-h-52 max-w-[550px]">
	<div bind:this={container}></div>
	{#if !loaded}<div class="absolute inset-0 grid min-h-52 place-items-center rounded-2xl bg-[#f6f3f6] text-sm text-plum-light">{#if failed}<a href={source} target="_blank" rel="noreferrer" class="halo-focus-ring font-medium text-coral-dark">เปิดโพสต์บน X</a>{:else if loading}กำลังโหลดโพสต์…{:else}โพสต์จาก X{/if}</div>{/if}
</div>

<style>
	.x-widget-media :global(.twitter-tweet),
	.x-widget-media :global(.twitter-tweet-rendered),
	.x-widget-media :global(iframe) {
		display: block !important;
		margin: 0 !important;
		max-width: 100% !important;
		width: 100% !important;
	}
</style>
