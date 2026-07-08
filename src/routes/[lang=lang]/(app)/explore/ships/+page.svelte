<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { buildBreadcrumbJsonLd, buildCanonicalUrl, buildWebPageJsonLd, jsonLdScript, safeJsonLd } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { ShipListItem } from '$lib/server/ships/listing.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let extraShips = $state<ShipListItem[]>([]);
	let searchQuery = $state(data.filters.search);
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');

	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalPath = '/explore/ships';
	const SEO_TITLE = m.explore_ships_seo_title();
	const SEO_DESCRIPTION = m.explore_ships_seo_description();
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const jsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, `/${currentLang}${canonicalPath}`, SEO_TITLE, SEO_DESCRIPTION, currentLang),
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: m.nav_home(), path: `/${currentLang}` },
			{ name: m.nav_explore(), path: `/${currentLang}/explore/series` },
			{ name: m.nav_ships(), path: `/${currentLang}${canonicalPath}` }
		])
	]));

	const allShips = $derived([...data.ships.items, ...extraShips]);
	const total = $derived(data.ships.total);
	const currentPage = $derived(data.ships.page + Math.floor(extraShips.length / data.ships.limit));
	const hasMore = $derived(allShips.length < total);

	$effect(() => {
		extraShips = [];
		searchQuery = data.filters.search;
		loadMoreError = '';
		loading = false;
	});

	function buildUrl(search: string): string {
		const params = new URLSearchParams();
		if (search.trim()) params.set('search', search.trim());
		const query = params.toString();
		const base = `/${page.data.lang}/explore/ships`;
		return query ? `${base}?${query}` : base;
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	function scheduleSearchUpdate() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(async () => {
			const target = buildUrl(searchQuery);
			if (target !== page.url.pathname + page.url.search) {
				loading = true;
				await goto(target, { replaceState: true, noScroll: true, keepFocus: true });
			}
		}, 500);
	}
	function clearSearch() {
		clearTimeout(searchTimer);
		searchQuery = '';
		goto(buildUrl(''), { replaceState: true, noScroll: true, keepFocus: true });
	}
	async function loadMore() {
		if (!hasMore || loadMoreLoading) return;
		loadMoreLoading = true;
		loadMoreError = '';
		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('page', String(currentPage + 1));
			const response = await fetch(`/api/explore/ships?${params.toString()}`);
			if (!response.ok) throw new Error('load-more-failed');
			const result = await response.json() as { items: ShipListItem[] };
			extraShips = [...extraShips, ...result.items];
		} catch {
			loadMoreError = m.series_load_error();
		} finally {
			loadMoreLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{SEO_TITLE}</title>
	<meta name="description" content={SEO_DESCRIPTION} />
	<link rel="canonical" href={canonicalUrl} />
	{@html jsonLdScript(jsonLd)}
</svelte:head>

<section class="space-y-6">
	<div class="glass-card rounded-[1.75rem] p-4">
		<label class="sr-only" for="explore-ship-search">ค้นหา Ships</label>
		<div class="relative">
			<input id="explore-ship-search" bind:value={searchQuery} oninput={scheduleSearchUpdate} type="search" placeholder="ค้นหา Ships หรือศิลปิน..." class="w-full rounded-2xl border border-white/70 bg-white/80 px-5 py-3 pr-12 text-plum placeholder:text-plum-light/60 focus:outline-none focus:ring-2 focus:ring-coral/40" />
			{#if searchQuery}<button type="button" onclick={clearSearch} class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-plum-light hover:bg-coral/10" aria-label={m.common_search_clear()}>×</button>{/if}
		</div>
	</div>

	{#if loading}<p class="text-center text-plum-light">{m.common_loading()}</p>{/if}

	{#if allShips.length > 0}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each allShips as ship (ship.id)}
				<a href="/{page.data.lang}/ships/{ship.slug}" class="glass-card overflow-hidden rounded-[1.5rem] transition hover:-translate-y-1 hover:shadow-lg">
					<Picture src={ship.imageUrl} type="posters" alt={ship.name} class="aspect-[4/3] w-full object-cover" />
					<div class="space-y-2 p-4">
						<h2 class="font-[family-name:var(--font-display)] text-xl font-bold text-plum">{ship.name}</h2>
						<p class="text-sm text-plum-light">{ship.artist1.name} × {ship.artist2.name}</p>
						<p class="text-xs text-plum-light">{ship.seriesCount} ผลงานร่วมกัน</p>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="glass-card rounded-[1.5rem] p-8 text-center text-plum-light">ไม่พบ Ships ที่ตรงกับการค้นหา</div>
	{/if}

	{#if hasMore}
		<div class="text-center">
			<button type="button" onclick={loadMore} disabled={loadMoreLoading} class="touch-target rounded-full bg-gradient-to-r from-coral to-coral-dark px-6 py-3 font-semibold text-white shadow-lg shadow-coral/25 disabled:opacity-60">
				{loadMoreLoading ? m.common_loading() : m.common_load_more()}
			</button>
			{#if loadMoreError}<p class="mt-3 text-sm text-coral-dark">{loadMoreError}</p>{/if}
		</div>
	{/if}
</section>
