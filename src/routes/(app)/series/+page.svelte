<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fetchSeries, parseSeriesParams, type FilterKey, type SeriesApiResponseItem } from './series.js';

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: 'เร็วๆ นี้', class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }
	};

	const filterOptions: { key: FilterKey; label: string }[] = [
		{ key: 'ALL', label: 'ทั้งหมด' },
		{ key: 'ONGOING', label: 'กำลังฉาย' },
		{ key: 'UPCOMING', label: 'เร็วๆ นี้' },
		{ key: 'ENDED', label: 'จบแล้ว' }
	];

	let allSeries = $state<SeriesApiResponseItem[]>([]);
	let total = $state(0);
	let currentPage = $state(1);
	let filterStatus = $state<FilterKey>('ALL');
	let searchQuery = $state('');
	let loading = $state(true);
	let loadMoreLoading = $state(false);
	let loadMoreError = $state('');
	let loadMoreController: AbortController | null = null;

	// Abort previous in-flight request so the latest query always wins
	let abortController: AbortController | null = null;

	$effect(() => {
		const search = page.url.search;

		// Abort previous full-list fetch
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();
		const signal = abortController.signal;

		// Also abort any in-flight Load More to prevent racing
		if (loadMoreController) {
			loadMoreController.abort();
			loadMoreController = null;
			loadMoreLoading = false;
		}

		const params = parseSeriesParams(new URLSearchParams(search));

		// Sync local state from URL
		searchQuery = params.search;
		filterStatus = params.status;
		currentPage = params.page;

		loading = true;

		fetchSeries(params.search, params.status, params.page)
			.then((result) => {
				if (signal.aborted) return;
				allSeries = result.series.items;
				total = result.series.total;
				currentPage = result.series.page;
			})
			.catch(() => {
				if (signal.aborted) return;
				allSeries = [];
				total = 0;
				currentPage = 1;
			})
			.finally(() => {
				if (signal.aborted) return;
				loading = false;
			});
	});

	const hasMore = $derived(allSeries.length < total);

	function buildUrl(search: string, status: string): string {
		const params = new URLSearchParams();
		if (search.trim()) params.set('search', search.trim());
		if (status !== 'ALL') params.set('status', status.toLowerCase());
		const query = params.toString();
		return query ? `/series?${query}` : '/series';
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
		}, 300);
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
				allSeries = [...allSeries, ...result.items];
				currentPage = result.page;
				total = result.total;
			}
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') return;
			loadMoreError = 'โหลดไม่สำเร็จ กรุณาลองใหม่';
		} finally {
			if (loadMoreController === controller) {
				loadMoreLoading = false;
				loadMoreController = null;
			}
		}
	}
</script>

<svelte:head>
	<title>ซีรีส์ทั้งหมด | GL-Orbit</title>
	<meta name="description" content="รวบรวมซีรีส์ GL จากทุกสตูดิโอ" />
</svelte:head>

{#snippet searchFilter()}
	<div class="flex flex-col gap-3 max-w-xl mx-auto">
		<!-- Search Input -->
		<div class="relative w-full">
			<div class="glass-card-strong rounded-2xl flex items-center px-4 py-3 gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-coral/30 focus-within:border-coral/30">
				<svg class="w-5 h-5 text-plum-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					oninput={scheduleSearchUpdate}
					placeholder="ค้นหาซีรีส์, สตูดิโอ..."
					aria-label="ค้นหาซีรีส์หรือสตูดิโอ"
					class="flex-1 bg-transparent text-plum placeholder:text-plum-light/50 focus:outline-none text-sm sm:text-base"
				/>
				{#if searchQuery}
					<button
						onclick={clearSearch}
						class="p-1 rounded-lg hover:bg-lavender/20 transition-colors flex-shrink-0"
						aria-label="ล้างการค้นหา"
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
			<div class="glass-card rounded-2xl p-1.5 flex gap-1 overflow-x-auto">
				{#each filterOptions as filter}
					<button
						onclick={() => updateStatus(filter.key)}
						aria-pressed={filterStatus === filter.key}
						class="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 touch-target whitespace-nowrap {filterStatus === filter.key ? 'bg-gradient-to-r from-coral to-coral-dark text-white shadow-lg shadow-coral/25' : 'text-plum-light hover:bg-white/60'}"
					>
						{filter.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

<div class="py-6 sm:py-8 max-w-6xl mx-auto" aria-busy={loading}>
	<!-- Title -->
	<div class="text-center mb-6 sm:mb-8">
		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			ซีรีส์<span class="text-coral">ทั้งหมด</span>
		</h1>
		<p class="text-sm sm:text-base text-plum-light">รวบรวมซีรีส์ GL จากทุกสตูดิโอ</p>
	</div>

	<!-- Normal Search & Filter -->
	<div class="mb-6 sm:mb-8">
		{@render searchFilter()}
	</div>

	<!-- Series Grid -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
		{#if loading}
			{#each Array(8) as _, i}
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
			{#each allSeries as s (s.id)}
				<a href="/series/{s.id}" class="group">
					<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/20 transition-all duration-500 hover:-translate-y-2">
						<div class="relative aspect-[3/4] overflow-hidden">
							<img
								src={s.poster}
								alt={s.title}
								class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
								loading="lazy"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/20 to-transparent"></div>
							<div class="absolute top-3 sm:top-4 left-3 sm:left-4">
								<span class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md {statusConfig[s.status].class}">
									{statusConfig[s.status].text}
								</span>
							</div>
							<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
								<p class="text-white/70 text-xs sm:text-sm mb-1">{s.studio}</p>
								<h3 class="text-white font-bold text-lg sm:text-xl mb-1">{s.title}</h3>
								<p class="text-white/80 text-xs sm:text-sm mb-2">{s.subtitle}</p>
								{#if s.genres && s.genres.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each s.genres as genre}
											<span class="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] sm:text-xs font-medium">{genre.name}</span>
										{/each}
									</div>
								{/if}
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
					กำลังโหลด...
				{:else}
					ดูเพิ่มเติม
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
			<h3 class="font-semibold text-plum mb-1">ไม่พบซีรีส์</h3>
			<p class="text-sm text-plum-light">
				{#if searchQuery}
					ลองค้นหาด้วยคำอื่น หรือ <button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">ล้างการค้นหา</button>
				{:else}
					ไม่พบซีรีส์ในหมวดหมู่นี้
				{/if}
			</p>
		</div>
	{/if}
</div>
