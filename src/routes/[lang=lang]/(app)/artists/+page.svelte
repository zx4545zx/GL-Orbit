<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';
import ImageListingCard from '$lib/components/ImageListingCard.svelte';
import ListingSearch from '$lib/components/ListingSearch.svelte';

	import { page } from '$app/state';	import { goto } from '$app/navigation';
	import { DEFAULT_OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, absoluteUrl, buildCanonicalUrl, jsonLdScript, localizedPath } from '$lib/seo.js';
	import type { PageData } from './$types.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { ArtistListItem } from '$lib/server/queries/artist-list.js';

	let { data }: { data: PageData } = $props();

	let extraArtists = $state<ArtistListItem[]>([]);
	let searchQuery = $state(data.filters.search);
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');
	let loadMoreController: AbortController | null = null;
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, data.seo.canonicalPath));
	const localizedJsonLd = $derived(data.seo.jsonLd.replaceAll(`${page.url.origin}/artists`, `${page.url.origin}${localizedPath(currentLang, '/artists')}`));

	const allArtists = $derived([...data.artists.items, ...extraArtists]);
	const total = $derived(data.artists.total);
	const currentPage = $derived(data.artists.page + Math.floor(extraArtists.length / data.artists.limit));
	const hasMore = $derived(allArtists.length < total);

	$effect(() => {
		if (loadMoreController) {
			loadMoreController.abort();
			loadMoreController = null;
			loadMoreLoading = false;
		}

		extraArtists = [];
		searchQuery = data.filters.search;
		loadMoreError = '';
		loading = false;
	});

	function buildUrl(search: string): string {
		const params = new URLSearchParams();
		if (search.trim()) params.set('search', search.trim());
		const query = params.toString();
		const base = `/${page.data.lang}/artists`;
		return query ? `${base}?${query}` : base;
	}

	function getCurrentUrl(): string {
		return page.url.pathname + page.url.search;
	}

	async function updateUrl(search: string) {
		if (loadMoreController) {
			loadMoreController.abort();
			loadMoreController = null;
			loadMoreLoading = false;
		}

		const target = buildUrl(search);
		if (target === getCurrentUrl()) return;

		loading = true;
		await goto(target, { replaceState: true, noScroll: true, keepFocus: true });
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	function clearSearchTimer() {
		clearTimeout(searchTimer);
		searchTimer = undefined;
	}

	$effect(() => {
		return () => clearSearchTimer();
	});

	function scheduleSearchUpdate() {
		clearSearchTimer();
		searchTimer = setTimeout(() => {
			searchTimer = undefined;
			updateUrl(searchQuery);
		}, 500);
	}

	function clearSearch() {
		clearSearchTimer();
		searchQuery = '';
		updateUrl('');
	}

	async function loadMore() {
		if (loadMoreLoading || loading) return;
		const controller = new AbortController();
		loadMoreController = controller;
		loadMoreLoading = true;
		loadMoreError = '';

		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('page', String(currentPage + 1));
			const res = await fetch(`/api/artists?${params.toString()}`, { signal: controller.signal });
			if (!res.ok) throw new Error('Load failed');
			const result: { items: ArtistListItem[] } = await res.json();
			extraArtists = [...extraArtists, ...result.items];
		} catch (e) {
			if ((e as Error).name !== 'AbortError') {
				loadMoreError = m.artist_list_load_error();
			}
		} finally {
			loadMoreLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="robots" content={data.seo.robots} />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="GL-Orbit" />
	<meta property="og:title" content={data.seo.ogTitle} />
	<meta property="og:description" content={data.seo.ogDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.seo.ogTitle} />
	<meta name="twitter:description" content={data.seo.ogDescription} />
	{@html jsonLdScript(localizedJsonLd)}
</svelte:head>

<div class="py-8 sm:py-12 max-w-6xl mx-auto" aria-busy={loading}>
	<!-- Title -->
	<div class="mb-8 grid gap-5 border-b border-[var(--orbit-line-strong)] pb-7 sm:mb-10 sm:grid-cols-[1fr_auto] sm:items-end sm:pb-9">
		<div>
			<p class="orbit-index">{m.nav_explore()}</p>
		<h1 class="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			<span>{m.artist_heading_plain()}</span><span class="text-coral">{m.artist_heading_accent()}</span>
		</h1>
		<p class="text-sm sm:text-base text-plum-light">{m.artist_list_subtitle()}</p>
		</div>
	</div>

	<!-- Search -->
	<div class="mb-6 sm:mb-8">
		<ListingSearch bind:value={searchQuery} placeholder={m.artist_search_placeholder()} ariaLabel={m.artist_search_label()} oninput={scheduleSearchUpdate} onclear={clearSearch} />
	</div>

	<!-- Artist Grid -->
	<div class="grid grid-cols-2 min-[440px]:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
		{#if loading}
			{#each Array(8) as _, i (i)}
				<div class="overflow-hidden border border-[var(--orbit-line)] bg-white">
					<div class="relative aspect-[3/4] overflow-hidden">
						<div class="absolute inset-0 bg-lavender/10 animate-pulse"></div>
				</div>
				<div class="space-y-2 p-3"><div class="h-3 w-1/2 rounded bg-lavender/20 animate-pulse"></div><div class="h-4 w-3/4 rounded bg-lavender/30 animate-pulse"></div></div>
				</div>
			{/each}
		{:else}
			{#each allArtists as a (a.id)}
				<ImageListingCard
					href={`/${page.data.lang}/artists/${a.id}`}
					image={a.profileImageUrl}
					imageType="profiles"
					title={a.nickname}
					subtitle={a.fullNameEn ?? ''}
					eyebrow={a.seriesCount > 0 ? m.artist_works_count({ count: a.seriesCount }) : m.artist_no_works()}
					alt={a.nickname}
				/>
			{/each}
		{/if}
	</div>

	<!-- Load More -->
	{#if !loading && hasMore}
		<div class="text-center mt-8 sm:mt-10">
			<button
				onclick={loadMore}
				disabled={loadMoreLoading}
				class="border border-coral px-8 py-3 orbit-action font-semibold transition-all text-sm sm:text-base touch-target disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
			>
				{#if loadMoreLoading}
					<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					{m.common_loading()}
				{:else}
					{m.common_load_more()}
				{/if}
			</button>

			{#if loadMoreError}
				<p class="mt-3 text-sm text-coral-dark" role="alert">{loadMoreError}</p>
			{/if}
		</div>
	{/if}

	<!-- Empty State -->
	{#if !loading && allArtists.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">{m.artist_list_empty_title()}</h3>
			<p class="text-sm text-plum-light">
				{#if searchQuery}
					{m.artist_list_empty_search_prompt()}<button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">{m.common_search_clear()}</button>
				{:else}
					{m.artist_list_empty_category()}
				{/if}
			</p>
		</div>
	{/if}
</div>
