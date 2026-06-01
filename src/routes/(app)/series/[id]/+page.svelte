<script lang="ts">
	import type { PageData } from './$types.js';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';

	let { data }: { data: PageData } = $props();

	let series = $state<Awaited<PageData['series']> | null>(null);
	let loading = $state(true);

	$effect(() => {
		const value = data.series;
		if (value && typeof value === 'object' && 'id' in value) {
			series = value;
			loading = false;
		} else {
			loading = true;
			Promise.resolve(value).then((s) => {
				series = s;
				loading = false;
			});
		}
	});

	const statusConfig: Record<string, { text: string; class: string; bg: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'text-mint-dark', bg: 'bg-mint/20' },
		UPCOMING: { text: ' upcoming', class: 'text-lavender-dark', bg: 'bg-lavender/20' },
		ENDED: { text: 'จบแล้ว', class: 'text-coral-dark', bg: 'bg-coral/10' }
	};

	const s = $derived(series ? statusConfig[series.status] : null);
</script>

{#if loading || !series}
	<div class="py-6 sm:py-8 max-w-6xl mx-auto">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
			<div class="md:col-span-1">
				<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden max-w-xs sm:max-w-none mx-auto aspect-[2/3] bg-lavender/10 animate-pulse"></div>
			</div>
			<div class="md:col-span-2 space-y-4 sm:space-y-6">
				<div class="space-y-3">
					<div class="h-6 w-24 bg-lavender/10 rounded animate-pulse"></div>
					<div class="h-10 w-3/4 bg-lavender/10 rounded animate-pulse"></div>
					<div class="h-6 w-1/2 bg-lavender/10 rounded animate-pulse"></div>
				</div>
				<div class="grid grid-cols-3 gap-2 sm:gap-4">
					{#each Array(3) as _}
						<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 h-20 bg-lavender/10 animate-pulse"></div>
					{/each}
				</div>
				<div class="space-y-2">
					<div class="h-4 w-full bg-lavender/10 rounded animate-pulse"></div>
					<div class="h-4 w-5/6 bg-lavender/10 rounded animate-pulse"></div>
					<div class="h-4 w-4/6 bg-lavender/10 rounded animate-pulse"></div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="py-6 sm:py-8 max-w-6xl mx-auto">
		<!-- Back button -->
		<a href="/series" class="inline-flex items-center gap-2 text-plum-light hover:text-coral-dark transition-colors mb-6 sm:mb-8 touch-target text-sm sm:text-base">
			<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
			<span class="font-medium">กลับหน้ารายการซีรีส์</span>
		</a>

		<!-- Hero -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
			<div class="md:col-span-1">
				<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-lavender/10 max-w-xs sm:max-w-none mx-auto">
					<img src={series.poster} alt={series.titleEn} class="w-full aspect-[2/3] object-cover" loading="eager" />
				</div>
			</div>

			<div class="md:col-span-2 space-y-4 sm:space-y-6">
				<div>
					<div class="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
						<span class="px-2.5 sm:px-3 py-1 rounded-full {s?.bg} {s?.class} text-xs sm:text-sm font-semibold">{s?.text}</span>
						<span class="text-xs sm:text-sm text-plum-light">{series.studio}{#if series.year} • {series.year}{/if}</span>
						<FavoriteButton seriesId={series.id} />
					</div>
					<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold text-plum mb-1 sm:mb-2">{series.titleEn}</h1>
					<p class="text-base sm:text-xl text-plum-light">{series.titleTh}</p>
				</div>

				{#if series.description}
					<p class="text-sm sm:text-base text-plum-light leading-relaxed">{series.description}</p>
				{/if}

				{#if series.genres.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each series.genres as genre}
							<span class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-lavender/10 text-lavender-dark text-xs sm:text-sm font-medium">{genre}</span>
						{/each}
					</div>
				{/if}

				<div class="grid grid-cols-3 gap-2 sm:gap-4">
					<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
						<div class="text-xl sm:text-2xl font-bold text-coral-dark">{series.episodes}</div>
						<div class="text-[10px] sm:text-xs text-plum-light mt-1">ตอน</div>
					</div>
					{#if series.year}
						<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
							<div class="text-xl sm:text-2xl font-bold text-lavender-dark">{series.year}</div>
							<div class="text-[10px] sm:text-xs text-plum-light mt-1">ปีฉาย</div>
						</div>
					{/if}
					<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
						<div class="text-xl sm:text-2xl font-bold text-mint-dark">{series.artists.length}</div>
						<div class="text-[10px] sm:text-xs text-plum-light mt-1">นักแสดง</div>
					</div>
				</div>

				{#if series.platforms.length > 0}
					<div class="flex flex-wrap gap-2 sm:gap-3">
						{#each series.platforms as platform}
							<span class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl glass-card text-xs sm:text-sm font-medium text-plum flex items-center gap-2">
								{#if platform.logo}
									<img src={platform.logo} alt={platform.name} class="w-5 h-5 rounded-full object-cover" />
								{/if}
								{platform.name}
							</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Artists -->
		{#if series.artists.length > 0}
			<section class="mb-10 sm:mb-12">
				<h2 class="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-plum mb-4 sm:mb-6">นักแสดง</h2>
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
					{#each series.artists as artist}
						<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
							<img src={artist.image} alt={artist.name} class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0" />
							<div class="min-w-0">
								<div class="font-semibold text-plum text-sm sm:text-base truncate">{artist.name}</div>
								<div class="text-xs sm:text-sm text-plum-light">{artist.role}</div>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Schedule -->
		{#if series.schedule.length > 0}
			<section>
				<h2 class="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-plum mb-4 sm:mb-6">ตารางฉาย</h2>
				<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
					<div class="divide-y divide-lavender/10">
						{#each series.schedule as item}
							<div class="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-white/40 transition-colors">
								<div class="flex items-center gap-3 sm:gap-4">
									<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-coral/20 to-lavender/20 flex items-center justify-center flex-shrink-0">
										<span class="text-xs sm:text-sm font-bold text-coral-dark">{item.episode}</span>
									</div>
									<div>
										<div class="font-semibold text-plum text-sm sm:text-base">{item.title}</div>
										<div class="text-xs sm:text-sm text-plum-light">{item.platform}</div>
									</div>
								</div>
								<div class="text-xs sm:text-sm font-medium text-coral-dark whitespace-nowrap">{item.airDate}</div>
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/if}
	</div>
{/if}
