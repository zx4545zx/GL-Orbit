<script lang="ts">
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { buildCanonicalUrl } from '$lib/seo.js';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
	const lang = $derived(page.data.lang === 'en' ? 'en' : 'th');
	const locale = $derived(lang === 'th' ? 'th-TH' : 'en-US');
	const canonical = $derived(buildCanonicalUrl(page.url.origin, lang, `/news/${data.news.slug}`));
	const published = $derived(data.news.publishedAt ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(data.news.publishedAt)) : '');
</script>

<svelte:head><title>{data.localized.title} | GL-Orbit</title><meta name="description" content={data.localized.content.slice(0, 160)} /><link rel="canonical" href={canonical} /></svelte:head>

<main class="mx-auto grid w-full max-w-4xl gap-8 py-8 md:grid-cols-[minmax(0,1fr)_15rem] md:py-14">
	<article class="min-w-0">
		<a href={`/${lang}/whats-on`} class="text-sm font-semibold text-[var(--orbit-link)]">← {m.news_back_to_whats_on()}</a>
		<p class="mt-6 text-sm text-[var(--orbit-muted)]">{published}</p>
		<h1 class="mt-2 font-[var(--orbit-font-display)] text-4xl font-bold leading-tight md:text-5xl">{data.localized.title}</h1>
		<div class="mt-8 whitespace-pre-wrap text-base leading-8 text-[var(--orbit-ink)]">{data.localized.content}</div>
		{#if data.news.sourceUrl}<p class="mt-8 text-sm text-[var(--orbit-muted)]">{m.news_source()} <a href={data.news.sourceUrl} target="_blank" rel="noopener noreferrer" class="underline">{data.news.sourceName ?? data.news.sourceUrl}</a></p>{/if}
	</article>
	{#if data.news.coverImageUrl}<aside><div class="aspect-[3/4] overflow-hidden rounded-[var(--orbit-radius-surface)] border border-[var(--orbit-line)] bg-[var(--orbit-paper-deep)]"><Picture src={data.news.coverImageUrl} type="posters" sizes="(min-width: 768px) 15rem, 75vw" alt={data.localized.title} class="h-full w-full object-cover" /></div></aside>{/if}
</main>
