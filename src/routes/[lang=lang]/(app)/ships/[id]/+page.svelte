<script lang="ts">
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { buildCanonicalUrl, jsonLdScript } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, data.seo.canonicalPath));
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={canonicalUrl} />
	{@html jsonLdScript(data.seo.jsonLd)}
</svelte:head>

<article class="space-y-10 pb-12">
	<section class="glass-card-strong overflow-hidden rounded-[2rem]">
		<div class="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="aspect-[16/10] lg:aspect-auto overflow-hidden bg-lavender/10">
				<Picture src={data.ship.imageUrl} type="posters" alt={data.ship.name} class="h-full w-full object-cover" />
			</div>
			<div class="flex flex-col justify-center space-y-5 p-6 sm:p-8 lg:p-10">
				<p class="text-sm font-semibold uppercase tracking-[0.3em] text-coral-dark">Ship</p>
				<h1 class="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-plum">{data.ship.name}</h1>
				<p class="text-lg text-plum-light">{data.ship.artist1.name} × {data.ship.artist2.name}</p>
				{#if data.ship.description}<p class="leading-8 text-plum-light">{data.ship.description}</p>{/if}
				{#if data.ship.hashtags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each data.ship.hashtags as tag}<span class="rounded-full bg-lavender/20 px-3 py-1 text-sm font-semibold text-lavender-dark">#{tag}</span>{/each}
					</div>
				{/if}
			</div>
		</div>
	</section>

	<section class="grid gap-5 sm:grid-cols-2">
		{#each [data.ship.artist1, data.ship.artist2] as artist}
			<a href="/{page.data.lang}/artists/{artist.id}" class="glass-card flex items-center gap-4 rounded-[1.5rem] p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
				<Picture src={artist.imageUrl} type="profiles" alt={artist.name} class="h-20 w-20 rounded-2xl object-cover" />
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-coral-dark">Artist</p>
					<h2 class="text-xl font-bold text-plum">{artist.name}</h2>
					<p class="text-sm text-plum-light">{artist.fullNameTh || artist.fullNameEn}</p>
				</div>
			</a>
		{/each}
	</section>

	<section class="space-y-4">
		<h2 class="font-[family-name:var(--font-display)] text-3xl font-bold text-plum">ผลงานร่วมกัน</h2>
		{#if data.ship.series.length > 0}
			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.ship.series as item}
					<a href="/{page.data.lang}/series/{item.id}" class="glass-card overflow-hidden rounded-[1.5rem] transition hover:-translate-y-1 hover:shadow-lg">
						<Picture src={item.posterUrl} type="posters" alt={item.title} class="aspect-[3/4] w-full object-cover" />
						<div class="p-4">
							<h3 class="font-bold text-plum">{item.title}</h3>
							{#if item.titleTh}<p class="text-sm text-plum-light">{item.titleTh}</p>{/if}
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="glass-card rounded-[1.5rem] p-6 text-plum-light">ยังไม่มีผลงานร่วมกันในระบบ</div>
		{/if}
	</section>
</article>
