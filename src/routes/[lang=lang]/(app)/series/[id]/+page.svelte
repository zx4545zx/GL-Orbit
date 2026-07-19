<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import WatchedButton from '$lib/components/WatchedButton.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import { latestMomentsHref } from '$lib/moments/latest-moments.js';
	import {
		buildBreadcrumbJsonLd,
		buildCanonicalUrl,
		jsonLdScript,
		localizedPath,
		safeJsonLd,
		truncateSeo
	} from '$lib/seo.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const series = $derived(data.series);
	const title = $derived(data.title);
	const description = $derived(data.description);
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);

	const statusConfig: Record<string, { text: string; dot: string; chip: string }> = {
		ONGOING: { text: m.status_ongoing(), dot: 'bg-mint', chip: 'text-mint-dark border-mint/40' },
		UPCOMING: { text: m.status_upcoming(), dot: 'bg-lavender', chip: 'text-lavender-dark border-lavender/50' },
		ENDED: { text: m.status_ended(), dot: 'bg-coral', chip: 'text-coral-dark border-coral/40' }
	};

	const s = $derived(statusConfig[series.status] ?? null);
	const titleEnSuffix = $derived(
		series.titleTh && series.titleEn && title !== series.titleEn ? ` (${series.titleEn})` : ''
	);
	const seoTitle = $derived(m.series_detail_seo_title({ title, titleEnSuffix }));
	const seoDescription = $derived(
		truncateSeo(description || m.series_detail_seo_fallback({ title }))
	);
	const canonicalPath = $derived(`/series/${series.id}`);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const seriesJsonLd = $derived(
		safeJsonLd([
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
		])
	);

	const officialGalleryCandidates = $derived(
		series.gallery.map((image, index) => ({
			src: image.imageUrl,
			alt: image.caption ?? `${series.titleEn} gallery ${index + 1}`,
			label: m.series_detail_gallery(),
			title: image.caption ?? ''
		}))
	);
	const episodeCoverCandidates = $derived(
		series.schedule
			.filter((item) => Boolean(item.coverUrl))
			.map((item) => ({
				src: item.coverUrl as string,
				alt: m.series_episode_cover_alt({ episode: item.episode }),
				label: `EP ${item.episode}`,
				title: item.title
			}))
	);
	const galleryCandidates = $derived(
		(officialGalleryCandidates.length > 0 ? officialGalleryCandidates : episodeCoverCandidates).slice(0, 7)
	);
	const primaryMeta = $derived(
		[
			{ label: m.common_episodes(), value: series.episodes },
			{ label: m.common_year(), value: series.year ?? null },
			{ label: m.common_cast(), value: series.artists.length }
		].filter((item) => item.value !== null)
	);
	const momentsHref = $derived(latestMomentsHref(page.data.lang, 'series', series.id));

	let expandedEpisodes = $state(new Set<number>());
	let activatedTrailers = $state(new Set<number>());
	let initializedSeriesId = $state<string | null>(null);
	let descriptionExpanded = $state(false);

	const episodeHasContent = $derived(
		new Set(
			series.schedule
				.filter((item) => {
					const hasSchedules =
						item.schedules.length > 0 &&
						item.schedules.some((schedule: { platform: string }) => schedule.platform !== 'TBA');
					return hasSchedules || Boolean(item.trailerUrl);
				})
				.map((item) => item.episode)
		)
	);
	const allExpanded = $derived(
		episodeHasContent.size > 0 && episodeHasContent.size === expandedEpisodes.size
	);
	const hasLongDescription = $derived((description?.length ?? 0) > 420);

	$effect(() => {
		if (initializedSeriesId !== series.id) {
			expandedEpisodes = new Set<number>();
			activatedTrailers = new Set<number>();
			descriptionExpanded = false;
			initializedSeriesId = series.id;
		}
	});

	function toggleAll() {
		expandedEpisodes = allExpanded
			? new Set<number>()
			: new Set<number>(Array.from(episodeHasContent));
	}

	function toggleEpisode(episode: number) {
		if (expandedEpisodes.has(episode)) {
			expandedEpisodes.delete(episode);
		} else {
			expandedEpisodes.add(episode);
		}
		expandedEpisodes = new Set(expandedEpisodes);
	}

	function activateTrailer(episode: number, event: MouseEvent) {
		event.stopPropagation();
		activatedTrailers.add(episode);
		activatedTrailers = new Set(activatedTrailers);
	}

	function scheduleSummary(item: { schedules: { platform: string; airDate: string }[] }): string {
		const valid = item.schedules.filter((schedule) => schedule.platform !== 'TBA');
		if (valid.length === 0) return 'TBA';
		if (valid.length === 1) return valid[0].platform;
		return m.series_platform_count({ count: String(valid.length) });
	}

	function isToday(schedules: { airDate: string }[]): boolean {
		const today = new Date().toISOString().split('T')[0];
		return schedules.some((schedule) => schedule.airDate === today);
	}

	function hasUncut(schedules: { isUncut: boolean }[]): boolean {
		return schedules.some((schedule) => schedule.isUncut);
	}

	function firstAirDate(item: { schedules: { airDate: string }[] }): string {
		return item.schedules[0]?.airDate ?? 'TBA';
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
					if (['embed', 'shorts', 'live'].includes(parts[0])) videoId = parts[1] ?? null;
				}
			}
			if (!videoId || !/^[\w-]{6,}$/.test(videoId)) return null;
			return `https://www.youtube-nocookie.com/embed/${videoId}`;
		} catch {
			return null;
		}
	}

	const artistPath = (id: string) => localizedPath(currentLang, `/artists/${id}`);
	const shipPath = (slug: string) => localizedPath(currentLang, `/ships/${slug}`);
	const backHref = $derived(localizedPath(currentLang, '/series'));
	const goBack = () => {
		if (typeof history !== 'undefined' && history.length > 1) history.back();
		else goto(localizedPath(currentLang, '/series'));
	};
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

<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[var(--orbit-paper)] pb-[calc(3rem+var(--bottom-nav-reserved-space))] md:-mt-24 md:mb-0 md:pb-20 md:pt-24">
	<main class="relative mx-auto max-w-[90rem] px-4 pt-4 sm:px-6 sm:pt-6 md:px-8">
		<!-- The series artwork leads; actions and facts form a compact program rail. -->
		<section class="border-y border-[var(--orbit-line-strong)] bg-white shadow-[var(--orbit-shadow)] sm:rounded-xl sm:border" aria-labelledby="series-title">
			<header class="flex items-center justify-between gap-3 bg-[var(--orbit-ink)] px-3 py-3 text-white sm:rounded-t-xl sm:px-5">
				<button type="button" onclick={goBack} class="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold transition hover:border-mint hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white touch-target">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
					<span>{m.common_back()}</span>
				</button>
				{#if s}
					<span class="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-black sm:text-sm {s.chip}">
						<span class="h-2 w-2 rounded-full {s.dot}"></span>
						<span>{s.text}</span>
					</span>
				{/if}
			</header>

			<div class="grid min-w-0 lg:grid-cols-[minmax(20rem,0.78fr)_minmax(0,1.45fr)]">
				<figure class="relative bg-[var(--orbit-ink)] p-3 sm:p-6 lg:flex lg:flex-col lg:justify-between lg:rounded-bl-xl lg:p-8">
					<div class="mx-auto w-full max-w-[25rem] overflow-hidden rounded-md border border-white/20 bg-[var(--orbit-paper-deep)] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
						<Picture src={series.poster} type="posters" sizes="(max-width: 639px) calc(100vw - 3.5rem), (max-width: 1023px) 400px, 430px" alt={series.titleEn} width={720} height={1080} loading="eager" fetchpriority="high" class="aspect-[2/3] w-full object-cover" />
					</div>
					<figcaption class="mx-auto mt-3 flex w-full max-w-[25rem] items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[0.22em] text-white/60">
						<span>Official poster</span>
						{#if series.year}<span>{series.year}</span>{/if}
					</figcaption>
				</figure>

				<div class="flex min-w-0 flex-col">
					<div class="flex flex-1 flex-col justify-center p-5 sm:p-8 lg:p-12 xl:p-14">
						<p class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--orbit-coral-dark)]">GL-ORBIT / SERIES DOSSIER</p>
						<h1 id="series-title" class="mt-4 break-words font-[family-name:var(--font-display)] text-[clamp(2.25rem,7vw,3.25rem)] font-black leading-[0.95] tracking-[-0.055em] text-[var(--orbit-ink)] [overflow-wrap:anywhere] lg:text-[clamp(3rem,4vw,4.5rem)]">
							{series.titleEn}
						</h1>
						{#if series.titleTh}
							<p class="mt-5 break-words font-[family-name:var(--font-thai)] text-xl font-semibold leading-snug text-[var(--orbit-muted)] [overflow-wrap:anywhere] sm:text-2xl lg:text-3xl">{series.titleTh}</p>
						{/if}
						<p class="mt-4 break-words text-sm font-bold text-[var(--orbit-muted)] [overflow-wrap:anywhere] sm:text-base">{series.studio}</p>

						<div class="mt-8 -mx-5 grid border-y border-[var(--orbit-line)] px-5 {primaryMeta.length === 3 ? 'grid-cols-[0.75fr_1.5fr_0.75fr]' : 'grid-cols-2'} sm:mt-10 sm:-mx-8 sm:px-8 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none lg:-mx-12 lg:px-12 xl:-mx-14 xl:px-14">
							{#each primaryMeta as item, index}
								<div class="min-w-0 py-4 {index > 0 ? 'border-l border-[var(--orbit-line)] px-3 sm:pl-4 sm:pr-0' : 'pr-3 sm:pr-4'}">
									<div class="whitespace-nowrap font-[family-name:var(--font-display)] text-[clamp(1.125rem,6vw,1.5rem)] font-black leading-none text-[var(--orbit-ink)] sm:text-3xl">{item.value}</div>
									<div class="mt-1 truncate text-[9px] font-black uppercase tracking-[0.15em] text-[var(--orbit-muted)]">{item.label}</div>
								</div>
							{/each}
						</div>

						<div class="mt-6 space-y-4">
							{#if series.genres.length > 0}
								<div class="flex min-w-0 flex-wrap gap-1.5">
									{#each series.genres as genre}
										<span class="rounded-md bg-[var(--orbit-coral-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--orbit-coral-dark)] sm:text-xs">{genre}</span>
									{/each}
								</div>
							{/if}
							{#if series.platforms.length > 0}
								<div class="flex min-w-0 flex-wrap gap-1.5">
									{#each series.platforms as platform}
										<span class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--orbit-line)] bg-white px-2.5 py-1 text-[10px] font-bold text-[var(--orbit-ink)] sm:text-xs">
											{#if platform.logo}<img src={platform.logo} alt="" width={16} height={16} loading="lazy" decoding="async" class="h-4 w-4 rounded-sm object-cover" />{/if}
											<span class="truncate">{platform.name}</span>
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] grid-rows-2 border-t border-[var(--orbit-line-strong)]">
						<FavoriteButton seriesId={series.id} variant="orbit" className="row-span-2 min-h-[10.5rem] !rounded-none !border-y-0 !border-l-0 !border-r !border-[var(--orbit-line-strong)]" />
						<WatchedButton seriesId={series.id} variant="orbit" className="min-h-[5.25rem] !rounded-none !border-x-0 !border-t-0 !border-b !border-[var(--orbit-line-strong)]" />
						<div class="h-full min-w-0">
							<ShareButton title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''}`} text={m.series_share_text({ title })} url={canonicalUrl} ariaLabel={m.series_share_aria_label()} variant="orbit" className="min-h-[5.25rem] !rounded-none !border-0" />
						</div>
					</div>
				</div>
			</div>
		</section>

		{#if description}
			<section class="mt-20 grid border-t border-[var(--orbit-line-strong)] sm:mt-28 lg:grid-cols-12" aria-labelledby="synopsis-heading">
				<header class="pt-6 lg:col-span-3 lg:pr-8 lg:pt-8">
					<p class="text-[10px] font-black uppercase tracking-[0.32em] text-coral-dark">Story file</p>
					<h2 id="synopsis-heading" class="mt-2 max-w-xs text-3xl font-bold text-plum sm:text-5xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-[0.95] tracking-[-0.05em]'}">{m.series_detail_synopsis()}</h2>
				</header>

				<div class="min-w-0 pt-7 lg:col-span-9 lg:border-l lg:border-[var(--orbit-line)] lg:px-10 lg:pt-8 xl:px-14">
					<p class:line-clamp-6={!descriptionExpanded && hasLongDescription} class="max-w-[52rem] whitespace-pre-line font-[family-name:var(--font-thai)] text-base font-medium leading-[1.95] text-plum sm:text-lg sm:leading-[2] lg:text-xl lg:leading-[2.1]">{description}</p>
					{#if hasLongDescription}
						<button type="button" onclick={() => (descriptionExpanded = !descriptionExpanded)} aria-expanded={descriptionExpanded} class="mt-6 inline-flex items-center gap-2 rounded-md bg-plum px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#24151f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint touch-target">
							<span>{descriptionExpanded ? (currentLang === 'th' ? 'ย่อเนื้อหา' : 'Show less') : (currentLang === 'th' ? 'อ่านเรื่องย่อเต็ม' : 'Read full synopsis')}</span>
							<svg class:rotate-180={descriptionExpanded} class="h-4 w-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9 6 6 6-6" /></svg>
						</button>
					{/if}

					<div class="mt-10 grid min-w-0 border-y border-[var(--orbit-line)] sm:grid-cols-2 lg:-mx-10 lg:px-10 xl:-mx-14 xl:px-14">
						<div class="min-w-0 py-5 sm:pr-6">
							<p class="text-[10px] font-black uppercase tracking-[0.28em] text-coral-dark">Studio</p>
							<p class="mt-2 break-words font-[family-name:var(--font-display)] text-xl font-black leading-tight text-plum [overflow-wrap:anywhere] sm:text-2xl">{series.studio}</p>
						</div>
						{#if series.studioOfficialSite || series.studioSocials.length > 0}
							<div class="flex min-w-0 flex-wrap content-center gap-2 border-t border-[var(--orbit-line)] py-4 sm:border-l sm:border-t-0 sm:pl-6">
								{#if series.studioOfficialSite}
									<a href={series.studioOfficialSite} target="_blank" rel="noopener noreferrer" class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--orbit-line)] bg-white px-3.5 py-2 text-xs font-bold text-plum transition hover:border-coral hover:text-coral-dark touch-target">
										<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
										<span class="min-w-0 break-words [overflow-wrap:anywhere]">{m.series_detail_official_site()}</span>
									</a>
								{/if}
								{#each series.studioSocials as social}
									<a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.platform} class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--orbit-line)] bg-white px-3 py-2 text-xs font-bold text-plum transition hover:border-coral hover:text-coral-dark touch-target">
										{#if social.iconUrl}<img src={social.iconUrl} alt="" width={16} height={16} loading="lazy" decoding="async" class="h-4 w-4 rounded-sm" />{/if}
										<span class="min-w-0 break-words [overflow-wrap:anywhere]">{social.platform}</span>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</section>
		{/if}

		{#if series.artists.length > 0}
			<section class="mt-24 border-t border-[var(--orbit-line-strong)] pt-6 sm:mt-32 sm:pt-8" aria-labelledby="cast-heading">
				<header class="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-12">
					<div>
						<h2 id="cast-heading" class="text-3xl font-bold text-plum sm:text-5xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.05em]'}">{m.common_cast()}</h2>
					</div>
					<div class="flex min-h-11 items-center border border-[var(--orbit-line-strong)] bg-mint px-3 text-center font-[family-name:var(--font-display)] text-xl font-black text-plum sm:px-4 sm:text-2xl">
						<span>{series.artists.length}<small class="ml-1 text-[8px] font-black uppercase tracking-[0.18em]">{m.common_people()}</small></span>
					</div>
				</header>

				<div class="grid grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-6 lg:gap-y-12">
					{#each series.artists as artist, index (artist.id)}
						<a href={artistPath(artist.id)} class="group min-w-0 border-t border-[var(--orbit-line)] pt-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:pt-3">
							<div class="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-2 sm:block">
								<div class="relative overflow-hidden rounded-md bg-lavender/25">
									<Picture src={artist.image} type="profiles" sizes="(max-width: 639px) 56px, (max-width: 1024px) 24vw, 220px" alt={artist.name} width={320} height={400} loading="lazy" class="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.025] sm:aspect-[4/5]" />
									<span aria-hidden="true" class="absolute left-2 top-2 hidden bg-coral px-2 py-1 font-[family-name:var(--font-display)] text-[10px] font-black text-white sm:block">{String(index + 1).padStart(2, '0')}</span>
								</div>
								<div class="min-w-0 sm:pt-3">
									<h3 class="break-words text-[11px] font-black leading-[1.35] text-plum transition [overflow-wrap:anywhere] group-hover:text-coral-dark min-[360px]:text-xs sm:text-base sm:leading-[1.45]">{artist.name}</h3>
									<p class="mt-1 truncate font-[family-name:var(--font-thai)] text-[10px] font-medium text-plum-light/65 sm:text-sm">{artist.role}</p>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if series.ships.length > 0}
			<section class="mt-24 border-t border-[var(--orbit-line-strong)] pt-6 text-plum sm:mt-32 sm:pt-8" aria-labelledby="ships-heading">
				<header class="mb-8 sm:mb-12">
					<p class="text-[10px] font-black uppercase tracking-[0.32em] text-coral-dark">03 / Chemistry</p>
					<h2 id="ships-heading" class="mt-2 text-3xl font-bold sm:text-5xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.05em]'}">{m.series_detail_ships()}</h2>
				</header>
				<div class="grid grid-cols-1 gap-px border border-[var(--orbit-line)] bg-[var(--orbit-line)] min-[340px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					{#each series.ships as ship (ship.id)}
						<a href={shipPath(ship.slug)} class="group min-w-0 bg-white p-3 transition hover:bg-[var(--orbit-coral-soft)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral sm:p-5">
							<div class="mx-auto flex max-w-[10rem] items-center justify-center">
								<div class="relative z-10 w-[62%] overflow-hidden rounded-full border-[3px] border-white bg-coral-light shadow-sm">
									<Picture src={ship.artist1Image} type="profiles" sizes="(max-width: 639px) 84px, 140px" alt={ship.artist1Name} width={280} height={280} loading="lazy" class="aspect-square w-full object-cover transition duration-300 group-hover:-rotate-2" />
								</div>
								<div class="relative -ml-[23%] mt-10 w-[62%] overflow-hidden rounded-full border-[3px] border-white bg-lavender-light shadow-sm">
									<Picture src={ship.artist2Image} type="profiles" sizes="(max-width: 639px) 84px, 140px" alt={ship.artist2Name} width={280} height={280} loading="lazy" class="aspect-square w-full object-cover transition duration-300 group-hover:rotate-2" />
								</div>
							</div>
							<div class="mt-4 min-w-0 text-center">
								<h3 class="break-words font-[family-name:var(--font-display)] text-sm font-black leading-tight tracking-[-0.035em] text-plum [overflow-wrap:anywhere] sm:text-xl">{ship.name}</h3>
								<p class="mt-1 break-words text-[9px] font-semibold leading-[1.45] text-plum-light/65 [overflow-wrap:anywhere] sm:text-xs">{ship.artist1Name} × {ship.artist2Name}</p>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if galleryCandidates.length >= 3}
			<section class="mt-24 border-t border-[var(--orbit-line-strong)] pt-6 sm:mt-32 sm:pt-8" aria-labelledby="gallery-heading">
				<header class="mb-8 sm:mb-10">
					<p class="text-[10px] font-black uppercase tracking-[0.32em] text-coral-dark">04 / Stills</p>
					<h2 id="gallery-heading" class="mt-2 text-3xl font-bold text-plum sm:text-5xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.05em]'}">{m.series_detail_gallery()}</h2>
				</header>
				<div class="grid auto-rows-[8rem] grid-cols-12 gap-2 sm:auto-rows-[11rem] sm:gap-3">
					{#each galleryCandidates as image, index (image.src)}
						<figure class="group relative overflow-hidden rounded-md bg-plum {index === 0 ? 'col-span-12 row-span-3 sm:col-span-7' : index === 1 || index === 2 ? 'col-span-6 row-span-2 sm:col-span-5' : 'col-span-6 row-span-2 sm:col-span-4'}">
							<Picture src={image.src} type="posters" sizes={index === 0 ? '(max-width: 768px) 92vw, 760px' : '(max-width: 768px) 46vw, 440px'} alt={image.alt} width={index === 0 ? 760 : 440} height={index === 0 ? 570 : 330} loading="lazy" class="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100" />
							<figcaption class="absolute inset-x-0 bottom-0 bg-plum/90 p-4 text-white">
								<span class="block text-[9px] font-black uppercase tracking-[0.24em] text-coral-light">{image.label}</span>
								{#if image.title}<span class="mt-1 block truncate text-sm font-bold">{image.title}</span>{/if}
							</figcaption>
						</figure>
					{/each}
				</div>
			</section>
		{/if}

		{#if series.schedule.length > 0}
			<section class="mt-24 grid border-t border-[var(--orbit-line-strong)] pt-6 sm:mt-32 sm:pt-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12" aria-labelledby="schedule-heading">
				<header class="pb-8 lg:sticky lg:top-28 lg:self-start lg:pb-0">
					<h2 id="schedule-heading" class="max-w-xs text-3xl font-bold text-plum sm:text-5xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-[0.95] tracking-[-0.05em]'}">{m.common_schedule()}</h2>
					<p class="mt-4 max-w-[14rem] text-sm font-medium leading-6 text-plum-light/60">{series.schedule.length} {m.common_episodes()}</p>
					<button onclick={toggleAll} class="mt-4 inline-flex items-center gap-2 rounded-md bg-plum px-4 py-2.5 text-xs font-bold text-white transition hover:bg-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral touch-target" aria-label={allExpanded ? m.common_collapse_all() : m.common_expand_all()}>
						<span>{allExpanded ? m.common_collapse_all() : m.common_expand_all()}</span>
						<svg class="h-4 w-4 transition-transform {allExpanded ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
					</button>
				</header>

				<ol class="min-w-0 divide-y divide-[var(--orbit-line)] border-y border-[var(--orbit-line-strong)] bg-white">
					{#each series.schedule as item (item.episode)}
						{@const hasSchedules = item.schedules.length > 0 && item.schedules.some((schedule: { platform: string }) => schedule.platform !== 'TBA')}
						{@const hasEpisodeMedia = Boolean(item.trailerUrl)}
						{@const hasEpisodeContent = hasSchedules || hasEpisodeMedia}
						{@const trailerEmbedUrl = youtubeEmbedUrl(item.trailerUrl)}
						{@const isOpen = hasEpisodeContent && expandedEpisodes.has(item.episode)}
						<li class="min-w-0">
							<article class="min-w-0 max-w-full overflow-hidden">
								<button type="button" disabled={!hasEpisodeContent} onclick={() => toggleEpisode(item.episode)} aria-expanded={hasEpisodeContent ? isOpen : undefined} class="grid w-full grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3 p-3 text-left transition hover:bg-[var(--orbit-paper-deep)] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-coral disabled:cursor-default disabled:hover:bg-white sm:grid-cols-[5.25rem_minmax(0,1fr)_auto] sm:gap-x-5 sm:p-5">
									<div class="grid aspect-square place-items-center rounded-md border border-[var(--orbit-line)] {isOpen ? 'bg-coral text-white' : 'bg-cream text-plum'} transition-colors">
										<span class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.06em] sm:text-4xl">{String(item.episode).padStart(2, '0')}</span>
									</div>
									<div class="min-w-0">
										<p class="text-[9px] font-black uppercase tracking-[0.24em] text-coral-dark">Episode {item.episode}</p>
										<h3 class="mt-1 truncate font-[family-name:var(--font-display)] text-lg font-black tracking-[-0.025em] text-plum sm:text-2xl">{item.title}</h3>
										<p class="mt-1 truncate text-xs font-semibold text-plum-light/55 sm:text-sm">{scheduleSummary(item)}</p>
									</div>
									<div class="col-span-2 flex flex-wrap items-center justify-end gap-2 sm:col-span-1 sm:flex-nowrap">
										{#if isToday(item.schedules)}<span class="rounded-md bg-coral/12 px-2.5 py-1 text-[10px] font-bold text-coral-dark">{m.common_today()}</span>{/if}
										{#if hasUncut(item.schedules)}<span class="rounded-md bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">{m.common_uncut()}</span>{/if}
										<span class="whitespace-nowrap text-xs font-bold text-plum-light/65 sm:text-sm">{firstAirDate(item)}</span>
										{#if hasEpisodeContent}
											<span class="grid h-9 w-9 place-items-center rounded-md border border-[var(--orbit-line)] bg-white text-plum"><svg class="h-4 w-4 transition-transform duration-300 {isOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></span>
										{/if}
									</div>
								</button>

								{#if isOpen}
									<div class="grid min-w-0 gap-3 border-t border-[var(--orbit-line)] bg-[var(--orbit-paper-deep)] p-3 sm:p-5 {item.trailerUrl && hasSchedules ? 'lg:grid-cols-2' : ''}">
										{#if item.trailerUrl}
											{#if trailerEmbedUrl}
												{#if activatedTrailers.has(item.episode)}
													<div class="overflow-hidden rounded-md bg-plum"><iframe src={trailerEmbedUrl} title={`Trailer ${item.title}`} class="aspect-video w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
												{:else}
													<button type="button" onclick={(event) => activateTrailer(item.episode, event)} class="group relative flex min-h-[12rem] w-full items-end overflow-hidden rounded-md bg-plum p-5 text-left text-white transition hover:bg-coral-dark touch-target">
														<div aria-hidden="true" class="absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-full bg-white text-plum transition group-hover:scale-105"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div>
														<span><span class="block text-[9px] font-black uppercase tracking-[0.25em] text-coral-light">Trailer</span><span class="mt-1 block text-base font-bold">{currentLang === 'th' ? 'แตะเพื่อโหลดวิดีโอ' : 'Tap to load video'}</span></span>
													</button>
												{/if}
											{:else}
												<div class="rounded-md border border-[var(--orbit-line)] bg-white p-5"><p class="text-sm text-plum-light">{m.series_trailer_external_notice()}</p><a href={item.trailerUrl} target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-2 rounded-md bg-coral px-4 py-2 text-sm font-bold text-white transition hover:bg-coral-dark touch-target">{m.series_trailer_open()}<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></div>
											{/if}
										{/if}

										{#if hasSchedules}
											<div class="min-w-0 max-w-full space-y-2 rounded-md border border-[var(--orbit-line)] bg-white p-3 sm:p-4">
												{#each item.schedules as schedule}
													{@const hasStreamLink = schedule.streamLink && schedule.streamLink.length > 0}
													<div class="flex min-w-0 max-w-full items-center justify-between gap-2 rounded-md bg-cream/70 px-3 py-2.5 min-[360px]:gap-3">
														<div class="flex min-w-0 flex-1 items-center gap-2 min-[360px]:gap-3">
															{#if schedule.platformLogo}<img src={schedule.platformLogo} alt={schedule.platform} width={32} height={32} loading="lazy" decoding="async" class="h-8 w-8 shrink-0 rounded-full object-cover" />{:else}<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-plum">{schedule.platform.charAt(0)}</span>{/if}
															<div class="min-w-0 flex-1"><p class="truncate text-sm font-bold text-plum">{schedule.title || schedule.platform}</p>{#if schedule.title}<p class="mt-0.5 truncate text-[10px] font-semibold text-plum-light/55">{schedule.platform}</p>{/if}<p class="mt-0.5 truncate text-[10px] font-semibold text-plum-light/55">{schedule.airDate}{schedule.isUncut ? ` · ${m.common_uncut()}` : ''}</p></div>
														</div>
														{#if hasStreamLink}<a href={schedule.streamLink} target="_blank" rel="noopener noreferrer" class="inline-flex shrink-0 items-center gap-1 rounded-md bg-coral px-3 py-2 text-xs font-bold text-white transition hover:bg-coral-dark max-[359px]:h-11 max-[359px]:w-11 max-[359px]:justify-center max-[359px]:px-0 touch-target"><span class="max-[359px]:sr-only">{m.series_detail_watch_now()}</span><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>{/if}
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/if}
							</article>
						</li>
					{/each}
				</ol>
			</section>
		{/if}

		<section class="mt-24 flex flex-wrap items-end justify-between gap-6 bg-plum px-6 py-8 text-white sm:mt-32 sm:px-10 sm:py-10">
				<div>
					<p class="text-[10px] font-black uppercase tracking-[0.32em] text-mint">Orbit Halo</p>
					<h2 class="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold leading-none tracking-[-0.05em] sm:text-5xl">Latest Moments</h2>
				</div>
				<a href={momentsHref} class="inline-flex min-h-11 items-center gap-3 bg-white px-5 text-sm font-bold text-plum transition hover:bg-coral-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
					<span>{currentLang === 'th' ? 'ดู Moment ทั้งหมด' : 'View all moments'}</span>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-6-6 6 6-6 6" /></svg>
				</a>
		</section>
	</main>
</div>
