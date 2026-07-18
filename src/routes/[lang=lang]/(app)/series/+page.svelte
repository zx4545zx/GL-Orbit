<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';
import Picture from '$lib/components/Picture.svelte';

	import { page } from '$app/state';	import { goto } from '$app/navigation';
	import { DEFAULT_OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, absoluteUrl, buildCanonicalUrl, jsonLdScript, localizedPath } from '$lib/seo.js';
	import type { PageData } from './$types.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { FilterKey, SeriesApiResponseItem } from './series.js';

	let { data }: { data: PageData } = $props();

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }
	};

	const filterOptions: { key: FilterKey; label: string }[] = [
		{ key: 'ALL', label: m.filter_all() },
		{ key: 'ONGOING', label: m.status_ongoing() },
		{ key: 'UPCOMING', label: m.status_upcoming() },
		{ key: 'ENDED', label: m.status_ended() }
	];

	let extraSeries = $state<SeriesApiResponseItem[]>([]);
	let loadedPage = $state<number | null>(null);
	let filterStatus = $state<FilterKey>('ALL');
	let searchQuery = $state('');
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');
	let loadMoreController: AbortController | null = null;
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, data.seo.canonicalPath));
	const localizedJsonLd = $derived(data.seo.jsonLd.replaceAll(`${page.url.origin}/series`, `${page.url.origin}${localizedPath(currentLang, '/series')}`));

	const allSeries = $derived([...data.series.items, ...extraSeries]);
	const total = $derived(data.series.total);
	const currentPage = $derived(loadedPage ?? data.series.page);
	const hasMore = $derived(allSeries.length < total);

	$effect(() => {
		if (loadMoreController) {
			loadMoreController.abort();
			loadMoreController = null;
			loadMoreLoading = false;
		}

		extraSeries = [];
		loadedPage = null;
		searchQuery = data.filters.search;
		filterStatus = data.filters.status;
		loadMoreError = '';
		loading = false;
	});

	function buildUrl(search: string, status: string): string {
		const params = new URLSearchParams();
		if (search.trim()) params.set('search', search.trim());
		if (status !== 'ALL') params.set('status', status.toLowerCase());
		const query = params.toString();
		const base = `/${page.data.lang}/series`;
		return query ? `${base}?${query}` : base;
	}

	function getCurrentSeriesUrl(): string {
		return page.url.pathname + page.url.search;
	}

	async function updateUrl(search: string, status: string) {
		// Abort any in-flight Load More to prevent racing
		if (loadMoreController) {
			loadMoreController.abort();
			loadMoreController = null;
			loadMoreLoading = false;
		}

		const target = buildUrl(search, status);
		const current = getCurrentSeriesUrl();

		if (target === current) return;

		loading = true;
		await goto(target, { replaceState: true, noScroll: true, keepFocus: true });
		// $effect reacts to page.url.search change and re-fetches
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
			updateUrl(searchQuery, filterStatus);
		}, 500);
	}

	function updateStatus(status: FilterKey) {
		clearSearchTimer();
		filterStatus = status;
		updateUrl(searchQuery, status);
	}

	function clearSearch() {
		clearSearchTimer();
		searchQuery = '';
		updateUrl('', filterStatus);
	}

	async function loadMore() {
		if (loadMoreLoading || loading) return;
		const controller = new AbortController();
		loadMoreController = controller;
		loadMoreLoading = true;
		loadMoreError = '';

		const currentFilterQuery = page.url.searchParams.toString();

		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('page', String(currentPage + 1));
			const res = await fetch(`/api/series?${params.toString()}`, {
				signal: controller.signal
			});
			if (!res.ok) throw new Error('Load failed');
			const result = await res.json();

			if (controller.signal.aborted) return;
			if (page.url.searchParams.toString() !== currentFilterQuery) return;

			if (result && Array.isArray(result.items)) {
				extraSeries = [...extraSeries, ...result.items];
				loadedPage = result.page;
			}
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') return;
			loadMoreError = m.series_load_error();
		} finally {
			if (loadMoreController === controller) {
				loadMoreLoading = false;
				loadMoreController = null;
			}
		}
	}
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="robots" content={data.seo.robots} />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={data.seo.ogTitle} />
	<meta property="og:description" content={data.seo.ogDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:title" content={data.seo.ogTitle} />
	<meta name="twitter:description" content={data.seo.ogDescription} />
	{@html jsonLdScript(localizedJsonLd)}
</svelte:head>

{#snippet searchFilter()}
	<div class="flex flex-col gap-3 max-w-2xl mx-auto">
		<!-- Search Input -->
		<div class="relative w-full">
			<div class="orbit-surface flex items-center border-x-4 border-x-plum px-4 py-3 gap-3 transition-all duration-200 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-coral">
				<svg class="w-5 h-5 text-plum-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					oninput={scheduleSearchUpdate}
					placeholder={m.series_search_placeholder()}
					aria-label={m.series_search_label()}
					class="flex-1 bg-transparent text-plum placeholder:text-plum-light/50 focus:outline-none text-sm sm:text-base"
				/>
				{#if searchQuery}
					<button
						onclick={clearSearch}
					class="p-1 rounded-md hover:bg-lavender/30 transition-colors flex-shrink-0"
						aria-label={m.common_search_clear()}
					>
						<svg class="w-4 h-4 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<!-- Status Filter -->
		<div class="flex justify-center">
			<div class="orbit-surface flex gap-0 overflow-x-auto">
				{#each filterOptions as filter}
					<button
						onclick={() => updateStatus(filter.key)}
						aria-pressed={filterStatus === filter.key}
						class="border-r border-[var(--orbit-line)] px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 touch-target whitespace-nowrap last:border-r-0 {filterStatus === filter.key ? 'bg-plum text-white' : 'text-plum-light hover:bg-cream'}"
					>
						{filter.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

<div class="py-8 sm:py-12 max-w-6xl mx-auto" aria-busy={loading}>
	<!-- Title -->
	<div class="mb-8 grid gap-5 border-b border-[var(--orbit-line-strong)] pb-7 sm:mb-10 sm:grid-cols-[1fr_auto] sm:items-end sm:pb-9">
		<div>
			<p class="orbit-index">{m.nav_explore()}</p>
		<h1 class="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			<span>{m.series_heading_plain()}</span><span class="text-coral">{m.series_heading_accent()}</span>
		</h1>
		<p class="text-sm sm:text-base text-plum-light">{m.series_subtitle()}</p>
		</div>
	</div>

	<!-- Normal Search & Filter -->
	<div class="mb-6 sm:mb-8">
		{@render searchFilter()}
	</div>

	<!-- Series Grid -->
	<div class="grid grid-cols-2 min-[440px]:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
		{#if loading}
			{#each Array(8) as _, i}
				<div class="overflow-hidden border border-[var(--orbit-line)] bg-white">
					<div class="relative aspect-[3/4] overflow-hidden">
						<div class="absolute inset-0 bg-lavender/10 animate-pulse"></div>
					</div>
					<div class="space-y-2 p-3"><div class="h-3 w-1/2 rounded bg-lavender/20 animate-pulse"></div><div class="h-4 w-3/4 rounded bg-lavender/30 animate-pulse"></div></div>
				</div>
			{/each}
		{:else}
			{#each allSeries as s (s.id)}
				<a href="/{page.data.lang}/series/{s.id}" class="group block h-full focus-visible:outline-offset-4">
					<div class="flex h-full flex-col overflow-hidden border border-[var(--orbit-line)] bg-white transition-[border-color,box-shadow] duration-200 group-hover:border-coral/60 group-hover:shadow-[var(--orbit-shadow)]">
						<div class="relative aspect-[3/4] overflow-hidden">
							<Picture
								src={s.poster}
								type="posters"
								sizes="(max-width: 440px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
								alt={s.title}
								width={400}
								height={533}
								class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
								loading="lazy"
								decoding="async"
							/>
							<div class="absolute top-3 sm:top-4 left-3 sm:left-4">
								<span class="rounded-md px-2 py-1 text-[0.65rem] font-semibold {statusConfig[s.status].class}">
									{statusConfig[s.status].text}
								</span>
							</div>
						</div>
						<div class="min-w-0 flex-1 p-3 sm:p-4">
							<p class="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-coral line-clamp-1">{s.studio}</p>
							<h3 class="min-h-[2.75rem] text-base font-bold leading-snug text-plum line-clamp-2 sm:min-h-[3rem] sm:text-lg">{s.title}</h3>
							<p class="mt-1 text-xs text-plum-light line-clamp-1 sm:text-sm">{s.subtitle}</p>
							{#if s.genres && s.genres.length > 0}
								<div class="mt-2 hidden flex-wrap gap-1 sm:flex">
									{#each s.genres as genre}
										<span class="border border-lavender/50 bg-lavender/20 px-1.5 py-0.5 text-xs font-medium text-plum">{genre.name}</span>
									{/each}
								</div>
							{/if}
						</div>
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
	{#if !loading && allSeries.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">{m.series_empty_title()}</h3>
			<p class="text-sm text-plum-light">
				{#if searchQuery}
					{m.series_empty_search_prompt()}<button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">{m.common_search_clear()}</button>
				{:else}
					{m.series_empty_category()}
				{/if}
			</p>
		</div>
	{/if}
</div>
