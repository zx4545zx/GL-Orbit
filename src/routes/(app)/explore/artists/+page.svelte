<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types.js';
	import type { ArtistListItem } from '$lib/server/queries/artist-list.js';

	let { data }: { data: PageData } = $props();

	// Accent rotation — full literal class strings so Tailwind's scanner can detect them.
	// Each artist card cycles coral → lavender → mint, giving the grid a vibrant mosaic feel.
	const accents = [
		{ frame: 'from-coral via-coral/60 to-lavender', chip: 'bg-white/85 text-coral-dark', glow: 'group-hover:shadow-coral/40' },
		{ frame: 'from-lavender via-lavender/60 to-mint', chip: 'bg-white/85 text-lavender-dark', glow: 'group-hover:shadow-lavender/40' },
		{ frame: 'from-mint via-mint/60 to-coral', chip: 'bg-white/85 text-mint-dark', glow: 'group-hover:shadow-mint/40' }
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
		return query ? `/explore/artists?${query}` : '/explore/artists';
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
		}, 300);
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
			loadMoreError = 'โหลดเพิ่มไม่สำเร็จ ลองอีกครั้ง';
		} finally {
			loadMoreLoading = false;
		}
	}
</script>

<svelte:head>
	<title>สำรวจนักแสดง GL | GL-Orbit</title>
	<meta name="description" content="สำรวจนักแสดงซีรีส์ Girls' Love พร้อมผลงานและโซเชียลมีเดีย" />
</svelte:head>

<!-- Search -->
<div class="max-w-xl mx-auto mb-6 sm:mb-8">
	<div class="glass-card-strong rounded-2xl flex items-center px-4 py-3 gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-coral/30 focus-within:border-coral/30">
		<svg class="w-5 h-5 text-plum-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
		<input type="text" bind:value={searchQuery} oninput={scheduleSearchUpdate} placeholder="ค้นหาชื่อนักแสดง..." aria-label="ค้นหานักแสดง" class="flex-1 bg-transparent text-plum placeholder:text-plum-light/50 focus:outline-none text-sm sm:text-base" />
		{#if searchQuery}
			<button onclick={clearSearch} class="p-1 rounded-lg hover:bg-lavender/20 transition-colors flex-shrink-0" aria-label="ล้างการค้นหา"><svg class="w-4 h-4 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" /></svg></button>
		{/if}
	</div>
</div>

<!-- Artist Grid — square spotlight cards with rotating gradient frames -->
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5" aria-busy={loading}>
	{#if loading}
		{#each Array(8) as _, i (i)}
			<div class="relative aspect-square rounded-3xl bg-lavender/10 animate-pulse"></div>
		{/each}
	{:else}
		{#each allArtists as a, i (a.id)}
			{@const accent = accents[i % accents.length]}
			<a href="/artists/{a.id}" class="group block">
				<div class="relative aspect-square rounded-3xl p-[3px] bg-gradient-to-br {accent.frame} shadow-lg shadow-lavender/10 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl {accent.glow}">
					<div class="relative w-full h-full rounded-[1.35rem] overflow-hidden bg-white">
						<img
							src={a.profileImageUrl}
							alt={a.nickname}
							class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
							loading="lazy"
							decoding="async"
						/>
						<!-- gradient veil for text contrast -->
						<div class="absolute inset-0 bg-gradient-to-t from-plum/85 via-plum/15 to-transparent"></div>

						<!-- works chip -->
						{#if a.seriesCount > 0}
							<div class="absolute top-2.5 right-2.5">
								<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md {accent.chip}">{a.seriesCount} ผลงาน</span>
							</div>
						{/if}

						<!-- name -->
						<div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-center">
							<h3 class="text-white font-bold text-base sm:text-lg leading-tight line-clamp-1 drop-shadow-sm">{a.nickname}</h3>
							{#if a.fullNameEn}<p class="text-white/80 text-[11px] sm:text-xs line-clamp-1 mt-0.5">{a.fullNameEn}</p>{/if}
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
		<h3 class="font-semibold text-plum mb-1">ไม่พบนักแสดง</h3>
		<p class="text-sm text-plum-light">{#if searchQuery}ลองค้นหาด้วยคำอื่น หรือ <button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">ล้างการค้นหา</button>{:else}ยังไม่มีนักแสดงในระบบ{/if}</p>
	</div>
{/if}
