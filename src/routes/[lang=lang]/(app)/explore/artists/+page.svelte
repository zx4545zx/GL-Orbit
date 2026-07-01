<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	import { page } from '$app/state';	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import type { ArtistListItem } from '$lib/server/queries/artist-list.js';

	let { data }: { data: PageData } = $props();

	// Accent rotation — full literal class strings so Tailwind's scanner can detect them.
	// Compact profile cards keep photos medium-sized while the card itself carries the color.
	const accents = [
		{ frame: 'from-coral via-coral/60 to-lavender', border: 'border-coral/20', orb: 'bg-coral/25', chip: 'bg-coral/10 text-coral-dark', dot: 'bg-mint', glow: 'group-hover:shadow-coral/25' },
		{ frame: 'from-lavender via-lavender/60 to-mint', border: 'border-lavender/25', orb: 'bg-lavender/30', chip: 'bg-lavender/15 text-lavender-dark', dot: 'bg-coral', glow: 'group-hover:shadow-lavender/30' },
		{ frame: 'from-mint via-mint/60 to-coral', border: 'border-mint/25', orb: 'bg-mint/30', chip: 'bg-mint/15 text-mint-dark', dot: 'bg-lavender-dark', glow: 'group-hover:shadow-mint/30' }
	] as const;

	const cuteIcons = [
		{ label: m.artist_filter_heart(), path: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 4.876 9.623 3.75 7.688 3.75 5.099 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
		{ label: m.artist_filter_star(), path: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557L3.04 10.385a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z' },
		{ label: m.artist_filter_sparkle(), path: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.091-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.091L9 5.25l.813 2.846a4.5 4.5 0 003.091 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.091zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z' }
	] as const;

	let extraArtists = $state<ArtistListItem[]>([]);
	let searchQuery = $state(data.filters.search);
	let loading = $state(false);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');

	const allArtists = $derived([...data.artists.items, ...extraArtists]);
	const total = $derived(data.artists.total);
	const currentPage = $derived(data.artists.page + Math.floor(extraArtists.length / data.artists.limit));
	const hasMore = $derived(allArtists.length < total);

	$effect(() => {
		extraArtists = [];
		searchQuery = data.filters.search;
		loadMoreError = '';
		loading = false;
	});

	function buildUrl(search: string): string {
		const params = new URLSearchParams();
		if (search.trim()) params.set('search', search.trim());
		const query = params.toString();
		const base = `/${page.data.lang}/explore/artists`;
		return query ? `${base}?${query}` : base;
	}

	async function updateUrl(search: string) {
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
		loadMoreLoading = true;
		loadMoreError = '';
		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('page', String(currentPage + 1));
			const res = await fetch(`/api/artists?${params.toString()}`);
			if (!res.ok) throw new Error('Load failed');
			const result: { items: ArtistListItem[] } = await res.json();
			extraArtists = [...extraArtists, ...result.items];
		} catch {
			loadMoreError = m.load_more_error();
		} finally {
			loadMoreLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.explore_artists_seo_title()}</title>
	<meta name="description" content={m.explore_artists_seo_description()} />
</svelte:head>

<!-- Search -->
<div class="max-w-xl mx-auto mb-6 sm:mb-8">
	<div class="glass-card-strong rounded-2xl flex items-center px-4 py-3 gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-coral/30 focus-within:border-coral/30">
		<svg class="w-5 h-5 text-plum-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
		<input type="text" bind:value={searchQuery} oninput={scheduleSearchUpdate} placeholder={m.artist_search_placeholder()} aria-label={m.artist_search_label()} class="flex-1 bg-transparent text-plum placeholder:text-plum-light/50 focus:outline-none text-sm sm:text-base" />
		{#if searchQuery}
			<button onclick={clearSearch} class="p-1 rounded-lg hover:bg-lavender/20 transition-colors flex-shrink-0" aria-label={m.common_search_clear()}><svg class="w-4 h-4 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" /></svg></button>
		{/if}
	</div>
</div>

<!-- Artist Grid — compact colorful profile cards (not full-bleed photos) -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4" aria-busy={loading}>
	{#if loading}
		{#each Array(9) as _, i (i)}
			<div class="glass-card rounded-3xl p-3 sm:p-4 animate-pulse">
				<div class="flex items-center gap-3 sm:gap-4">
					<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-lavender/10 shrink-0"></div>
					<div class="flex-1 min-w-0 space-y-2">
						<div class="h-4 w-2/3 bg-lavender/10 rounded"></div>
						<div class="h-3 w-1/2 bg-lavender/10 rounded"></div>
						<div class="h-5 w-20 bg-lavender/10 rounded-full"></div>
					</div>
				</div>
			</div>
		{/each}
	{:else}
		{#each allArtists as a, i (a.id)}
			{@const accent = accents[i % accents.length]}
			{@const cuteIcon = cuteIcons[i % cuteIcons.length]}
			<a href="/{page.data.lang}/artists/{a.id}" class="group block">
				<div class="glass-card-strong relative overflow-hidden rounded-3xl border {accent.border} bg-white/76 p-3 sm:p-4 shadow-lg shadow-lavender/10 transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-2xl {accent.glow}">
					<div class="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl opacity-80 {accent.orb}"></div>
					<div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/75 via-cream/45 to-transparent"></div>
					<div class="pointer-events-none absolute right-3 top-3 z-10">
						<div class="relative flex h-9 w-9 rotate-[8deg] items-center justify-center rounded-2xl bg-gradient-to-br {accent.frame} text-white shadow-lg shadow-lavender/30 transition-all duration-500 group-hover:rotate-0 group-hover:scale-110" aria-hidden="true">
							<svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={cuteIcon.path} /></svg>
							<span class="absolute -bottom-1 -right-1 h-2 w-2 rounded-full {accent.dot} shadow-[0_0_6px_rgba(110,231,183,0.85)] ring-2 ring-white/85"></span>
						</div>
					</div>

					<div class="relative flex items-center gap-3 sm:gap-4">
						<div class="relative shrink-0 rotate-[4deg] transition-transform duration-500 group-hover:rotate-0">
							<div class="absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br {accent.frame} opacity-65 blur-lg transition-opacity duration-500 group-hover:opacity-100"></div>
							<img
								src={a.profileImageUrl}
								alt={a.nickname}
								width="96"
								height="96"
								class="relative h-20 w-20 rotate-[-3deg] rounded-2xl object-cover bg-gray-100 shadow-lg shadow-lavender/20 ring-2 ring-white/85 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-0 sm:h-24 sm:w-24"
								loading="lazy"
								decoding="async"
							/>
							<span class="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full {accent.dot} shadow-[0_0_7px_rgba(255,107,157,0.65)] ring-2 ring-white/80"></span>
						</div>

						<div class="min-w-0 flex-1 pr-10">
							<h3 class="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold leading-tight text-plum line-clamp-1">{a.nickname}</h3>
							{#if a.fullNameEn}<p class="mt-0.5 text-xs sm:text-sm text-plum-light line-clamp-1">{a.fullNameEn}</p>{/if}
							<div class="mt-2 flex flex-wrap items-center gap-1.5">
								{#if a.seriesCount > 0}
									<span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold {accent.chip}">{m.artist_works_count({ count: a.seriesCount })}</span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-lavender/10 px-2.5 py-1 text-[11px] font-medium text-plum-light/75">{m.artist_no_works()}</span>
								{/if}
								<span class="hidden rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-plum-light/80 sm:inline-flex">{m.artist_view_profile()}</span>
							</div>
						</div>

					</div>
				</div>
			</a>
		{/each}
	{/if}
</div>

<!-- Load More -->
{#if !loading && hasMore}
	<div class="text-center mt-8 sm:mt-10">
		<button onclick={loadMore} disabled={loadMoreLoading} class="px-8 py-3 rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all text-sm sm:text-base touch-target disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 mx-auto">
			{#if loadMoreLoading}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
				กำลังโหลด...
			{:else}
				ดูเพิ่มเติม
			{/if}
		</button>
		{#if loadMoreError}<p class="mt-3 text-sm text-coral-dark" role="alert">{loadMoreError}</p>{/if}
	</div>
{/if}

<!-- Empty State -->
{#if !loading && allArtists.length === 0}
	<div class="text-center py-16">
		<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
			<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
		</div>
		<h3 class="font-semibold text-plum mb-1">{m.artist_list_empty_title()}</h3>
		<p class="text-sm text-plum-light">{#if searchQuery}ลองค้นหาด้วยคำอื่น หรือ <button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">ล้างการค้นหา</button>{:else}ยังไม่มีนักแสดงในระบบ{/if}</p>
	</div>
{/if}
