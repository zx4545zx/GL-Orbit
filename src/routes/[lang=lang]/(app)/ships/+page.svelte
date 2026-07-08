<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { buildCanonicalUrl, jsonLdScript, localizedPath } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { ShipListItem } from '$lib/server/ships/listing.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let extraShips = $state<ShipListItem[]>([]);
	let loadedPage = $state<number | null>(null);
	let searchQuery = $state('');
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');
	let loadMoreController: AbortController | null = null;

	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, data.seo.canonicalPath));
	const localizedJsonLd = $derived(data.seo.jsonLd.replaceAll(`${page.url.origin}/ships`, `${page.url.origin}${localizedPath(currentLang, '/ships')}`));
	const allShips = $derived([...data.ships.items, ...extraShips]);
	const total = $derived(data.ships.total);
	const currentPage = $derived(loadedPage ?? data.ships.page);
	const hasMore = $derived(allShips.length < total);

	$effect(() => {
		if (loadMoreController) {
			loadMoreController.abort();
			loadMoreController = null;
			loadMoreLoading = false;
		}
		extraShips = [];
		loadedPage = null;
		searchQuery = data.filters.search;
		loadMoreError = '';
		loading = false;
	});

	function buildUrl(search: string): string {
		const params = new URLSearchParams();
		if (search.trim()) params.set('search', search.trim());
		const query = params.toString();
		const base = `/${page.data.lang}/ships`;
		return query ? `${base}?${query}` : base;
	}

	async function updateUrl(search: string) {
		if (loadMoreController) {
			loadMoreController.abort();
			loadMoreController = null;
			loadMoreLoading = false;
		}
		const target = buildUrl(search);
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
	$effect(() => () => clearSearchTimer());
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
		if (!hasMore || loadMoreLoading) return;
		loadMoreLoading = true;
		loadMoreError = '';
		loadMoreController = new AbortController();
		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('page', String(currentPage + 1));
			const response = await fetch(`/api/ships?${params.toString()}`, { signal: loadMoreController.signal });
			if (!response.ok) throw new Error('load-more-failed');
			const result = await response.json() as { items: ShipListItem[]; page: number };
			extraShips = [...extraShips, ...result.items];
			loadedPage = result.page;
		} catch (err) {
			if ((err as Error).name !== 'AbortError') loadMoreError = m.series_load_error();
		} finally {
			loadMoreLoading = false;
			loadMoreController = null;
		}
	}
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="robots" content={data.seo.robots} />
	<link rel="canonical" href={canonicalUrl} />
	{@html jsonLdScript(localizedJsonLd)}
</svelte:head>

<section class="space-y-8 pb-12">
	<header class="text-center space-y-3">
		<p class="text-sm font-semibold text-coral-dark uppercase tracking-[0.3em]">Ships</p>
		<h1 class="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-plum">
			<span class="text-gradient">คู่จิ้น</span> ทั้งหมด
		</h1>
		<p class="text-plum-light max-w-2xl mx-auto">รวม Ships คู่จิ้น GL พร้อมศิลปินและผลงานร่วมกัน</p>
	</header>

	<div class="glass-card-strong rounded-[2rem] p-4 sm:p-5 sticky top-4 z-10">
		<label class="sr-only" for="ship-search">ค้นหา Ships</label>
		<div class="relative">
			<input
				id="ship-search"
				bind:value={searchQuery}
				oninput={scheduleSearchUpdate}
				type="search"
				placeholder="ค้นหาชื่อคู่จิ้นหรือศิลปิน..."
				class="w-full rounded-2xl border border-white/70 bg-white/80 px-5 py-4 pr-12 text-plum placeholder:text-plum-light/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-coral/40"
			/>
			{#if searchQuery}
				<button type="button" onclick={clearSearch} class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-plum-light hover:bg-coral/10 hover:text-coral-dark" aria-label={m.common_search_clear()}>×</button>
			{/if}
		</div>
	</div>

	{#if loading}
		<p class="text-center text-plum-light">{m.common_loading()}</p>
	{/if}

	{#if allShips.length > 0}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each allShips as ship (ship.id)}
				<a href="/{page.data.lang}/ships/{ship.slug}" class="glass-card group overflow-hidden rounded-[1.75rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
					<div class="aspect-[4/3] overflow-hidden bg-lavender/10">
						<Picture src={ship.imageUrl} type="posters" alt={ship.name} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
					</div>
					<div class="space-y-3 p-5">
						<div class="flex items-start justify-between gap-3">
							<h2 class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum">{ship.name}</h2>
							{#if ship.isFeatured}<span class="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral-dark">Featured</span>{/if}
						</div>
						<p class="text-sm text-plum-light">{ship.artist1.name} × {ship.artist2.name}</p>
						<p class="text-sm text-plum-light line-clamp-2">{ship.description || 'ยังไม่มีคำอธิบาย'}</p>
						<div class="flex flex-wrap gap-2 text-xs text-plum-light">
							<span class="rounded-full bg-mint/15 px-3 py-1">{ship.seriesCount} ผลงานร่วมกัน</span>
							{#each ship.hashtags.slice(0, 2) as tag}<span class="rounded-full bg-lavender/15 px-3 py-1">#{tag}</span>{/each}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="glass-card rounded-[2rem] p-10 text-center">
			<h2 class="text-2xl font-bold text-plum">ไม่พบ Ships</h2>
			<p class="mt-2 text-plum-light">ลองค้นหาด้วยคำอื่น หรือกลับมาดูใหม่ภายหลัง</p>
		</div>
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
