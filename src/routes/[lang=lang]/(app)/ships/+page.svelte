<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ImageListingCard from '$lib/components/ImageListingCard.svelte';
	import ListingSearch from '$lib/components/ListingSearch.svelte';
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

<div class="py-6 sm:py-8 max-w-6xl mx-auto" aria-busy={loading}>
	<div class="text-center mb-6 sm:mb-8">
		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			<span class="text-gradient">คู่จิ้น</span> ทั้งหมด
		</h1>
		<p class="text-sm sm:text-base text-plum-light">รวม Ships คู่จิ้น GL พร้อมศิลปินและผลงานร่วมกัน</p>
	</div>

	<div class="mb-6 sm:mb-8">
		<ListingSearch bind:value={searchQuery} placeholder="ค้นหาชื่อคู่จิ้นหรือศิลปิน..." ariaLabel="ค้นหา Ships" oninput={scheduleSearchUpdate} onclear={clearSearch} />
	</div>

	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
		{#if loading}
			{#each Array(8) as _, i (i)}
				<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
					<div class="relative aspect-[3/4] overflow-hidden">
						<div class="absolute inset-0 bg-lavender/10 animate-pulse"></div>
						<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5 space-y-2">
							<div class="h-3 w-1/2 bg-white/20 rounded animate-pulse"></div>
							<div class="h-5 w-3/4 bg-white/30 rounded animate-pulse"></div>
							<div class="h-3 w-2/3 bg-white/20 rounded animate-pulse"></div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			{#each allShips as ship (ship.id)}
				<ImageListingCard
					href={`/${page.data.lang}/ships/${ship.slug}`}
					image={ship.imageUrl}
					title={ship.name}
					subtitle={`${ship.artist1.name} × ${ship.artist2.name}`}
					eyebrow={`${ship.seriesCount} ผลงานร่วมกัน`}
					badgeText={ship.isFeatured ? 'Featured' : ''}
					badgeClass="bg-coral/10 text-coral-dark"
					chips={ship.hashtags.slice(0, 2).map((tag) => `#${tag}`)}
					alt={ship.name}
				/>
			{/each}
		{/if}
	</div>

	{#if !loading && allShips.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบ Ships</h3>
			<p class="text-sm text-plum-light">ลองค้นหาด้วยคำอื่น หรือกลับมาดูใหม่ภายหลัง</p>
		</div>
	{/if}

	{#if !loading && hasMore}
		<div class="text-center mt-8 sm:mt-10">
			<button type="button" onclick={loadMore} disabled={loadMoreLoading} class="px-8 py-3 rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all text-sm sm:text-base touch-target disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 mx-auto">
				{loadMoreLoading ? m.common_loading() : m.common_load_more()}
			</button>
			{#if loadMoreError}<p class="mt-3 text-sm text-coral-dark">{loadMoreError}</p>{/if}
		</div>
	{/if}
</div>
