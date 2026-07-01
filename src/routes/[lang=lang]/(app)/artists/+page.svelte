<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';

	import { page } from '$app/state';	import { goto } from '$app/navigation';
	import { DEFAULT_OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, absoluteUrl, jsonLdScript } from '$lib/seo.js';
	import type { PageData } from './$types.js';
	import type { ArtistListItem } from '$lib/server/queries/artist-list.js';

	let { data }: { data: PageData } = $props();

	let extraArtists = $state<ArtistListItem[]>([]);
	let searchQuery = $state(data.filters.search);
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');
	let loadMoreController: AbortController | null = null;

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
		return query ? `/artists?${query}` : '/artists';
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
	<link rel="canonical" href={`${page.url.origin}${data.seo.canonicalPath}`} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="GL-Orbit" />
	<meta property="og:title" content={data.seo.ogTitle} />
	<meta property="og:description" content={data.seo.ogDescription} />
	<meta property="og:url" content={`${page.url.origin}${data.seo.canonicalPath}`} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.seo.ogTitle} />
	<meta name="twitter:description" content={data.seo.ogDescription} />
	{@html jsonLdScript(data.seo.jsonLd)}
</svelte:head>

<div class="py-6 sm:py-8 max-w-6xl mx-auto" aria-busy={loading}>
	<!-- Title -->
	<div class="text-center mb-6 sm:mb-8">
		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			<span>{m.artist_heading_plain()}</span><span class="text-coral">{m.artist_heading_accent()}</span>
		</h1>
		<p class="text-sm sm:text-base text-plum-light">{m.artist_list_subtitle()}</p>
	</div>

	<!-- Search -->
	<div class="mb-6 sm:mb-8">
		<div class="relative max-w-xl mx-auto">
			<div class="glass-card-strong rounded-2xl flex items-center px-4 py-3 gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-coral/30 focus-within:border-coral/30">
				<svg class="w-5 h-5 text-plum-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					oninput={scheduleSearchUpdate}
					placeholder={m.artist_search_placeholder()}
					aria-label={m.artist_search_label()}
					class="flex-1 bg-transparent text-plum placeholder:text-plum-light/50 focus:outline-none text-sm sm:text-base"
				/>
				{#if searchQuery}
					<button onclick={clearSearch} class="p-1 rounded-lg hover:bg-lavender/20 transition-colors flex-shrink-0" aria-label={m.common_search_clear()}>
						<svg class="w-4 h-4 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Artist Grid -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
		{#if loading}
			{#each Array(10) as _, i (i)}
				<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden p-4 sm:p-5 text-center">
					<div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-lavender/10 animate-pulse mx-auto mb-3"></div>
					<div class="h-4 w-2/3 bg-lavender/10 rounded animate-pulse mx-auto mb-2"></div>
					<div class="h-3 w-1/2 bg-lavender/10 rounded animate-pulse mx-auto"></div>
				</div>
			{/each}
		{:else}
			{#each allArtists as a (a.id)}
				<a href="/{page.data.lang}/artists/{a.id}" class="group">
					<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/20 transition-all duration-500 hover:-translate-y-2 p-4 sm:p-5 text-center">
						<div class="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3">
							<img src={a.profileImageUrl} alt={a.nickname} width={112} height={112} class="w-full h-full rounded-full object-cover bg-gray-100 group-hover:scale-110 transition-transform duration-700 ring-2 ring-lavender/20" loading="lazy" decoding="async" />
						</div>
						<h3 class="font-semibold text-plum text-sm sm:text-base line-clamp-1">{a.nickname}</h3>
						{#if a.fullNameEn}<p class="text-xs sm:text-sm text-plum-light line-clamp-1 mt-0.5">{a.fullNameEn}</p>{/if}
						{#if a.seriesCount > 0}
							<span class="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-coral/10 text-coral-dark text-[11px] font-semibold">{a.seriesCount} {m.artist_works_label()}</span>
						{:else}
							<span class="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-lavender/10 text-plum-light/70 text-[11px] font-medium">{m.artist_no_works()}</span>
						{/if}
					</div>
				</a>
			{/each}
		{/if}
	</div>

	<!-- Load More -->
	{#if !loading && hasMore}
		<div class="text-center mt-8 sm:mt-10">
			<button
				onclick={loadMore}
				disabled={loadMoreLoading}
				class="px-8 py-3 rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all text-sm sm:text-base touch-target disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 mx-auto"
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
