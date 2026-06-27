<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
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
			<a href="/artists/{a.id}" class="group block">
				<div class="glass-card-strong relative overflow-hidden rounded-3xl border {accent.border} bg-white/76 p-3 sm:p-4 shadow-lg shadow-lavender/10 transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-2xl {accent.glow}">
					<div class="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl opacity-80 {accent.orb}"></div>
					<div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/75 via-cream/45 to-transparent"></div>

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

						<div class="min-w-0 flex-1">
							<h3 class="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold leading-tight text-plum line-clamp-1">{a.nickname}</h3>
							{#if a.fullNameEn}<p class="mt-0.5 text-xs sm:text-sm text-plum-light line-clamp-1">{a.fullNameEn}</p>{/if}
							<div class="mt-2 flex flex-wrap items-center gap-1.5">
								{#if a.seriesCount > 0}
									<span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold {accent.chip}">{a.seriesCount} ผลงาน</span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-lavender/10 px-2.5 py-1 text-[11px] font-medium text-plum-light/75">ยังไม่มีผลงาน</span>
								{/if}
								<span class="hidden rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-plum-light/80 sm:inline-flex">ดูโปรไฟล์</span>
							</div>
						</div>

						<svg class="hidden h-5 w-5 shrink-0 text-plum-light/35 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-coral-dark sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
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
