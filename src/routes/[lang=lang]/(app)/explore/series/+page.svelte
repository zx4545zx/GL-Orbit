<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	import { page } from '$app/state';	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import type { SeriesListItem, SeriesStatusFilter } from '$lib/server/series/listing.js';
	import SeriesPosterCard from '$lib/components/SeriesPosterCard.svelte';

	let { data }: { data: PageData } = $props();

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }
	};

	const filterOptions: { key: SeriesStatusFilter; label: string }[] = [
		{ key: 'ALL', label: m.filter_all() },
		{ key: 'ONGOING', label: m.status_ongoing() },
		{ key: 'UPCOMING', label: m.status_upcoming() },
		{ key: 'ENDED', label: m.status_ended() }
	];

	let extraSeries = $state<SeriesListItem[]>([]);
	let searchQuery = $state(data.filters.search);
	let filterStatus = $state<SeriesStatusFilter>(data.filters.status);
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');

	const allSeries = $derived([...data.series.items, ...extraSeries]);
	const total = $derived(data.series.total);
	const currentPage = $derived(data.series.page + Math.floor(extraSeries.length / data.series.limit));
	const hasMore = $derived(allSeries.length < total);

	// Reset incremental state whenever the SSR data changes (new search/filter/page from URL).
	$effect(() => {
		extraSeries = [];
		searchQuery = data.filters.search;
		filterStatus = data.filters.status;
		loadMoreError = '';
		loading = false;
	});

	function buildUrl(search: string, status: SeriesStatusFilter): string {
		const params = new URLSearchParams();
		if (search.trim()) params.set('search', search.trim());
		if (status !== 'ALL') params.set('status', status.toLowerCase());
		const query = params.toString();
		const base = `/${page.data.lang}/explore/series`;
		return query ? `${base}?${query}` : base;
	}

	async function updateUrl(search: string, status: SeriesStatusFilter) {
		const target = buildUrl(search, status);
		const current = page.url.pathname + page.url.search;
		if (target === current) return;
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
			updateUrl(searchQuery, filterStatus);
		}, 500);
	}

	function updateStatus(status: SeriesStatusFilter) {
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
		loadMoreLoading = true;
		loadMoreError = '';
		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('page', String(currentPage + 1));
			const res = await fetch(`/api/series?${params.toString()}`);
			if (!res.ok) throw new Error('Load failed');
			const result: { items: SeriesListItem[] } = await res.json();
			extraSeries = [...extraSeries, ...result.items];
		} catch {
			loadMoreError = m.load_more_error();
		} finally {
			loadMoreLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.explore_series_seo_title()}</title>
	<meta name="description" content={m.explore_series_seo_description()} />
</svelte:head>

<!-- Search + Filter -->
<div class="flex flex-col gap-3 max-w-xl mx-auto mb-6 sm:mb-8">
	<div class="glass-card-strong rounded-2xl flex items-center px-4 py-3 gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-coral/30 focus-within:border-coral/30">
		<svg class="w-5 h-5 text-plum-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
		<input type="text" bind:value={searchQuery} oninput={scheduleSearchUpdate} placeholder={m.series_search_placeholder()} aria-label={m.series_search_label()} class="flex-1 bg-transparent text-plum placeholder:text-plum-light/50 focus:outline-none text-sm sm:text-base" />
		{#if searchQuery}
			<button onclick={clearSearch} class="p-1 rounded-lg hover:bg-lavender/20 transition-colors flex-shrink-0" aria-label={m.common_search_clear()}><svg class="w-4 h-4 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" /></svg></button>
		{/if}
	</div>

	<!-- Status Filter -->
	<div class="flex justify-center">
		<div class="glass-card rounded-2xl p-1.5 flex gap-1 overflow-x-auto">
			{#each filterOptions as filter}
				<button
					onclick={() => updateStatus(filter.key)}
					aria-pressed={filterStatus === filter.key}
					class="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 touch-target whitespace-nowrap {filterStatus === filter.key ? 'bg-gradient-to-r from-coral to-coral-dark text-white shadow-lg shadow-coral/25' : 'text-plum-light hover:bg-white/60'}"
				>
					{filter.label}
				</button>
			{/each}
		</div>
	</div>
</div>

<!-- Grid -->
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" aria-busy={loading}>
	{#if loading}
		{#each Array(8) as _, i (i)}
			<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
				<div class="relative aspect-[3/4] overflow-hidden bg-lavender/10 animate-pulse"></div>
			</div>
		{/each}
	{:else}
		{#each allSeries as s (s.id)}
			<SeriesPosterCard item={s} />
		{/each}
	{/if}
</div>

<!-- Load More -->
{#if !loading && hasMore}
	<div class="text-center mt-8 sm:mt-10">
		<button onclick={loadMore} disabled={loadMoreLoading} class="px-8 py-3 rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all text-sm sm:text-base touch-target disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 mx-auto">
			{#if loadMoreLoading}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
				{m.common_loading()}
			{:else}
				ดูเพิ่มเติม
			{/if}
		</button>
		{#if loadMoreError}<p class="mt-3 text-sm text-coral-dark" role="alert">{loadMoreError}</p>{/if}
	</div>
{/if}

<!-- Empty State -->
{#if !loading && allSeries.length === 0}
	<div class="text-center py-16">
		<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
			<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
		</div>
		<h3 class="font-semibold text-plum mb-1">{m.series_empty_title()}</h3>
		<p class="text-sm text-plum-light">{#if searchQuery}ลองค้นหาด้วยคำอื่น หรือ <button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">ล้างการค้นหา</button>{:else}ไม่พบซีรีส์ในหมวดหมู่นี้{/if}</p>
	</div>
{/if}
