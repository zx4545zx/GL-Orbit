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


	const officialGalleryCandidates = $derived(
		series
			? series.gallery.map((image, index) => ({
					src: image.imageUrl,
					alt: image.caption ?? `${series.titleEn} gallery ${index + 1}`,
					label: 'Gallery',
					title: image.caption ?? ''
				}))
			: []
	);
	const episodeCoverCandidates = $derived(
		series
			? series.schedule
					.filter((item) => Boolean(item.coverUrl))
					.map((item) => ({
						src: item.coverUrl as string,
						alt: m.series_episode_cover_alt({ episode: item.episode }),
						label: `EP ${item.episode}`,
						title: item.title
					}))
			: []
	);
	const galleryCandidates = $derived((officialGalleryCandidates.length > 0 ? officialGalleryCandidates : episodeCoverCandidates).slice(0, 7));
	const primaryMeta = $derived([
		{ label: m.common_episodes(), value: series?.episodes ?? null },
		{ label: m.common_year(), value: series?.year ?? null },
		{ label: m.common_cast(), value: series?.artists.length ?? null }
	].filter((item) => item.value !== null));

	// --- Collapsible schedule state ---
	let expandedEpisodes = $state(new Set<number>());
	let activatedTrailers = $state(new Set<number>());
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
			expandedEpisodes = new Set<number>();
		} else {
			expandedEpisodes = new Set<number>(Array.from(episodeHasContent) as number[]);
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

	function activateTrailer(ep: number, event: MouseEvent) {
		event.stopPropagation();
		activatedTrailers.add(ep);
		activatedTrailers = new Set(activatedTrailers);
	}

	$effect(() => {
		if (series && initializedSeriesId !== series.id) {
			expandedEpisodes = new Set<number>();
			activatedTrailers = new Set<number>();
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
	<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[linear-gradient(180deg,#FFF5F7_0%,#F7EEFF_42%,#F9FFFC_100%)] pb-[calc(2rem+var(--bottom-nav-reserved-space))] text-plum md:mb-0 md:-mt-24 md:pb-12 md:pt-24">
		<div class="pointer-events-none absolute left-[-4rem] top-10 h-40 w-40 rounded-full bg-coral/10 blur-2xl md:h-72 md:w-72 md:bg-coral/15"></div>
		<div class="pointer-events-none absolute right-[-5rem] top-48 h-44 w-44 rounded-full bg-lavender/14 blur-2xl md:h-80 md:w-80 md:bg-lavender/18"></div>
		<div class="pointer-events-none absolute bottom-24 left-1/4 h-36 w-36 rounded-full bg-mint/10 blur-2xl md:h-72 md:w-72"></div>

		<div class="relative mx-auto max-w-7xl px-4 pt-5 sm:pt-8 md:px-6">
			<button onclick={() => history.back()} class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3.5 py-2 text-sm font-semibold text-plum-light shadow-lg shadow-lavender/15 backdrop-blur-xl transition-all duration-300 hover:-translate-x-1 hover:border-coral/40 hover:bg-white/85 hover:text-coral-dark sm:mb-8 sm:text-base touch-target">
				<svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
				<span>{m.common_back()}</span>
			</button>

			<section class="relative z-10 grid gap-6 pb-10 md:grid-cols-[minmax(18rem,0.84fr)_minmax(0,1.35fr)] md:items-end md:gap-10 lg:gap-14">
				<div class="relative mx-auto w-full max-w-[21rem] md:max-w-none">
					<div class="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-coral/18 via-lavender/16 to-mint/10 blur-xl md:-inset-4 md:blur-2xl"></div>
					<div class="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 shadow-[0_18px_48px_-28px_rgba(139,92,246,0.45)] md:rounded-[2.25rem] md:shadow-2xl md:shadow-lavender/20 perf-card">
						<Picture src={series.poster} type="posters" sizes="(max-width: 768px) 84vw, 430px" alt={series.titleEn} width={480} height={720} loading="eager" fetchpriority="high" class="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
						<div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-plum/42 to-transparent"></div>

					</div>

					<div class="relative z-20 -mt-4 rounded-[1.5rem] border border-white/80 bg-white/86 p-2 shadow-[0_12px_34px_-24px_rgba(139,92,246,0.55)] md:-mt-5 md:rounded-[1.75rem] md:p-2.5">
						<div class="grid grid-cols-2 gap-2">
							<FavoriteButton seriesId={series.id} className="w-full justify-start bg-white/95 text-plum" />
							<WatchedButton seriesId={series.id} className="w-full justify-start bg-white/95 text-plum" />
							<div class="col-span-2">
								<ShareButton
									title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''}`}
									text={m.series_share_text({ title })}
									url={canonicalUrl}
									ariaLabel={m.series_share_aria_label()}
									variant="command"
									className="w-full justify-start bg-white/95 text-plum"
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="min-w-0 pb-1 md:pb-8">
					<div class="mb-4 flex flex-wrap items-center gap-2">
						{#if s}
							<span class="rounded-full border border-mint/25 bg-mint/18 px-3 py-1.5 text-xs font-bold text-mint-dark shadow-lg shadow-mint/10 backdrop-blur-xl sm:text-sm">{s.text}</span>
						{/if}
						<span class="rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-xs font-semibold text-plum-light shadow-sm shadow-lavender/10 backdrop-blur-xl sm:text-sm">{series.studio}{#if series.year} • {series.year}{/if}</span>
					</div>

					<h1 class="max-w-full break-words font-[family-name:var(--font-display)] text-[clamp(1.9rem,3.6vw,3.65rem)] font-extrabold leading-[1.16] tracking-[-0.025em] text-plum [overflow-wrap:anywhere]">
						{series.titleEn}
					</h1>
					{#if series.titleTh}
						<p class="mt-3 max-w-3xl font-[family-name:var(--font-thai)] text-lg font-semibold text-plum-light sm:text-xl md:text-2xl">{series.titleTh}</p>
					{/if}

					{#if description}
						<div class="mt-6 max-w-4xl rounded-[1.5rem] border border-white/80 bg-white/82 p-4 shadow-[0_14px_38px_-30px_rgba(139,92,246,0.45)] sm:p-5 md:rounded-[1.7rem]">
							<p
								bind:this={descriptionEl}
								class="font-[family-name:var(--font-thai)] text-sm leading-8 text-plum-light sm:text-base sm:leading-9 {isDescriptionExpanded ? '' : 'line-clamp-2'} motion-safe:transition-all motion-safe:duration-300 ease-out"
							>
								{description}
							</p>
							{#if showReadMoreButton}
								<button type="button" onclick={() => (isDescriptionExpanded = !isDescriptionExpanded)} class="mt-3 inline-flex items-center gap-1 rounded-full bg-coral/10 px-3 py-1.5 text-sm font-bold text-coral-dark transition-colors hover:bg-coral/20 hover:text-coral-dark touch-target">
									{isDescriptionExpanded ? m.series_description_collapse() : m.series_description_read_more()}
								</button>
							{/if}
						</div>
					{/if}

					<div class="mt-6 grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3">
						{#each primaryMeta as item}
							<div class="rounded-2xl border border-white/80 bg-white/78 p-3 text-center shadow-[0_10px_28px_-24px_rgba(139,92,246,0.45)] perf-card">
								<div class="text-2xl font-black text-coral-dark sm:text-3xl">{item.value}</div>
								<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-plum-light/65 sm:text-xs">{item.label}</div>
							</div>
						{/each}
					</div>

					{#if series.genres.length > 0 || series.platforms.length > 0}
						<div class="mt-5 flex flex-wrap gap-2">
							{#each series.genres as genre}
								<span class="rounded-full border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral-dark shadow-lg shadow-coral/10 sm:text-sm">{genre}</span>
							{/each}
							{#each series.platforms as platform}
								<span class="inline-flex max-w-full items-center gap-2 rounded-full border border-lavender/25 bg-white/65 px-3 py-1.5 text-xs font-semibold text-plum-light shadow-sm shadow-lavender/10 backdrop-blur-xl sm:text-sm">
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
			<section class="relative z-10 mb-10 sm:mb-12 perf-section">
				<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
					<div>
						<p class="text-[10px] font-bold uppercase tracking-[0.28em] text-coral-light/70">Cast constellation</p>
						<h2 class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-plum sm:text-4xl">{m.common_cast()}</h2>
					</div>
					<span class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-plum-light shadow-lg shadow-lavender/10 backdrop-blur-xl">{series.artists.length} {m.common_people()}</span>
				</div>

				<div class="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
					{#each series.artists as artist}
						<a
							href={`/artists/${artist.id}`}
							class="group relative min-w-[16rem] snap-start overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/78 p-3 shadow-[0_12px_32px_-26px_rgba(139,92,246,0.5)] transition-colors duration-200 hover:border-coral/30 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-coral sm:min-w-0 sm:p-4 perf-card"
						>
							<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,107,157,0.2),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
							<div class="relative flex items-center gap-3 sm:gap-4">
								<Picture src={artist.image} type="profiles" sizes="96px" alt={artist.name} width={64} height={64} loading="lazy" class="h-14 w-14 flex-shrink-0 rounded-2xl border border-white/70 object-cover shadow-lg shadow-lavender/15 transition-transform duration-300 group-hover:rotate-[-2deg] group-hover:scale-105 sm:h-16 sm:w-16" />
								<div class="min-w-0">
									<div class="truncate text-sm font-extrabold text-plum sm:text-base">{artist.name}</div>
									<div class="mt-1 text-xs font-medium text-plum-light sm:text-sm">{artist.role}</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Scene gallery: uses official series gallery first, then falls back to episode covers. -->
		{#if galleryCandidates.length >= 3}
			<section class="relative z-10 mb-10 sm:mb-12 perf-section">
				<div class="mb-4 text-center sm:mb-6">
					<p class="text-[10px] font-bold uppercase tracking-[0.34em] text-mint-dark/70">Scene reel</p>
					<h2 class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-plum sm:text-4xl">Gallery</h2>
				</div>

				<div class="grid grid-cols-2 gap-2 sm:grid-cols-6 sm:gap-3">
					{#each galleryCandidates as image, index}
						<figure class="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_12px_34px_-28px_rgba(139,92,246,0.5)] perf-card {index === 0 ? 'col-span-2 sm:col-span-3 sm:row-span-2' : 'sm:col-span-3 lg:col-span-2'}">
							<Picture src={image.src} type="posters" sizes={index === 0 ? '(max-width: 768px) 92vw, 640px' : '(max-width: 768px) 46vw, 360px'} alt={image.alt} width={index === 0 ? 640 : 360} height={index === 0 ? 360 : 203} loading="lazy" decoding="async" class="aspect-video h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
							<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-75"></div>
							<figcaption class="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/78 sm:bottom-3 sm:left-3 sm:right-3">
								<span>{image.label}</span>
								<span class="truncate text-right normal-case tracking-normal">{image.title}</span>
							</figcaption>
						</figure>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Schedule with collapsible rows -->
		{#if series.schedule.length > 0}
			<section class="relative z-10 perf-section">
				<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
					<div>
						<p class="text-[10px] font-bold uppercase tracking-[0.28em] text-lavender-dark/75">Episode orbit</p>
						<h2 class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-plum sm:text-4xl">{m.common_schedule()}</h2>
					</div>
					<button onclick={toggleAll} class="inline-flex items-center gap-1 rounded-full border border-coral/30 bg-coral/10 py-1 pl-2 pr-3 text-xs font-bold text-coral-dark shadow-lg shadow-coral/10 transition-all duration-200 hover:border-coral/50 hover:bg-coral/25 active:scale-95 touch-target whitespace-nowrap" aria-label={allExpanded ? m.common_collapse_all() : m.common_expand_all()}>
						{#if allExpanded}
							<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 15 12 7 20 15"/><line x1="4" y1="19" x2="20" y2="19"/></svg>
							<span>{m.common_collapse_all()}</span>
						{:else}
							<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 9 12 17 20 9"/><line x1="4" y1="5" x2="20" y2="5"/></svg>
							<span>{m.common_expand_all()}</span>
						{/if}
					</button>
				</div>
				<div class="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/80 shadow-[0_16px_42px_-30px_rgba(139,92,246,0.5)] md:rounded-[2rem] perf-card">
					<div class="divide-y divide-lavender/15">
						{#each series.schedule as item}
							{@const hasSchedules = item.schedules.length > 0 && item.schedules.some((s: { platform: string }) => s.platform !== 'TBA')}
							{@const hasEpisodeMedia = Boolean(item.trailerUrl)}
							{@const hasEpisodeContent = hasSchedules || hasEpisodeMedia}
							{@const trailerEmbedUrl = youtubeEmbedUrl(item.trailerUrl)}
							<div class="transition-colors duration-200 {hasEpisodeContent ? 'hover:bg-white/75 cursor-pointer' : ''}"
								role="button"
								tabindex={hasEpisodeContent ? 0 : undefined}
								onclick={hasEpisodeContent ? () => toggleEpisode(item.episode) : undefined}
								onkeydown={hasEpisodeContent ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEpisode(item.episode); } } : undefined}
								aria-expanded={hasEpisodeContent ? expandedEpisodes.has(item.episode) : undefined}
							>
								<div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
									<div class="flex min-w-0 items-center gap-3 sm:gap-4">
										{#if item.coverUrl}
											<div class="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-lavender/10 shadow-lg shadow-lavender/10 sm:h-16 sm:w-28">
												<Picture src={item.coverUrl} type="posters" sizes="(max-width: 768px) 40vw, 220px" alt={m.series_episode_cover_alt({ episode: item.episode })} width={220} height={124} loading="lazy" class="h-full w-full object-cover" />
												<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
													<span class="text-[10px] font-black text-white">EP {item.episode}</span>
												</div>
											</div>
										{:else}
											<div class="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl border border-white/70 bg-white/65 shadow-lg shadow-lavender/10 sm:h-14 sm:w-14">
												<span class="text-sm font-black text-coral-dark">{item.episode}</span>
											</div>
										{/if}
										<div class="min-w-0">
											<div class="truncate text-sm font-extrabold text-plum sm:text-base">{item.title}</div>
											<div class="mt-1 truncate text-xs font-medium text-plum-light/75 sm:text-sm">{scheduleSummary(item)}</div>
										</div>
									</div>
									<div class="flex flex-shrink-0 items-center gap-2 sm:gap-3">
										{#if isToday(item.schedules)}
											<span class="rounded-full border border-coral/30 bg-coral/15 px-2 py-0.5 text-[10px] font-bold text-coral-dark whitespace-nowrap">{m.common_today()}</span>
										{/if}
										{#if hasUncut(item.schedules)}
											<span class="hidden rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 sm:inline-flex">{m.common_uncut()}</span>
										{/if}
										<span class="text-xs font-semibold text-coral-dark sm:text-sm whitespace-nowrap">{firstAirDate(item)}</span>
										{#if hasEpisodeContent}
											<svg class="h-4 w-4 text-plum-light/75 transition-transform duration-200 sm:h-5 sm:w-5 {expandedEpisodes.has(item.episode) ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
											</svg>
										{/if}
									</div>
								</div>

								{#if hasEpisodeContent && expandedEpisodes.has(item.episode)}
									<div class="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5 animate-fade-in">
										{#if item.trailerUrl}
											{#if trailerEmbedUrl}
												{#if activatedTrailers.has(item.episode)}
													<div class="overflow-hidden rounded-2xl border border-white/70 bg-plum/90 shadow-[0_18px_44px_-28px_rgba(45,27,46,0.55)]">
														<iframe src={trailerEmbedUrl} title={`Trailer ${item.title}`} class="aspect-video w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
													</div>
												{:else}
													<button type="button" onclick={(event) => activateTrailer(item.episode, event)} class="flex w-full items-center justify-between gap-3 rounded-2xl border border-coral/15 bg-coral/8 px-4 py-3 text-left shadow-[0_10px_28px_-24px_rgba(255,107,157,0.55)] transition-colors hover:bg-coral/12 touch-target">
														<span>
															<span class="block text-xs font-bold uppercase tracking-[0.18em] text-coral-dark">Trailer</span>
															<span class="mt-1 block text-sm font-semibold text-plum">แตะเพื่อโหลดวิดีโอ</span>
														</span>
														<svg class="h-5 w-5 flex-shrink-0 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-5.197-3.03A1 1 0 008 9.002v5.996a1 1 0 001.555.832l5.197-2.966a1 1 0 000-1.696z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
													</button>
												{/if}
											{:else}
												<div class="rounded-2xl border border-white/80 bg-white/72 p-4 shadow-[0_10px_28px_-24px_rgba(139,92,246,0.45)]">
													<p class="text-xs font-bold uppercase tracking-[0.22em] text-lavender-dark/75">Trailer</p>
													<p class="mt-1 text-sm text-plum-light">{m.series_trailer_external_notice()}</p>
													<a href={item.trailerUrl} target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-bold text-white shadow-[0_12px_28px_-18px_rgba(255,107,157,0.7)] transition-colors hover:bg-coral-dark touch-target">
														{m.series_trailer_open()}
														<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
													</a>
												</div>
											{/if}
										{/if}

										{#each item.schedules as sch}
											{@const hasStreamLink = sch.streamLink && sch.streamLink.length > 0}
											<div class="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/65 px-3 py-2 sm:px-4">
												<div class="flex min-w-0 items-center gap-2 sm:gap-3">
													{#if sch.platformLogo}
														<img src={sch.platformLogo} alt={sch.platform} width={28} height={28} loading="lazy" decoding="async" class="h-6 w-6 flex-shrink-0 rounded-full border border-white/70 object-cover sm:h-7 sm:w-7" />
													{:else}
														<div class="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border border-lavender/25 bg-lavender/10 sm:h-7 sm:w-7"><span class="text-[10px] font-bold text-lavender-dark">{sch.platform.charAt(0)}</span></div>
													{/if}
													<div class="min-w-0">
														<div class="flex items-center gap-1.5">
															<span class="truncate text-sm font-semibold text-plum sm:text-base">{sch.platform}</span>
															{#if sch.isUncut}
																<span class="flex-shrink-0 rounded-md border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{m.common_uncut()}</span>
															{/if}
														</div>
														<div class="text-xs text-plum-light/70">{sch.airDate}</div>
													</div>
												</div>
												{#if hasStreamLink}
													<a href={sch.streamLink} target="_blank" rel="noopener noreferrer" class="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-coral to-coral-dark px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-coral/20 transition-all duration-200 hover:from-coral-dark hover:to-coral touch-target sm:text-sm">
														{m.series_watch_now()}
														<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
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
