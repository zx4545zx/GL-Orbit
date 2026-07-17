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

<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-cream pb-[calc(3rem+var(--bottom-nav-reserved-space))] md:-mt-24 md:mb-0 md:pb-20 md:pt-24">
	<div aria-hidden="true" class="pointer-events-none absolute left-[-12rem] top-[36rem] h-[34rem] w-[34rem] rounded-full bg-lavender/20 blur-3xl"></div>
	<div aria-hidden="true" class="pointer-events-none absolute right-[-14rem] top-[78rem] h-[38rem] w-[38rem] rounded-full bg-coral/15 blur-3xl"></div>

	<div class="relative mx-auto max-w-[90rem] px-4 pt-4 sm:px-6 sm:pt-6 md:px-8">
		<!-- Cover, poster, and title each get their own visual plane. -->
		<section class="relative isolate overflow-hidden rounded-[1.75rem] bg-white shadow-[0_36px_90px_-44px_rgba(45,27,46,0.35)] sm:rounded-[2.5rem]">
			{#if series.coverUrl}
				<div class="relative aspect-[21/9] overflow-hidden bg-lavender-light">
					<Picture
						src={series.coverUrl}
						type="covers"
						sizes="100vw"
						alt={series.titleEn}
						width={1440}
						height={810}
						loading="eager"
						fetchpriority="high"
						class="absolute inset-0 h-full w-full object-cover"
					/>
				</div>
			{/if}

			<div class="z-0 flex items-center justify-between gap-3 p-4 sm:p-7 {series.coverUrl ? 'absolute inset-x-0 top-0' : 'relative border-b border-plum/5 bg-cream/60'}">
				<button
					type="button"
					onclick={goBack}
					class="inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-sm font-bold text-plum shadow-lg backdrop-blur-md transition hover:bg-coral hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral touch-target"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
					<span>{m.common_back()}</span>
				</button>
				{#if s}
					<span class="inline-flex items-center gap-2 rounded-full border bg-white/92 px-3.5 py-2 text-xs font-black shadow-lg backdrop-blur-md sm:text-sm {s.chip}">
						<span class="h-2 w-2 rounded-full {s.dot}"></span>
						<span>{s.text}</span>
					</span>
				{/if}
			</div>

			<div class="relative px-5 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8 lg:min-h-[28rem] lg:py-12 lg:pl-[26rem] lg:pr-14">
				<div class="relative z-10 mx-auto w-[78vw] max-w-[18rem] rotate-[1.5deg] sm:w-[18rem] lg:absolute lg:bottom-6 lg:left-14 lg:rotate-[2.5deg]">
					<div class="overflow-hidden rounded-[1.75rem] bg-white p-2 shadow-[0_28px_65px_-24px_rgba(45,27,46,0.45)] ring-1 ring-plum/8">
						<Picture src={series.poster} type="posters" sizes="(max-width: 333px) 72vw, 240px" alt={series.titleEn} width={480} height={720} loading="eager" class="aspect-[2/3] w-full rounded-[1.3rem] object-cover" />
					</div>
					<div class="absolute -bottom-3 -left-3 grid h-14 w-14 -rotate-[8deg] place-items-center rounded-full bg-coral text-center text-white shadow-xl sm:h-16 sm:w-16 lg:-bottom-4 lg:-left-5 lg:h-20 lg:w-20">
						<span class="font-[family-name:var(--font-display)] text-lg font-black leading-none sm:text-xl lg:text-2xl">{series.episodes}<small class="mt-1 block text-[7px] font-bold uppercase tracking-[0.2em] lg:text-[8px]">EP</small></span>
					</div>
				</div>

				<div class="mt-6 min-w-0 text-center lg:mt-0 lg:text-left">
					<p class="mb-4 text-[10px] font-black uppercase tracking-[0.42em] text-coral-dark sm:text-xs">GL-ORBIT / SERIES FILE</p>
					<h1 class="break-words font-[family-name:var(--font-display)] text-[clamp(1.75rem,7.5vw,2.25rem)] font-black leading-[0.92] tracking-[-0.04em] text-plum [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl xl:text-6xl">
						{series.titleEn}
					</h1>
					{#if series.titleTh}
						<p class="mt-5 font-[family-name:var(--font-thai)] text-xl font-semibold leading-snug text-plum-light/80 sm:text-2xl lg:text-3xl">
							{series.titleTh}
						</p>
					{/if}
					<p class="mt-5 text-sm font-semibold text-plum-light/55 sm:text-base">{series.studio}</p>
				</div>
			</div>
		</section>

		<!-- Command deck: actions and facts share one horizontal surface. -->
		<div class="relative z-30 mx-3 mt-5 overflow-visible rounded-[1.75rem] bg-white p-3 shadow-[0_28px_70px_-38px_rgba(45,27,46,0.65)] sm:mx-8 sm:p-5 lg:mx-14 lg:grid lg:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.6fr)] lg:items-center lg:gap-8">
			<div class="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 sm:gap-3">
				<FavoriteButton seriesId={series.id} variant="orbit" />
				<WatchedButton seriesId={series.id} variant="orbit" />
				<div class="col-span-2 h-full w-[calc(50%-0.25rem)] justify-self-center min-[360px]:col-span-1 min-[360px]:w-full">
					<ShareButton title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''}`} text={m.series_share_text({ title })} url={canonicalUrl} ariaLabel={m.series_share_aria_label()} variant="orbit" />
				</div>
			</div>

			<div class="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-cream p-3 lg:mt-0 lg:grid-cols-[repeat(3,minmax(4.5rem,auto))_1fr] lg:items-center lg:gap-5">
				{#each primaryMeta as item}
					<div class="min-w-0 text-center lg:text-left">
						<div class="font-[family-name:var(--font-display)] text-xl font-black leading-none text-plum sm:text-2xl">{item.value}</div>
						<div class="mt-1 truncate text-[9px] font-black uppercase tracking-[0.16em] text-plum-light/55 sm:text-[10px]">{item.label}</div>
					</div>
				{/each}
				<div class="col-span-3 mt-1 flex flex-wrap justify-center gap-1.5 lg:col-span-1 lg:mt-0 lg:justify-end">
					{#each series.genres as genre}
						<span class="rounded-full bg-coral/12 px-2.5 py-1 text-[10px] font-bold text-coral-dark sm:text-xs">{genre}</span>
					{/each}
					{#each series.platforms as platform}
						<span class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-plum-light shadow-sm sm:text-xs">
							{#if platform.logo}<img src={platform.logo} alt="" width={16} height={16} loading="lazy" decoding="async" class="h-4 w-4 rounded-full object-cover" />{/if}
							<span class="truncate">{platform.name}</span>
						</span>
					{/each}
				</div>
			</div>
		</div>

		<!-- Chapter 01: synopsis becomes the visual lead, not a text block beside a poster. -->
		{#if description}
			<section class="mt-20 grid gap-6 sm:mt-28 lg:grid-cols-12 lg:gap-8" aria-labelledby="synopsis-heading">
				<header class="lg:col-span-4 lg:pt-8">
					<p class="font-[family-name:var(--font-display)] text-7xl font-black leading-none tracking-[-0.08em] text-coral/25 sm:text-9xl">01</p>
					<p class="mt-3 text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">Story file</p>
					<h2 id="synopsis-heading" class="mt-2 max-w-xs text-4xl font-black text-plum sm:text-6xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-[0.95] tracking-[-0.055em]'}">{m.series_detail_synopsis()}</h2>
				</header>

				<div class="relative overflow-hidden rounded-[2.25rem] bg-coral-light/35 p-6 sm:rounded-[3rem] sm:p-10 lg:col-span-8 lg:p-14">
					<div aria-hidden="true" class="absolute -right-10 -top-16 font-[family-name:var(--font-display)] text-[18rem] font-black leading-none text-white/45">“</div>
					<p class:line-clamp-6={!descriptionExpanded && hasLongDescription} class="relative whitespace-pre-line font-[family-name:var(--font-thai)] text-base font-medium leading-[1.9] text-plum sm:text-lg sm:leading-[2] lg:text-xl lg:leading-[2.1]">
						{description}
					</p>
					{#if hasLongDescription}
						<button type="button" onclick={() => (descriptionExpanded = !descriptionExpanded)} aria-expanded={descriptionExpanded} class="relative mt-6 inline-flex items-center gap-2 rounded-full bg-plum px-5 py-2.5 text-sm font-bold text-white transition hover:bg-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum touch-target">
							<span>{descriptionExpanded ? (currentLang === 'th' ? 'ย่อเนื้อหา' : 'Show less') : (currentLang === 'th' ? 'อ่านเรื่องย่อเต็ม' : 'Read full synopsis')}</span>
							<svg class:rotate-180={descriptionExpanded} class="h-4 w-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9 6 6 6-6" /></svg>
						</button>
					{/if}

					<div class="relative mt-10 grid min-w-0 gap-3 sm:grid-cols-2">
						<div class="min-w-0 rounded-[1.75rem] bg-white/70 p-5 backdrop-blur-sm">
							<p class="text-[10px] font-black uppercase tracking-[0.28em] text-coral-dark">Studio</p>
							<p class="mt-2 break-words font-[family-name:var(--font-display)] text-base font-black leading-tight text-plum [overflow-wrap:anywhere] min-[360px]:text-xl">{series.studio}</p>
						</div>
						{#if series.studioOfficialSite || series.studioSocials.length > 0}
							<div class="flex min-w-0 flex-wrap content-center gap-2 rounded-[1.75rem] bg-plum p-4">
								{#if series.studioOfficialSite}
									<a href={series.studioOfficialSite} target="_blank" rel="noopener noreferrer" class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-plum transition hover:bg-coral hover:text-white touch-target">
										<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
										<span class="min-w-0 break-words [overflow-wrap:anywhere]">{m.series_detail_official_site()}</span>
									</a>
								{/if}
								{#each series.studioSocials as social}
									<a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.platform} class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/12 px-3 py-2 text-xs font-bold text-white transition hover:bg-white hover:text-plum touch-target">
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

		<!-- Chapter 02: compact roster on mobile, portrait wall on larger screens. -->
		{#if series.artists.length > 0}
			<section class="mt-24 sm:mt-32 perf-section" aria-labelledby="cast-heading">
				<header class="mb-6 flex flex-wrap items-end justify-between gap-5 sm:mb-14">
					<div>
						<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">02 / Ensemble</p>
						<h2 id="cast-heading" class="mt-2 text-5xl font-black text-plum sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{m.common_cast()}</h2>
					</div>
					<div class="flex min-h-11 items-center rounded-full bg-mint px-3 text-center font-[family-name:var(--font-display)] text-xl font-black text-plum sm:grid sm:h-24 sm:w-24 sm:place-items-center sm:px-0 sm:text-4xl">
						<span>{series.artists.length}<small class="ml-1 text-[7px] font-black uppercase tracking-[0.2em] sm:ml-0 sm:block sm:text-[8px]">{m.common_people()}</small></span>
					</div>
				</header>

				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-6 lg:gap-y-16">
					{#each series.artists as artist, index (artist.id)}
						<a href={artistPath(artist.id)} class="group flex min-w-0 items-center gap-2 rounded-[1.25rem] border border-white/80 bg-white/70 p-2 shadow-[0_14px_34px_-28px_rgba(45,27,46,0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:block sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none {index % 2 === 1 ? 'sm:mt-8' : ''}">
							<div class="relative shrink-0">
								<span aria-hidden="true" class="absolute -left-1 -top-5 z-10 hidden font-[family-name:var(--font-display)] text-5xl font-black tracking-[-0.08em] text-coral sm:block">{String(index + 1).padStart(2, '0')}</span>
								<div class="h-14 w-14 overflow-hidden rounded-[1.1rem] bg-lavender/25 shadow-sm sm:h-auto sm:w-auto sm:rounded-t-[999px] sm:rounded-b-[1.5rem] sm:shadow-[0_24px_50px_-34px_rgba(45,27,46,0.65)]">
									<Picture src={artist.image} type="profiles" sizes="(max-width: 639px) 56px, (max-width: 1024px) 24vw, 220px" alt={artist.name} width={320} height={400} loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] sm:aspect-[4/5] sm:h-auto" />
								</div>
							</div>
							<div class="min-w-0 flex-1 sm:px-1 sm:pt-4">
								<h3 class="break-words text-[11px] font-black leading-[1.35] text-plum transition [overflow-wrap:anywhere] group-hover:text-coral-dark min-[360px]:text-xs sm:text-base sm:leading-[1.45]">{artist.name}</h3>
								<p class="mt-1 truncate font-[family-name:var(--font-thai)] text-[10px] font-medium text-plum-light/65 sm:text-sm">{artist.role}</p>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Chapter 03: ships sit inside a soft editorial interlude. -->
		{#if series.ships.length > 0}
			<section class="mt-20 overflow-hidden rounded-[2rem] bg-lavender-light/70 p-4 text-plum min-[360px]:p-5 sm:mt-36 sm:rounded-[3rem] sm:p-10 lg:p-14 perf-section" aria-labelledby="ships-heading">
				<header class="mb-6 sm:mb-14">
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">03 / Chemistry</p>
					<h2 id="ships-heading" class="mt-2 text-4xl font-black sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{m.series_detail_ships()}</h2>
				</header>
				<div class="grid grid-cols-2 gap-2 sm:gap-4 {series.ships.length === 1 ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}">
					{#each series.ships as ship (ship.id)}
						<a href={shipPath(ship.slug)} class="group relative min-h-0 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/75 p-3 shadow-[0_18px_45px_rgba(45,27,46,0.08)] transition hover:-translate-y-1 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:min-h-[23rem] sm:rounded-[2rem] sm:p-5 sm:shadow-[0_24px_60px_rgba(45,27,46,0.09)] {series.ships.length === 1 ? 'col-span-2 sm:grid sm:min-h-0 sm:grid-cols-[18rem_minmax(0,1fr)] sm:items-center sm:gap-10 sm:p-8 lg:col-span-1' : ''}">
							<div aria-hidden="true" class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-coral/15 blur-2xl sm:-right-10 sm:-top-10 sm:h-40 sm:w-40"></div>
							<div class="relative mx-auto flex max-w-[8.5rem] items-center justify-center sm:mt-2 sm:max-w-[17rem] {series.ships.length === 1 ? 'sm:mt-0' : ''}">
								<div class="relative z-10 w-[62%] overflow-hidden rounded-full border-[3px] border-white bg-coral-light shadow-md sm:border-4 sm:shadow-lg">
									<Picture src={ship.artist1Image} type="profiles" sizes="(max-width: 639px) 84px, 190px" alt={ship.artist1Name} width={320} height={320} loading="lazy" class="aspect-square w-full object-cover transition duration-500 group-hover:-rotate-2 group-hover:scale-105" />
								</div>
								<div class="relative -ml-[24%] mt-10 w-[62%] overflow-hidden rounded-full border-[3px] border-white bg-lavender-light shadow-md sm:mt-24 sm:border-4 sm:shadow-lg">
									<Picture src={ship.artist2Image} type="profiles" sizes="(max-width: 639px) 84px, 190px" alt={ship.artist2Name} width={320} height={320} loading="lazy" class="aspect-square w-full object-cover transition duration-500 group-hover:rotate-2 group-hover:scale-105" />
								</div>
							</div>
							<div class="relative mt-3 text-center sm:mt-5 {series.ships.length === 1 ? 'sm:mt-0 sm:text-left' : ''}">
								<h3 class="break-words font-[family-name:var(--font-display)] text-[10px] font-black leading-tight tracking-[-0.06em] text-plum [overflow-wrap:anywhere] min-[360px]:text-xs sm:text-2xl sm:tracking-[-0.04em] {series.ships.length === 1 ? 'sm:text-5xl' : ''}">{ship.name}</h3>
								<p class="mt-1 break-words text-[9px] font-semibold leading-[1.45] text-plum-light/65 [overflow-wrap:anywhere] min-[360px]:text-[10px] sm:text-xs sm:leading-relaxed">{ship.artist1Name} × {ship.artist2Name}</p>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if galleryCandidates.length >= 3}
			<section class="mt-24 sm:mt-32 perf-section" aria-labelledby="gallery-heading">
				<header class="mb-8 sm:mb-10">
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">04 / Stills</p>
					<h2 id="gallery-heading" class="mt-2 text-5xl font-black text-plum sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{m.series_detail_gallery()}</h2>
				</header>
				<div class="grid auto-rows-[8rem] grid-cols-12 gap-2 sm:auto-rows-[11rem] sm:gap-3">
					{#each galleryCandidates as image, index (image.src)}
						<figure class="group relative overflow-hidden rounded-[1.5rem] bg-plum perf-card {index === 0 ? 'col-span-12 row-span-3 sm:col-span-7' : index === 1 || index === 2 ? 'col-span-6 row-span-2 sm:col-span-5' : 'col-span-6 row-span-2 sm:col-span-4'}">
							<Picture src={image.src} type="posters" sizes={index === 0 ? '(max-width: 768px) 92vw, 760px' : '(max-width: 768px) 46vw, 440px'} alt={image.alt} width={index === 0 ? 760 : 440} height={index === 0 ? 570 : 330} loading="lazy" class="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100" />
							<figcaption class="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(45,27,46,0.9),transparent)] p-4 pt-12 text-white">
								<span class="block text-[9px] font-black uppercase tracking-[0.24em] text-coral-light">{image.label}</span>
								{#if image.title}<span class="mt-1 block truncate text-sm font-bold">{image.title}</span>{/if}
							</figcaption>
						</figure>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Episode ledger replaces the former vertical timeline. -->
		{#if series.schedule.length > 0}
			<section class="mt-24 grid gap-8 sm:mt-32 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12 perf-section" aria-labelledby="schedule-heading">
				<header class="lg:sticky lg:top-28 lg:self-start">
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">05 / Episodes</p>
					<h2 id="schedule-heading" class="mt-2 max-w-xs text-5xl font-black text-plum sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-[0.88] tracking-[-0.065em]'}">{m.common_schedule()}</h2>
					<p class="mt-5 max-w-[14rem] text-sm font-medium leading-6 text-plum-light/60">{series.schedule.length} {m.common_episodes()}</p>
					<button onclick={toggleAll} class="mt-5 inline-flex items-center gap-2 rounded-full bg-plum px-4 py-2.5 text-xs font-bold text-white transition hover:bg-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral touch-target" aria-label={allExpanded ? m.common_collapse_all() : m.common_expand_all()}>
						<span>{allExpanded ? m.common_collapse_all() : m.common_expand_all()}</span>
						<svg class="h-4 w-4 transition-transform {allExpanded ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
					</button>
				</header>

				<ol class="min-w-0 space-y-3">
					{#each series.schedule as item (item.episode)}
						{@const hasSchedules = item.schedules.length > 0 && item.schedules.some((schedule: { platform: string }) => schedule.platform !== 'TBA')}
						{@const hasEpisodeMedia = Boolean(item.trailerUrl)}
						{@const hasEpisodeContent = hasSchedules || hasEpisodeMedia}
						{@const trailerEmbedUrl = youtubeEmbedUrl(item.trailerUrl)}
						{@const isOpen = hasEpisodeContent && expandedEpisodes.has(item.episode)}
						<li class="min-w-0">
							<article class="min-w-0 max-w-full overflow-hidden rounded-[1.5rem] bg-white shadow-[0_18px_46px_-38px_rgba(45,27,46,0.75)] transition hover:shadow-[0_22px_52px_-34px_rgba(45,27,46,0.55)] perf-card">
								<button type="button" disabled={!hasEpisodeContent} onclick={() => toggleEpisode(item.episode)} aria-expanded={hasEpisodeContent ? isOpen : undefined} class="grid w-full grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3 p-3 text-left focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-coral disabled:cursor-default sm:grid-cols-[5.25rem_minmax(0,1fr)_auto] sm:gap-x-5 sm:p-5">
									<div class="grid aspect-square place-items-center rounded-[1.2rem] {isOpen ? 'bg-coral text-white' : 'bg-cream text-plum'} transition-colors">
										<span class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.06em] sm:text-4xl">{String(item.episode).padStart(2, '0')}</span>
									</div>
									<div class="min-w-0">
										<p class="text-[9px] font-black uppercase tracking-[0.24em] text-coral-dark">Episode {item.episode}</p>
										<h3 class="mt-1 truncate font-[family-name:var(--font-display)] text-lg font-black tracking-[-0.025em] text-plum sm:text-2xl">{item.title}</h3>
										<p class="mt-1 truncate text-xs font-semibold text-plum-light/55 sm:text-sm">{scheduleSummary(item)}</p>
									</div>
									<div class="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
										{#if isToday(item.schedules)}<span class="rounded-full bg-coral/12 px-2.5 py-1 text-[10px] font-bold text-coral-dark">{m.common_today()}</span>{/if}
										{#if hasUncut(item.schedules)}<span class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">{m.common_uncut()}</span>{/if}
										<span class="whitespace-nowrap text-xs font-bold text-plum-light/65 sm:text-sm">{firstAirDate(item)}</span>
										{#if hasEpisodeContent}
											<span class="grid h-9 w-9 place-items-center rounded-full bg-cream text-plum"><svg class="h-4 w-4 transition-transform duration-300 {isOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></span>
										{/if}
									</div>
								</button>

								{#if isOpen}
									<div class="grid min-w-0 gap-3 bg-coral-light/40 p-3 sm:p-5 {item.trailerUrl && hasSchedules ? 'lg:grid-cols-2' : ''}">
										{#if item.trailerUrl}
											{#if trailerEmbedUrl}
												{#if activatedTrailers.has(item.episode)}
													<div class="overflow-hidden rounded-[1.25rem] bg-plum"><iframe src={trailerEmbedUrl} title={`Trailer ${item.title}`} class="aspect-video w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
												{:else}
													<button type="button" onclick={(event) => activateTrailer(item.episode, event)} class="group relative flex min-h-[12rem] w-full items-end overflow-hidden rounded-[1.25rem] bg-plum p-5 text-left text-white transition hover:bg-coral-dark touch-target">
														<div aria-hidden="true" class="absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-full bg-white text-plum transition group-hover:scale-110"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div>
														<span class="relative"><span class="block text-[9px] font-black uppercase tracking-[0.25em] text-coral-light">Trailer</span><span class="mt-1 block text-base font-bold">{currentLang === 'th' ? 'แตะเพื่อโหลดวิดีโอ' : 'Tap to load video'}</span></span>
													</button>
												{/if}
											{:else}
												<div class="rounded-[1.25rem] bg-white p-5"><p class="text-sm text-plum-light">{m.series_trailer_external_notice()}</p><a href={item.trailerUrl} target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-bold text-white transition hover:bg-coral-dark touch-target">{m.series_trailer_open()}<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></div>
											{/if}
										{/if}

										{#if hasSchedules}
											<div class="min-w-0 max-w-full space-y-2 rounded-[1.25rem] bg-white p-3 sm:p-4">
												{#each item.schedules as schedule}
													{@const hasStreamLink = schedule.streamLink && schedule.streamLink.length > 0}
													<div class="flex min-w-0 max-w-full items-center justify-between gap-2 rounded-xl bg-cream/70 px-3 py-2.5 min-[360px]:gap-3">
														<div class="flex min-w-0 flex-1 items-center gap-2 min-[360px]:gap-3">
															{#if schedule.platformLogo}<img src={schedule.platformLogo} alt={schedule.platform} width={32} height={32} loading="lazy" decoding="async" class="h-8 w-8 shrink-0 rounded-full object-cover" />{:else}<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-plum">{schedule.platform.charAt(0)}</span>{/if}
															<div class="min-w-0 flex-1"><p class="truncate text-sm font-bold text-plum">{schedule.platform}</p><p class="truncate mt-0.5 text-[10px] font-semibold text-plum-light/55">{schedule.airDate}{schedule.isUncut ? ` · ${m.common_uncut()}` : ''}</p></div>
														</div>
														{#if hasStreamLink}<a href={schedule.streamLink} target="_blank" rel="noopener noreferrer" class="inline-flex shrink-0 items-center gap-1 rounded-full bg-coral px-3 py-2 text-xs font-bold text-white transition hover:bg-coral-dark max-[359px]:h-11 max-[359px]:w-11 max-[359px]:justify-center max-[359px]:px-0 touch-target"><span class="max-[359px]:sr-only">{m.series_detail_watch_now()}</span><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>{/if}
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

		<section class="relative mt-24 overflow-hidden rounded-[2.25rem] bg-lavender/35 p-7 sm:mt-32 sm:rounded-[3rem] sm:p-12">
			<div aria-hidden="true" class="absolute -right-10 -top-16 h-64 w-64 rounded-full border-[3.5rem] border-white/50"></div>
			<div aria-hidden="true" class="absolute bottom-8 right-40 hidden h-5 w-5 rounded-full bg-coral sm:block"></div>
			<div class="relative flex min-w-0 flex-wrap items-end justify-between gap-6">
				<div class="min-w-0 max-w-full">
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">Orbit Halo</p>
					<h2 class="mt-2 max-w-full break-words font-[family-name:var(--font-display)] text-[1.75rem] font-black leading-[0.95] tracking-[-0.055em] text-plum [overflow-wrap:anywhere] min-[360px]:text-4xl sm:text-6xl">Latest Moments</h2>
				</div>
				<a href={momentsHref} class="inline-flex max-w-full items-center gap-3 rounded-full bg-plum px-5 py-3 text-sm font-bold text-white transition hover:bg-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum touch-target">
					<span class="min-w-0 break-words [overflow-wrap:anywhere]">{currentLang === 'th' ? 'ดู Moment ทั้งหมด' : 'View all moments'}</span>
					<svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-6-6 6 6-6 6" /></svg>
				</a>
			</div>
		</section>
	</div>
</div>
