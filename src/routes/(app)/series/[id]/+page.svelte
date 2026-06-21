<script lang="ts">
	import { page } from '$app/state';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import WatchedButton from '$lib/components/WatchedButton.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import { absoluteUrl, buildBreadcrumbJsonLd, jsonLdScript, safeJsonLd, truncateSeo } from '$lib/seo.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const series = $derived(data.series);
	const loading = false;

	const statusConfig: Record<string, { text: string; class: string; bg: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'text-mint-dark', bg: 'bg-mint/20' },
		UPCOMING: { text: ' upcoming', class: 'text-lavender-dark', bg: 'bg-lavender/20' },
		ENDED: { text: 'จบแล้ว', class: 'text-coral-dark', bg: 'bg-coral/10' }
	};

	const s = $derived(series ? statusConfig[series.status] : null);
	const seoTitle = $derived(`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''} | GL-Orbit`);
	const seoDescription = $derived(truncateSeo(
		series.description || `${series.titleEn} ซีรีส์ GL จาก ${series.studio} พร้อมข้อมูลนักแสดง จำนวนตอน ตารางฉาย และแพลตฟอร์มรับชม`
	));
	const canonicalUrl = $derived(absoluteUrl(page.url.origin, `/series/${series.id}`));
	const seriesJsonLd = $derived(safeJsonLd([
		{
			'@context': 'https://schema.org',
			'@type': 'TVSeries',
			name: series.titleEn,
			alternateName: series.titleTh || undefined,
			image: series.poster,
			description: seoDescription,
			url: canonicalUrl,
			productionCompany: { '@type': 'Organization', name: series.studio },
			numberOfEpisodes: series.episodes,
			datePublished: series.year ? String(series.year) : undefined,
			actor: series.artists.map((artist) => ({ '@type': 'Person', name: artist.name }))
		},
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: 'หน้าแรก', path: '/' },
			{ name: 'ซีรีส์ทั้งหมด', path: '/series' },
			{ name: series.titleEn, path: `/series/${series.id}` }
		])
	]));

	// --- Collapsible schedule state ---
	let expandedEpisodes = $state(new Set<number>());
	let initializedSeriesId = $state<string | null>(null);

	$effect(() => {
		if (series && initializedSeriesId !== series.id) {
			const nextExpanded = new Set<number>();
			for (const item of series.schedule) {
				const hasSchedules = item.schedules.length > 0 && item.schedules.some((s: { platform: string }) => s.platform !== 'TBA');
				if (hasSchedules) {
					nextExpanded.add(item.episode);
				}
			}
			expandedEpisodes = nextExpanded;
			initializedSeriesId = series.id;
		}
	});

	function toggleEpisode(ep: number) {
		if (expandedEpisodes.has(ep)) {
			expandedEpisodes.delete(ep);
		} else {
			expandedEpisodes.add(ep);
		}
		// Trigger reactivity by reassigning
		expandedEpisodes = new Set(expandedEpisodes);
	}

	function scheduleSummary(item: { schedules: { platform: string; airDate: string }[] }): string {
		const valid = item.schedules.filter((s) => s.platform !== 'TBA');
		if (valid.length === 0) return 'TBA';
		if (valid.length === 1) return valid[0].platform;
		return `${valid.length} แพลตฟอร์ม`;
	}

	function firstAirDate(item: { schedules: { airDate: string; platform: string }[] }): string {
		if (item.schedules.length === 0) return 'TBA';
		const first = item.schedules[0];
		return first.airDate;
	}
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="video.tv_show" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={series.poster} />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={series.poster} />
	{@html jsonLdScript(seriesJsonLd)}
</svelte:head>

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
					<img src={series.poster} alt={series.titleEn} width={400} height={600} class="w-full aspect-[2/3] object-cover" loading="eager" decoding="async" fetchpriority="high" />
				</div>
				<div class="flex gap-2 mt-3">
					<FavoriteButton seriesId={series.id} className="flex-1 justify-center" />
					<WatchedButton seriesId={series.id} className="flex-1 justify-center" />
					<ShareButton
						title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''}`}
						text={`ดู «${series.titleEn}» บน GL-Orbit — ข้อมูลนักแสดง ตารางฉาย แพลตฟอร์มรับชม`}
						url={canonicalUrl}
						ariaLabel="แชร์ซีรีส์นี้"
						className="justify-center"
					/>
				</div>
			</div>

			<div class="md:col-span-2 space-y-4 sm:space-y-6">
				<div>
					<div class="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
						<span class="px-2.5 sm:px-3 py-1 rounded-full {s?.bg} {s?.class} text-xs sm:text-sm font-semibold">{s?.text}</span>
						<span class="text-xs sm:text-sm text-plum-light">{series.studio}{#if series.year} • {series.year}{/if}</span>
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
									<img src={platform.logo} alt={platform.name} width={20} height={20} loading="lazy" decoding="async" class="w-5 h-5 rounded-full object-cover border border-lavender/30" />
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
						<a
							href={`/artists/${artist.id}`}
							class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-coral"
						>
							<img src={artist.image} alt={artist.name} width={56} height={56} loading="lazy" decoding="async" class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0" />
							<div class="min-w-0">
								<div class="font-semibold text-plum text-sm sm:text-base truncate">{artist.name}</div>
								<div class="text-xs sm:text-sm text-plum-light">{artist.role}</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Schedule with collapsible rows -->
		{#if series.schedule.length > 0}
			<section>
				<h2 class="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-plum mb-4 sm:mb-6">ตารางฉาย</h2>
				<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
					<div class="divide-y divide-lavender/10">
						{#each series.schedule as item}
							{@const hasSchedules = item.schedules.length > 0 && item.schedules.some((s: { platform: string }) => s.platform !== 'TBA')}
							<div class="transition-colors {hasSchedules ? 'hover:bg-white/40 cursor-pointer' : ''}"
								role="button"
								tabindex={hasSchedules ? 0 : undefined}
								onclick={hasSchedules ? () => toggleEpisode(item.episode) : undefined}
								onkeydown={hasSchedules ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEpisode(item.episode); } } : undefined}
								aria-expanded={hasSchedules ? expandedEpisodes.has(item.episode) : undefined}
							>
								<!-- Collapsed row -->
								<div class="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
									<div class="flex items-center gap-3 sm:gap-4 min-w-0">
										<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-coral/20 to-lavender/20 flex items-center justify-center flex-shrink-0">
											<span class="text-xs sm:text-sm font-bold text-coral-dark">{item.episode}</span>
										</div>
										<div class="min-w-0">
											<div class="font-semibold text-plum text-sm sm:text-base truncate">{item.title}</div>
											<div class="text-xs sm:text-sm text-plum-light truncate">{scheduleSummary(item)}</div>
										</div>
									</div>
									<div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
										<span class="text-xs sm:text-sm font-medium text-coral-dark whitespace-nowrap">{firstAirDate(item)}</span>
										{#if hasSchedules}
											<!-- Chevron icon -->
											<svg class="w-4 h-4 sm:w-5 sm:h-5 text-plum-light transition-transform duration-200 {expandedEpisodes.has(item.episode) ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
											</svg>
										{/if}
									</div>
								</div>
								<!-- Expanded sub-list -->
								{#if hasSchedules && expandedEpisodes.has(item.episode)}
									<div class="px-4 sm:px-6 pb-3 sm:pb-4 space-y-2 animate-fade-in">
										{#each item.schedules as sch}
											{@const hasStreamLink = sch.streamLink && sch.streamLink.length > 0}
											<div class="flex items-center justify-between gap-3 py-2 px-3 sm:px-4 rounded-xl bg-white/50">
												<div class="flex items-center gap-2 sm:gap-3 min-w-0">
													{#if sch.platformLogo}
														<img src={sch.platformLogo} alt={sch.platform} width={28} height={28} loading="lazy" decoding="async" class="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0 border border-lavender/30" />
													{:else}
														<div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-lavender/20 flex items-center justify-center flex-shrink-0 border border-lavender/30">
															<span class="text-[10px] font-bold text-lavender-dark">{sch.platform.charAt(0)}</span>
														</div>
													{/if}
													<div class="min-w-0">
														<div class="text-sm sm:text-base font-medium text-plum truncate">{sch.platform}</div>
														<div class="text-xs text-plum-light">{sch.airDate}</div>
													</div>
												</div>
												{#if hasStreamLink}
													<a href={sch.streamLink}
														target="_blank"
														rel="noopener noreferrer"
														class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-coral to-coral-dark hover:from-coral-dark hover:to-coral transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0 touch-target"
													>
														ดูเลย
														<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
														</svg>
													</a>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/if}
	</div>
{/if}
