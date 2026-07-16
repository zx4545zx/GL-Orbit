<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ImageListingCard from '$lib/components/ImageListingCard.svelte';
	import ListingSearch from '$lib/components/ListingSearch.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { buildBreadcrumbJsonLd, buildCanonicalUrl, buildWebPageJsonLd, jsonLdScript, safeJsonLd } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { ShipListItem } from '$lib/server/ships/listing.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let extraShips = $state<ShipListItem[]>([]);
	let searchQuery = $state('');
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
	<ListingSearch bind:value={searchQuery} placeholder="ค้นหา Ships หรือศิลปิน..." ariaLabel="ค้นหา Ships" oninput={scheduleSearchUpdate} onclear={clearSearch} />

	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" aria-busy={loading}>
		{#if loading}
			{#each Array(8) as _, i (i)}
				<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
					<div class="relative aspect-[3/4] overflow-hidden">
						<div class="absolute inset-0 bg-lavender/10 animate-pulse"></div>
					</div>
				</div>
			{/each}
		{:else}
			{#each allShips as ship (ship.id)}
				<ImageListingCard
					href={`/${page.data.lang}/ships/${ship.slug}`}
					image={ship.hasImage ? ship.imageUrl : ship.artist1.imageUrl}
					secondaryImage={ship.hasImage ? '' : ship.artist2.imageUrl}
					imageType={ship.hasImage ? 'posters' : 'profiles'}
					title={ship.name}
					subtitle={`${ship.artist1.name} × ${ship.artist2.name}`}
					eyebrow={`${ship.seriesCount} ผลงานร่วมกัน`}
					badgeText={ship.isFeatured ? 'Featured' : ''}
					badgeClass="bg-coral/10 text-coral-dark"
					chips={ship.hashtags.slice(0, 2).map((tag) => `#${tag}`)}
					alt={ship.hasImage ? ship.name : ship.artist1.name}
					secondaryAlt={ship.hasImage ? '' : ship.artist2.name}
				/>
			{/each}
		{/if}
	</div>

	{#if !loading && allShips.length === 0}
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
