<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';
import Picture from '$lib/components/Picture.svelte';

	import { page } from '$app/state';	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import WatchedButton from '$lib/components/WatchedButton.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import { buildBreadcrumbJsonLd, buildCanonicalUrl, jsonLdScript, localizedPath, safeJsonLd, truncateSeo } from '$lib/seo.js';
	import type { PageData } from './$types.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';

	let { data }: { data: PageData } = $props();

	const series = $derived(data.series);
	const title = $derived(data.title);
	const description = $derived(data.description);
	const loading = false;

	const statusConfig: Record<string, { text: string; class: string; bg: string }> = {
		ONGOING: { text: m.status_ongoing(), class: 'text-mint-dark', bg: 'bg-mint/20' },
		UPCOMING: { text: m.status_upcoming(), class: 'text-lavender-dark', bg: 'bg-lavender/20' },
		ENDED: { text: m.status_ended(), class: 'text-coral-dark', bg: 'bg-coral/10' }
	};

	const s = $derived(series ? statusConfig[series.status] : null);
	const titleEnSuffix = $derived(
		series.titleTh && series.titleEn && title !== series.titleEn ? ` (${series.titleEn})` : ''
	);
	const seoTitle = $derived(m.series_detail_seo_title({ title, titleEnSuffix }));
	const seoDescription = $derived(truncateSeo(
		description || m.series_detail_seo_fallback({ title })
	));
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalPath = $derived(`/series/${series.id}`);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
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
			{ name: m.nav_home(), path: localizedPath(currentLang, '') },
			{ name: m.series_breadcrumb_all(), path: localizedPath(currentLang, '/series') },
			{ name: series.titleEn, path: localizedPath(currentLang, canonicalPath) }
		])
	]));


	const coverCandidate = $derived(series?.poster ?? null);
	const episodeCoverCandidates = $derived(
		series
			? series.schedule
					.filter((item) => Boolean(item.coverUrl))
					.map((item) => ({
						src: item.coverUrl as string,
						alt: m.series_episode_cover_alt({ episode: item.episode }),
						episode: item.episode,
						title: item.title
					}))
			: []
	);
	const galleryCandidates = $derived(episodeCoverCandidates.slice(0, 7));
	const primaryMeta = $derived([
		{ label: m.common_episodes(), value: series?.episodes ?? null },
		{ label: m.common_year(), value: series?.year ?? null },
		{ label: m.common_cast(), value: series?.artists.length ?? null }
	].filter((item) => item.value !== null));

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

	// --- Read-more description state ---
	let isDescriptionExpanded = $state(false);
	let descriptionHasOverflow = $state(false);
	let descriptionEl: HTMLParagraphElement | undefined = $state();
	const showReadMoreButton = $derived(descriptionHasOverflow || isDescriptionExpanded);

	function measureDescriptionOverflow() {
		if (!descriptionEl) {
			descriptionHasOverflow = false;
			return;
		}
		descriptionHasOverflow = descriptionEl.scrollHeight > descriptionEl.clientHeight;
	}

	$effect(() => {
		if (!descriptionEl) return;

		measureDescriptionOverflow();

		const observer = new ResizeObserver(() => {
			if (!isDescriptionExpanded) {
				measureDescriptionOverflow();
			}
		});
		observer.observe(descriptionEl);

		return () => {
			observer.disconnect();
		};
	});

	function scheduleSummary(item: { schedules: { platform: string; airDate: string }[] }): string {
		const valid = item.schedules.filter((s) => s.platform !== 'TBA');
		if (valid.length === 0) return 'TBA';
		if (valid.length === 1) return valid[0].platform;
		return m.series_platform_count({ count: String(valid.length) });
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
	<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[#08070b] pb-[calc(2rem+var(--bottom-nav-reserved-space))] text-white md:mb-0 md:-mt-24 md:pb-12 md:pt-24">
		{#if coverCandidate}
			<div class="absolute inset-x-0 top-0 h-[42rem] overflow-hidden opacity-70">
				<Picture src={coverCandidate} type="posters" sizes="100vw" alt="" width={1080} height={1620} loading="eager" fetchpriority="high" class="h-full w-full scale-110 object-cover blur-2xl" />
				<div class="absolute inset-0 bg-gradient-to-b from-plum/65 via-[#08070b]/82 to-[#08070b]"></div>
				<div class="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,107,157,0.32),transparent_34%),radial-gradient(circle_at_74%_28%,rgba(196,181,253,0.24),transparent_38%),linear-gradient(90deg,rgba(8,7,11,0.92),rgba(8,7,11,0.42),rgba(8,7,11,0.9))]"></div>
			</div>
		{/if}
		<div class="pointer-events-none absolute inset-0 noise-overlay opacity-80"></div>
		<div class="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-coral/20 blur-3xl motion-safe:animate-float"></div>
		<div class="pointer-events-none absolute bottom-24 right-0 h-80 w-80 rounded-full bg-mint/10 blur-3xl motion-safe:animate-float-delayed"></div>

		<div class="relative mx-auto max-w-7xl px-4 pt-5 sm:pt-8 md:px-6">
			<button onclick={() => history.back()} class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white/80 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:-translate-x-1 hover:border-coral/40 hover:bg-white/15 hover:text-white sm:mb-8 sm:text-base touch-target">
				<svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
				<span>{m.common_back()}</span>
			</button>

			<section class="relative z-10 grid gap-6 pb-10 md:grid-cols-[minmax(18rem,0.84fr)_minmax(0,1.35fr)] md:items-end md:gap-10 lg:gap-14">
				<div class="relative mx-auto w-full max-w-[22rem] md:max-w-none">
					<div class="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-coral/45 via-lavender/25 to-mint/15 blur-2xl"></div>
					<div class="group relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl shadow-black/45 backdrop-blur-2xl md:rounded-[2.4rem]">
						<Picture src={series.poster} type="posters" sizes="(max-width: 768px) 88vw, 430px" alt={series.titleEn} width={480} height={720} loading="eager" fetchpriority="high" class="aspect-[2/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
						<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5"></div>
						<div class="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
							<span class="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur-xl">GL-Orbit</span>
							{#if s}
								<span class="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-xl">{s.text}</span>
							{/if}
						</div>
					</div>

					<div class="relative z-20 -mt-5 rounded-[1.75rem] border border-white/15 bg-black/35 p-2.5 shadow-2xl shadow-black/30 backdrop-blur-2xl">
						<div class="grid grid-cols-2 gap-2">
							<FavoriteButton seriesId={series.id} className="w-full justify-start bg-white/90 text-plum" />
							<WatchedButton seriesId={series.id} className="w-full justify-start bg-white/90 text-plum" />
							<div class="col-span-2">
								<ShareButton
									title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''}`}
									text={m.series_share_text({ title })}
									url={canonicalUrl}
									ariaLabel={m.series_share_aria_label()}
									variant="command"
									className="w-full justify-start bg-white/90 text-plum"
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="min-w-0 pb-1 md:pb-8">
					<div class="mb-4 flex flex-wrap items-center gap-2">
						{#if s}
							<span class="rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-black/20 backdrop-blur-xl sm:text-sm">{s.text}</span>
						{/if}
						<span class="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/75 backdrop-blur-xl sm:text-sm">{series.studio}{#if series.year} • {series.year}{/if}</span>
					</div>

					<h1 class="font-[family-name:var(--font-display)] text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.92] tracking-[-0.07em] text-white drop-shadow-2xl">
						{series.titleEn}
					</h1>
					{#if series.titleTh}
						<p class="mt-4 max-w-3xl font-[family-name:var(--font-thai)] text-xl font-semibold text-white/82 sm:text-2xl md:text-3xl">{series.titleTh}</p>
					{/if}

					{#if description}
						<div class="mt-6 max-w-4xl rounded-[1.7rem] border border-white/12 bg-white/[0.08] p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-5">
							<p
								bind:this={descriptionEl}
								class="font-[family-name:var(--font-thai)] text-sm leading-8 text-white/76 sm:text-base sm:leading-9 {isDescriptionExpanded ? '' : 'line-clamp-2'} motion-safe:transition-all motion-safe:duration-300 ease-out"
							>
								{description}
							</p>
							{#if showReadMoreButton}
								<button type="button" onclick={() => (isDescriptionExpanded = !isDescriptionExpanded)} class="mt-3 inline-flex items-center gap-1 rounded-full bg-coral/15 px-3 py-1.5 text-sm font-bold text-coral-light transition-colors hover:bg-coral/25 hover:text-white touch-target">
									{isDescriptionExpanded ? m.series_description_collapse() : m.series_description_read_more()}
								</button>
							{/if}
						</div>
					{/if}

					<div class="mt-6 grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3">
						{#each primaryMeta as item}
							<div class="rounded-2xl border border-white/12 bg-white/[0.08] p-3 text-center shadow-lg shadow-black/10 backdrop-blur-xl">
								<div class="text-2xl font-black text-white sm:text-3xl">{item.value}</div>
								<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 sm:text-xs">{item.label}</div>
							</div>
						{/each}
					</div>

					{#if series.genres.length > 0 || series.platforms.length > 0}
						<div class="mt-5 flex flex-wrap gap-2">
							{#each series.genres as genre}
								<span class="rounded-full border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral-light shadow-lg shadow-coral/10 sm:text-sm">{genre}</span>
							{/each}
							{#each series.platforms as platform}
								<span class="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-xl sm:text-sm">
									{#if platform.logo}
										<img src={platform.logo} alt={platform.name} width={20} height={20} loading="lazy" decoding="async" class="h-5 w-5 shrink-0 rounded-full border border-white/20 object-cover" />
									{/if}
									<span class="truncate">{platform.name}</span>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</section>

		<!-- Artists -->
		{#if series.artists.length > 0}
			<section class="relative z-10 mb-10 sm:mb-12">
				<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
					<div>
						<p class="text-[10px] font-bold uppercase tracking-[0.24em] text-coral-dark/70">Cast constellation</p>
						<h2 class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum sm:text-3xl">{m.common_cast()}</h2>
					</div>
					<span class="rounded-full border border-white/70 bg-white/55 px-3 py-1 text-xs font-semibold text-plum-light shadow-sm shadow-lavender/10 backdrop-blur-xl">{series.artists.length} {m.common_people()}</span>
				</div>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
					{#each series.artists as artist}
						<a
							href={`/artists/${artist.id}`}
							class="group glass-card relative overflow-hidden rounded-2xl p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-lavender/20 focus-visible:outline-2 focus-visible:outline-coral sm:p-4"
						>
							<div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-coral/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
							<div class="relative flex items-center gap-3 sm:gap-4">
									<Picture src={artist.image} type="profiles" sizes="96px" alt={artist.name} width={56} height={56} loading="lazy" class="h-12 w-12 flex-shrink-0 rounded-2xl border border-white/70 object-cover shadow-sm shadow-lavender/15 transition-transform duration-300 group-hover:rotate-[-2deg] group-hover:scale-105 sm:h-14 sm:w-14" />
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
						<h2 class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum sm:text-3xl">{m.common_schedule()}</h2>
					</div>
					<div class="flex items-center gap-2">
						<button onclick={toggleAll} class="rounded-full border border-coral/30 bg-coral/5 pl-2 pr-3 py-1 text-xs font-semibold text-coral-dark shadow-sm hover:bg-coral/15 hover:border-coral/50 transition-all duration-200 active:scale-95 touch-target whitespace-nowrap flex items-center gap-1" aria-label={allExpanded ? m.common_collapse_all() : m.common_expand_all()}>
							{#if allExpanded}
								<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 15 12 7 20 15"/><line x1="4" y1="19" x2="20" y2="19"/></svg>
								<span>{m.common_collapse_all()}</span>
							{:else}
								<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 9 12 17 20 9"/><line x1="4" y1="5" x2="20" y2="5"/></svg>
								<span>{m.common_expand_all()}</span>
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
												<Picture src={item.coverUrl} type="posters" sizes="(max-width: 768px) 50vw, 200px" alt={m.series_episode_cover_alt({ episode: item.episode })} width={160} height={90} loading="lazy" class="h-full w-full object-cover" />
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
											<span class="px-2 py-0.5 rounded-full bg-coral/15 text-coral-dark text-[10px] font-bold border border-coral/20 whitespace-nowrap">{m.common_today()}</span>
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
													<p class="mt-1 text-sm text-plum-light">{m.series_trailer_external_notice()}</p>
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
