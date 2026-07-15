<script lang="ts">
	import { page } from '$app/state';
	import MomentComposer from '$lib/components/moments/MomentComposer.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const thai = $derived(page.data.lang === 'th');
	const feedHref = $derived(`/${page.data.lang}/halo`);
</script>

<svelte:head><title>{thai ? 'สร้าง Moment · Orbit Halo' : 'Create Moment · Orbit Halo'}</title></svelte:head>

<header class="sticky top-[var(--pwa-safe-top)] z-30 flex items-center gap-4 border-b border-[#eee9ef] bg-white/95 px-4 py-3 backdrop-blur-md">
	<a href={feedHref} class="halo-focus-ring grid h-10 w-10 place-items-center rounded-full hover:bg-plum/[.05]" aria-label={thai ? 'ยกเลิก' : 'Cancel'}>×</a>
	<h1 class="font-display text-lg font-extrabold">{thai ? 'สร้าง Moment' : 'Create Moment'}</h1>
</header>

<MomentComposer
	seriesOptions={data.seriesOptions}
	initialBody={data.initialBody}
	initialUrl={data.initialUrl}
	successHref={feedHref}
/>
