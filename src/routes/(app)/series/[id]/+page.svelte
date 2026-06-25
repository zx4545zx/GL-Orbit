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

	const episodeHasContent = $derived(
		series
			? new Set(
					series.schedule
						.filter((item) => {
							const hasSchedules = item.schedules.length > 0 && item.schedules.some((s: { platform: string }) => s.platform !== 'TBA');
							return hasSchedules || Boolean(item.trailerUrl);
						})
						.map((item) => item.episode)
				)
			: new Set<number>()
	);

	const allExpanded = $derived(
		episodeHasContent.size > 0 && episodeHasContent.size === expandedEpisodes.size
	);

	function toggleAll() {
		if (allExpanded) {
			expandedEpisodes = new Set();
		} else {
			expandedEpisodes = new Set(episodeHasContent);
		}
	}

	function toggleEpisode(ep: number) {
		if (expandedEpisodes.has(ep)) {
			expandedEpisodes.delete(ep);
		} else {
			expandedEpisodes.add(ep);
		}
		// Trigger reactivity by reassigning
		expandedEpisodes = new Set(expandedEpisodes);
	}

	$effect(() => {
		if (series && initializedSeriesId !== series.id) {
			const nextExpanded = new Set<number>();
			for (const item of series.schedule) {
				const hasSchedules = item.schedules.length > 0 && item.schedules.some((s: { platform: string }) => s.platform !== 'TBA');
				const hasMedia = Boolean(item.trailerUrl);
				if (hasSchedules || hasMedia) {
					nextExpanded.add(item.episode);
				}
			}
			expandedEpisodes = nextExpanded;
			initializedSeriesId = series.id;
		}
	});

	function scheduleSummary(item: { schedules: { platform: string; airDate: string }[] }): string {
		const valid = item.schedules.filter((s) => s.platform !== 'TBA');
		if (valid.length === 0) return 'TBA';
		if (valid.length === 1) return valid[0].platform;
		return `${valid.length} แพลตฟอร์ม`;
	}

	function isToday(schedules: { airDate: string }[]): boolean {
		const today = new Date().toISOString().split('T')[0];
		return schedules.some((s) => s.airDate === today);
	}

	function hasUncut(schedules: { isUncut: boolean }[]): boolean {
		return schedules.some((s) => s.isUncut);
	}

	function firstAirDate(item: { schedules: { airDate: string; platform: string }[] }): string {
		if (item.schedules.length === 0) return 'TBA';
		const first = item.schedules[0];
		return first.airDate;
	}

	function youtubeEmbedUrl(rawUrl: string | null): string | null {
		if (!rawUrl) return null;

		try {
			const parsed = new URL(rawUrl);
			const host = parsed.hostname.replace(/^www\.|^m\./, '');
			let videoId: string | null = null;

			if (host === 'youtu.be') {
				videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
			} else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
				if (parsed.pathname === '/watch') {
					videoId = parsed.searchParams.get('v');
				} else {
					const parts = parsed.pathname.split('/').filter(Boolean);
					if (['embed', 'shorts', 'live'].includes(parts[0])) {
						videoId = parts[1] ?? null;
					}
				}
			}

			if (!videoId || !/^[\w-]{6,}$/.test(videoId)) return null;
			return `https://www.youtube-nocookie.com/embed/${videoId}`;
		} catch {
			return null;
		}
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
	<meta property="og:image:width" content="600" />
	<meta property="og:image:height" content="800" />
	<meta property="og:image:type" content="image/jpeg" />
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
	<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[radial-gradient(circle_at_15%_8%,rgba(255,107,157,0.14),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(196,181,253,0.20),transparent_32%),radial-gradient(circle_at_10%_78%,rgba(110,231,183,0.12),transparent_30%)] px-4 pb-[calc(1.5rem+var(--bottom-nav-reserved-space))] pt-6 sm:pb-[calc(2rem+var(--bottom-nav-reserved-space))] sm:pt-8 md:mb-0 md:-mt-24 md:pb-8 md:pt-32">
		<div class="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-coral/15 blur-3xl"></div>
		<div class="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-lavender/20 blur-3xl animate-float"></div>
		<div class="pointer-events-none absolute bottom-20 left-0 h-56 w-56 rounded-full bg-mint/15 blur-3xl animate-float-delayed"></div>
		<div class="relative mx-auto max-w-6xl">

		<!-- Back button -->
		<button onclick={() => history.back()} class="relative z-10 mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3.5 py-2 text-sm font-semibold text-plum-light shadow-sm shadow-lavender/10 backdrop-blur-xl transition-all duration-300 hover:-translate-x-1 hover:border-coral/30 hover:bg-white/80 hover:text-coral-dark sm:mb-8 sm:text-base touch-target">
			<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
			<span>ย้อนกลับ</span>
		</button>

		<!-- Hero -->
		<div class="relative z-10 mb-10 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3 sm:mb-12">
			<div class="relative z-20 md:col-span-1">
				<div class="relative mx-auto max-w-xs sm:max-w-none">
					<div class="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-coral/30 via-lavender/25 to-mint/20 blur-xl"></div>
					<div class="glass-card group relative overflow-hidden rounded-2xl shadow-2xl shadow-lavender/20 sm:rounded-3xl">
						<img src={series.poster} alt={series.titleEn} width={400} height={600} class="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-105" loading="eager" decoding="async" fetchpriority="high" />
						<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-plum/45 via-transparent to-white/10"></div>
					</div>
				</div>
				<div class="relative z-30 mt-4 overflow-visible rounded-[1.75rem] border border-white/70 bg-white/55 p-2.5 shadow-xl shadow-lavender/15 backdrop-blur-2xl">
					<div class="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_20%_0%,rgba(255,107,157,0.16),transparent_42%),radial-gradient(circle_at_90%_95%,rgba(110,231,183,0.18),transparent_38%)]"></div>
					<div class="relative grid grid-cols-2 gap-2">
						<FavoriteButton seriesId={series.id} className="w-full justify-start" />
						<WatchedButton seriesId={series.id} className="w-full justify-start" />
						<div class="col-span-2">
							<ShareButton
								title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''}`}
								text={`ดู «${series.titleEn}» บน GL-Orbit — ข้อมูลนักแสดง ตารางฉาย แพลตฟอร์มรับชม`}
								url={canonicalUrl}
								ariaLabel="แชร์ซีรีส์นี้"
								variant="command"
								className="w-full justify-start"
							/>
						</div>
					</div>
				</div>
			</div>

			<div class="glass-card-strong relative z-0 space-y-4 rounded-[2rem] p-5 shadow-2xl shadow-lavender/10 sm:space-y-6 sm:p-7 md:col-span-2">
				<div class="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/50 via-transparent to-lavender/10"></div>
				<div class="relative">
					<div class="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
						<span class="rounded-full px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md sm:text-sm {s?.bg} {s?.class}">{s?.text}</span>
						<span class="rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-plum-light shadow-sm shadow-lavender/5 backdrop-blur-md sm:text-sm">{series.studio}{#if series.year} • {series.year}{/if}</span>
					</div>
					<h1 class="font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight text-gradient sm:text-4xl md:text-5xl">{series.titleEn}</h1>
					<p class="mt-2 text-base font-medium text-plum-light sm:text-xl">{series.titleTh}</p>
				</div>

				{#if series.description}
					<p class="relative rounded-2xl border border-white/60 bg-white/45 p-4 text-sm leading-relaxed text-plum-light shadow-sm shadow-lavender/5 sm:text-base">{series.description}</p>
				{/if}

				{#if series.genres.length > 0}
					<div class="rounded-2xl border border-white/70 bg-white/50 p-3 shadow-sm shadow-lavender/10 backdrop-blur-xl">
						<div class="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-plum-light">
							<span class="h-2 w-2 rounded-full bg-coral shadow-sm shadow-coral/40"></span>
							ประเภทซีรีส์
						</div>
						<div class="flex flex-wrap gap-2">
							{#each series.genres as genre}
								<span class="rounded-full border border-lavender/20 bg-gradient-to-r from-lavender/15 to-coral/10 px-3 py-1.5 text-xs font-semibold text-plum shadow-sm shadow-lavender/5 sm:text-sm">{genre}</span>
							{/each}
						</div>
					</div>
				{/if}

				<div class="relative grid grid-cols-3 gap-2 sm:gap-4">
					<div class="rounded-2xl border border-coral/15 bg-gradient-to-br from-white/70 to-coral/10 p-3 text-center shadow-sm shadow-coral/10 sm:p-4">
						<div class="text-2xl font-extrabold text-coral-dark sm:text-3xl">{series.episodes}</div>
						<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-plum-light sm:text-xs">ตอน</div>
					</div>
					{#if series.year}
						<div class="rounded-2xl border border-lavender/20 bg-gradient-to-br from-white/70 to-lavender/15 p-3 text-center shadow-sm shadow-lavender/10 sm:p-4">
							<div class="text-2xl font-extrabold text-lavender-dark sm:text-3xl">{series.year}</div>
							<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-plum-light sm:text-xs">ปีฉาย</div>
						</div>
					{/if}
					<div class="rounded-2xl border border-mint/20 bg-gradient-to-br from-white/70 to-mint/10 p-3 text-center shadow-sm shadow-mint/10 sm:p-4">
						<div class="text-2xl font-extrabold text-mint-dark sm:text-3xl">{series.artists.length}</div>
						<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-plum-light sm:text-xs">นักแสดง</div>
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
			<section class="relative z-10 mb-10 sm:mb-12">
				<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
					<div>
						<p class="text-[10px] font-bold uppercase tracking-[0.24em] text-coral-dark/70">Cast constellation</p>
						<h2 class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum sm:text-3xl">นักแสดง</h2>
					</div>
					<span class="rounded-full border border-white/70 bg-white/55 px-3 py-1 text-xs font-semibold text-plum-light shadow-sm shadow-lavender/10 backdrop-blur-xl">{series.artists.length} คน</span>
				</div>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
					{#each series.artists as artist}
						<a
							href={`/artists/${artist.id}`}
							class="group glass-card relative overflow-hidden rounded-2xl p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-lavender/20 focus-visible:outline-2 focus-visible:outline-coral sm:p-4"
						>
							<div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-coral/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
							<div class="relative flex items-center gap-3 sm:gap-4">
								<img src={artist.image} alt={artist.name} width={56} height={56} loading="lazy" decoding="async" class="h-12 w-12 flex-shrink-0 rounded-2xl border border-white/70 object-cover shadow-sm shadow-lavender/15 transition-transform duration-300 group-hover:rotate-[-2deg] group-hover:scale-105 sm:h-14 sm:w-14" />
								<div class="min-w-0">
									<div class="truncate text-sm font-bold text-plum sm:text-base">{artist.name}</div>
									<div class="text-xs font-medium text-plum-light sm:text-sm">{artist.role}</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Schedule with collapsible rows -->
		{#if series.schedule.length > 0}
			<section class="relative z-10">
				<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
					<div>
						<p class="text-[10px] font-bold uppercase tracking-[0.24em] text-lavender-dark/70">Episode orbit</p>
						<h2 class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum sm:text-3xl">ตารางฉาย</h2>
					</div>
					<div class="flex items-center gap-2">
						<button onclick={toggleAll} class="rounded-full border border-coral/30 bg-coral/5 pl-2 pr-3 py-1 text-xs font-semibold text-coral-dark shadow-sm hover:bg-coral/15 hover:border-coral/50 transition-all duration-200 active:scale-95 touch-target whitespace-nowrap flex items-center gap-1" aria-label={allExpanded ? 'ย่อทั้งหมด' : 'ขยายทั้งหมด'}>
							{#if allExpanded}
								<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 15 12 7 20 15"/><line x1="4" y1="19" x2="20" y2="19"/></svg>
								<span>ย่อทั้งหมด</span>
							{:else}
								<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 9 12 17 20 9"/><line x1="4" y1="5" x2="20" y2="5"/></svg>
								<span>ขยายทั้งหมด</span>
							{/if}
						</button>
					</div>
				</div>
				<div class="glass-card-strong overflow-hidden rounded-[1.75rem] shadow-xl shadow-lavender/10 sm:rounded-[2rem]">
					<div class="divide-y divide-lavender/10">
						{#each series.schedule as item}
							{@const hasSchedules = item.schedules.length > 0 && item.schedules.some((s: { platform: string }) => s.platform !== 'TBA')}
							{@const hasEpisodeMedia = Boolean(item.trailerUrl)}
							{@const hasEpisodeContent = hasSchedules || hasEpisodeMedia}
							{@const trailerEmbedUrl = youtubeEmbedUrl(item.trailerUrl)}
							<div class="transition-all duration-300 {hasEpisodeContent ? 'hover:bg-white/45 cursor-pointer' : ''}"
								role="button"
								tabindex={hasEpisodeContent ? 0 : undefined}
								onclick={hasEpisodeContent ? () => toggleEpisode(item.episode) : undefined}
								onkeydown={hasEpisodeContent ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEpisode(item.episode); } } : undefined}
								aria-expanded={hasEpisodeContent ? expandedEpisodes.has(item.episode) : undefined}
							>
								<!-- Collapsed row -->
								<div class="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
									<div class="flex items-center gap-3 sm:gap-4 min-w-0">
										{#if item.coverUrl}
											<div class="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-lavender/10 shadow-sm shadow-lavender/10 sm:h-14 sm:w-20">
												<img src={item.coverUrl} alt={`ภาพปกตอนที่ ${item.episode}`} width={160} height={90} loading="lazy" decoding="async" class="h-full w-full object-cover" />
												<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum/70 to-transparent px-2 py-1">
													<span class="text-[10px] font-bold text-white">EP {item.episode}</span>
												</div>
											</div>
										{:else}
											<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-coral/20 to-lavender/20 shadow-sm shadow-lavender/10 sm:h-12 sm:w-12">
												<span class="text-xs sm:text-sm font-bold text-coral-dark">{item.episode}</span>
											</div>
										{/if}
										<div class="min-w-0">
											<div class="truncate text-sm font-bold text-plum sm:text-base">{item.title}</div>
											<div class="mt-0.5 truncate text-xs font-medium text-plum-light sm:text-sm">{scheduleSummary(item)}</div>
										</div>
									</div>
									<div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
										{#if isToday(item.schedules)}
											<span class="px-2 py-0.5 rounded-full bg-coral/15 text-coral-dark text-[10px] font-bold border border-coral/20 whitespace-nowrap">วันนี้</span>
										{/if}
										<span class="text-xs sm:text-sm font-medium text-coral-dark whitespace-nowrap">{firstAirDate(item)}</span>
										{#if hasEpisodeContent}
											<!-- Chevron icon -->
											<svg class="w-4 h-4 sm:w-5 sm:h-5 text-plum-light transition-transform duration-200 {expandedEpisodes.has(item.episode) ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
											</svg>
										{/if}
									</div>
								</div>
								<!-- Expanded sub-list -->
								{#if hasEpisodeContent && expandedEpisodes.has(item.episode)}
									<div class="px-4 sm:px-6 pb-3 sm:pb-4 space-y-3 animate-fade-in">
										{#if item.trailerUrl}
											{#if trailerEmbedUrl}
												<div class="overflow-hidden rounded-2xl border border-lavender/20 bg-plum/5 shadow-sm shadow-lavender/10">
													<iframe
														src={trailerEmbedUrl}
														title={`Trailer ${item.title}`}
														class="aspect-video w-full"
														loading="lazy"
														allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
														allowfullscreen
													></iframe>
												</div>
											{:else}
												<div class="rounded-2xl border border-lavender/20 bg-gradient-to-br from-white/70 to-lavender/10 p-4 shadow-sm shadow-lavender/10">
													<p class="text-xs font-bold uppercase tracking-[0.22em] text-lavender-dark/75">Trailer</p>
													<p class="mt-1 text-sm text-plum-light">ลิงก์นี้ไม่ใช่ YouTube เปิดดูในแท็บใหม่</p>
													<a href={item.trailerUrl} target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-2 rounded-full bg-plum px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-plum/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-coral-dark touch-target">
														เปิด Trailer
														<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
													</a>
												</div>
											{/if}
										{/if}

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
														<div class="flex items-center gap-1.5">
															<span class="text-sm sm:text-base font-medium text-plum truncate">{sch.platform}</span>
															{#if sch.isUncut}
																<span class="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[9px] font-bold border border-amber-200">Uncut</span>
															{/if}
														</div>
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
	</div>
{/if}
