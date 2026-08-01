<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import WatchedButton from '$lib/components/WatchedButton.svelte';
	import SeriesVideoPlayer from '$lib/components/series/SeriesVideoPlayer.svelte';
	import { getEpisodeListStatus } from '$lib/series/episode-status.js';
	import { m } from '$lib/i18n/paraglide.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import {
		buildBreadcrumbJsonLd,
		buildCanonicalUrl,
		jsonLdScript,
		localizedPath,
		safeJsonLd,
		truncateSeo
	} from '$lib/seo.js';
	import '@splidejs/splide/css/core';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const series = $derived(data.series);
	const title = $derived(data.title);
	const description = $derived(data.description);
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);

	const statusConfig: Record<string, { text: string; live: boolean }> = {
		ONGOING: { text: m.status_ongoing(), live: true },
		UPCOMING: { text: m.status_upcoming(), live: false },
		ENDED: { text: m.status_ended(), live: false }
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
			key: `gallery:${image.id}`,
			src: image.imageUrl,
			alt: image.caption ?? `${series.titleEn} gallery ${index + 1}`,
			caption: image.caption ?? ''
		}))
	);
	const episodeCoverCandidates = $derived(
		series.schedule
			.filter((item) => Boolean(item.coverUrl))
			.map((item) => ({
				key: `episode:${item.episode}:cover`,
				src: item.coverUrl as string,
				alt: m.series_episode_cover_alt({ episode: item.episode }),
				caption: `EP ${item.episode} · ${item.title}`
			}))
	);
	const galleryCandidates = $derived(
		(officialGalleryCandidates.length > 0 ? officialGalleryCandidates : episodeCoverCandidates).slice(0, 10)
	);
	const infoCells = $derived(
		[
			{ label: m.series_detail_studio(), value: series.studio },
			{ label: m.common_episodes(), value: String(series.episodes) },
			{ label: m.common_year(), value: series.year ? String(series.year) : null },
			{ label: m.series_detail_platform(), value: series.platforms.length > 0 ? series.platforms.map((p) => p.name).join(' · ') : null },
			{ label: m.series_detail_genre(), value: series.genres.length > 0 ? series.genres.join(' · ') : null },
			{ label: m.common_cast(), value: m.series_detail_cast_count({ count: String(series.artists.length) }) }
		].filter((cell) => cell.value !== null && cell.value !== '')
	);
	const marqueeText = $derived(
		`✦ ${series.titleEn}${series.titleTh ? ` ✦ ${series.titleTh}` : ''} ✦ ${s ? (series.status === 'ONGOING' ? m.series_detail_now_airing() : s.text) : ''} ✦ ${series.studio} ✦ `
	);

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

	function episodeStatus(item: { episode: number; schedules: { airDateIso: string | null }[] }) {
		return getEpisodeListStatus(item.episode, item.schedules, series.nextEpisode?.episode ?? null, nowTs);
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

	// --- Next-episode countdown (LED cells) ---
	let nowTs = $state(Date.now());

	onMount(() => {
		const timer = setInterval(() => {
			nowTs = Date.now();
		}, 1000);
		return () => clearInterval(timer);
	});

	const countdown = $derived.by(() => {
		if (!series.nextEpisode) return null;
		const target = new Date(series.nextEpisode.airDateIso).getTime();
		const remaining = Math.max(0, target - nowTs);
		if (remaining <= 0) return null;
		const totalSeconds = Math.floor(remaining / 1000);
		return {
			days: Math.floor(totalSeconds / 86400),
			hours: Math.floor((totalSeconds % 86400) / 3600),
			minutes: Math.floor((totalSeconds % 3600) / 60),
			seconds: totalSeconds % 60
		};
	});

	const pad2 = (value: number) => String(value).padStart(2, '0');

	// --- Splide scrollers (client-only; markup below is SSR-safe) ---
	type SplideInstance = InstanceType<typeof import('@splidejs/splide').default>;

	let gallerySplideEl = $state<HTMLElement | undefined>();
	let castSplideEl = $state<HTMLElement | undefined>();

	onMount(() => {
		let disposed = false;
		const mounted: SplideInstance[] = [];
		(async () => {
			const { Splide } = await import('@splidejs/splide');
			if (disposed) return;

			const splideI18n = {
				prev: m.series_detail_slider_prev(),
				next: m.series_detail_slider_next()
			};
			const reducedMotion = { speed: 0, rewindSpeed: 0, autoplay: 'pause' as const };

			if (gallerySplideEl && galleryCandidates.length > 0) {
				mounted.push(
					new Splide(gallerySplideEl, {
						type: 'slide',
						rewind: true,
						arrows: false,
						perPage: 3,
						perMove: 1,
						gap: '12px',
						drag: 'free',
						snap: true,
						speed: 500,
						breakpoints: {
							1099: { perPage: 2 },
							759: { perPage: 1, padding: { right: '18%' } }
						},
						reducedMotion
					}).mount()
				);
			}

			if (castSplideEl && series.artists.length > 0) {
				mounted.push(
					new Splide(castSplideEl, {
						type: 'slide',
						rewind: false,
						autoWidth: true,
						focus: 0,
						omitEnd: true,
						gap: '12px',
						drag: 'free',
						snap: true,
						pagination: false,
						speed: 500,
						i18n: splideI18n,
						reducedMotion
					}).mount()
				);
			}
		})();
		return () => {
			disposed = true;
			for (const splide of mounted) splide.destroy();
		};
	});

	const artistPath = (id: string) => localizedPath(currentLang, `/artists/${id}`);
	const shipPath = (slug: string) => localizedPath(currentLang, `/ships/${slug}`);
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

<div class="sd-page -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[var(--orbit-paper)] pb-[calc(1rem+var(--bottom-nav-reserved-space))] md:mb-0 md:pb-10">
	<!-- Ticker strip -->
	<div class="sd-marquee" aria-hidden="true"><span>{marqueeText}{marqueeText}</span></div>

	<!-- HERO: cover + overlapping poster frame -->
	<header class="sd-hero">
		<div class="sd-cover">
			{#if series.coverUrl}
				<Picture src={series.coverUrl} type="covers" sizes="100vw" alt="" width={1920} height={960} loading="eager" fetchpriority="high" class="sd-cover-img" />
				<div class="sd-cover-tint" aria-hidden="true"></div>
			{:else}
				<Picture src={series.poster} type="posters" sizes="240px" alt="" width={1920} height={960} loading="eager" fetchpriority="high" class="sd-cover-img sd-cover-fb" />
					<div class="sd-cover-tint" aria-hidden="true"></div>
			{/if}
		</div>
		<div class="sd-wrap">
			<div class="sd-hero-inner">
				<div class="sd-poster-frame sd-hud">
					<div class="sd-poster">
						<Picture src={series.poster} type="posters" sizes="(max-width: 759px) 148px, 230px" alt={series.titleEn} width={460} height={690} loading="eager" fetchpriority="high" class="sd-poster-img" />
					</div>
				</div>
				<div class="sd-hero-titles">
					<button type="button" onclick={goBack} class="sd-back">
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
						<span>{m.common_back()}</span>
					</button>
					{#if s}
						<span class="sd-status-chip" class:sd-status-live={s.live}>{s.text}</span>
					{/if}
					<h1 class="sd-title-th">{title}</h1>
					{#if series.titleEn && title !== series.titleEn}
						<p class="sd-title-en">{series.titleEn}</p>
					{:else if series.titleTh && title !== series.titleTh}
						<p class="sd-title-en">{series.titleTh}</p>
					{/if}
				</div>
			</div>
			<div class="sd-actions">
				<FavoriteButton seriesId={series.id} variant="compact" className="sd-btn-like" />
				<WatchedButton seriesId={series.id} variant="compact" className="sd-btn-like" />
				<ShareButton title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : ''}`} text={m.series_share_text({ title })} url={canonicalUrl} ariaLabel={m.series_share_aria_label()} variant="compact" className="sd-btn-like" />
			</div>
		</div>
	</header>

	<main class="sd-wrap">
		<!-- COUNTDOWN -->
		{#if countdown && series.nextEpisode}
			<section aria-labelledby="sd-countdown-heading">
				<div class="sd-sec-head">
					<span class="sd-tag">NEXT</span>
					<h2 id="sd-countdown-heading">{m.series_detail_episode_countdown({ episode: series.nextEpisode.episode })}</h2>
					<span class="sd-line"></span>
				</div>
				<div class="sd-countdown" aria-live="off">
					<div class="sd-cd-cell sd-hud"><b>{pad2(countdown.days)}</b><small>{m.series_detail_days()}</small></div>
					<span class="sd-cd-sep" aria-hidden="true">:</span>
					<div class="sd-cd-cell sd-hud"><b>{pad2(countdown.hours)}</b><small>{m.series_detail_hours()}</small></div>
					<span class="sd-cd-sep" aria-hidden="true">:</span>
					<div class="sd-cd-cell sd-hud"><b>{pad2(countdown.minutes)}</b><small>{m.series_detail_minutes()}</small></div>
					<span class="sd-cd-sep" aria-hidden="true">:</span>
					<div class="sd-cd-cell sd-hud"><b>{pad2(countdown.seconds)}</b><small>{m.series_detail_seconds()}</small></div>
				</div>
			</section>
		{/if}

		<!-- INFO -->
		<section aria-labelledby="sd-info-heading">
			<div class="sd-sec-head">
				<span class="sd-tag">SYS</span>
				<h2 id="sd-info-heading">{m.series_detail_info()}</h2>
				<span class="sd-line"></span>
			</div>
			<div class="sd-info-grid">
				{#each infoCells as cell (cell.label)}
					<div class="sd-info-cell">
						<div class="sd-info-k">{cell.label}</div>
						<div class="sd-info-v">{cell.value}</div>
					</div>
				{/each}
			</div>
			{#if series.studioOfficialSite || series.studioSocials.length > 0}
				<div class="sd-studio-links">
					{#if series.studioOfficialSite}
						<a href={series.studioOfficialSite} target="_blank" rel="noopener noreferrer" class="sd-link-chip">
							<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
							<span>{m.series_detail_official_site()}</span>
						</a>
					{/if}
					{#each series.studioSocials as social (social.url)}
						<a href={social.url} target="_blank" rel="noopener noreferrer" class="sd-link-chip">
							{#if social.iconUrl}<img src={social.iconUrl} alt="" width={16} height={16} loading="lazy" decoding="async" class="h-4 w-4" />{/if}
							<span>{social.platform}</span>
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<!-- SYNOPSIS -->
		{#if description}
			<section aria-labelledby="sd-synopsis-heading">
				<div class="sd-sec-head">
					<span class="sd-tag">TXT</span>
					<h2 id="sd-synopsis-heading">{m.series_detail_synopsis()}</h2>
					<span class="sd-line"></span>
				</div>
				<div class="sd-synopsis">
					<p class:line-clamp-6={!descriptionExpanded && hasLongDescription}>{description}</p>
					{#if hasLongDescription}
						<button type="button" onclick={() => (descriptionExpanded = !descriptionExpanded)} aria-expanded={descriptionExpanded} class="sd-btn sd-synopsis-toggle">
							<span>{descriptionExpanded ? m.series_detail_synopsis_less() : m.series_detail_synopsis_more()}</span>
							<svg class:rotate-180={descriptionExpanded} class="h-4 w-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9 6 6 6-6" /></svg>
						</button>
					{/if}
				</div>
			</section>
		{/if}

		<SeriesVideoPlayer videos={series.videos} lang={currentLang} />

		<!-- GALLERY (Splide) -->
		{#if galleryCandidates.length > 0}
			<section aria-labelledby="sd-gallery-heading">
				<div class="sd-sec-head">
					<span class="sd-tag">IMG</span>
					<h2 id="sd-gallery-heading">{m.series_detail_gallery()}</h2>
					<span class="sd-line"></span>
				</div>
				<div class="sd-splide splide" bind:this={gallerySplideEl} aria-roledescription="carousel">
					<div class="splide__track">
						<div class="splide__list">
							{#each galleryCandidates as image, index (image.key)}
								<div class="splide__slide">
									<figure class="sd-g-item">
										<span class="sd-g-num orbit-round-data" aria-hidden="true">{index + 1}</span>
										<div class="sd-g-ph">
											<Picture src={image.src} type="posters" sizes="(max-width: 759px) 82vw, (max-width: 1099px) 45vw, 30vw" alt={image.alt} width={640} height={480} loading="lazy" class="sd-g-img" />
										</div>
										{#if image.caption}<figcaption class="sd-g-cap">{image.caption}</figcaption>{/if}
									</figure>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</section>
		{/if}

		<!-- SHIPS -->
		{#if series.ships.length > 0}
			<section aria-labelledby="sd-ships-heading">
				<div class="sd-sec-head">
					<span class="sd-tag">OTP</span>
					<h2 id="sd-ships-heading">{m.series_detail_ships()}</h2>
					<span class="sd-line"></span>
				</div>
				<div class="sd-ship-list">
					{#each series.ships as ship (ship.id)}
						<a href={shipPath(ship.slug)} class="sd-ship-sticker">
							<span class="sd-ship-faces">
								<span class="sd-ship-face orbit-round-data">
									<Picture src={ship.artist1Image} type="profiles" sizes="56px" alt={ship.artist1Name} width={112} height={112} loading="lazy" class="sd-ship-img" />
								</span>
								<span class="sd-ship-face orbit-round-data">
									<Picture src={ship.artist2Image} type="profiles" sizes="56px" alt={ship.artist2Name} width={112} height={112} loading="lazy" class="sd-ship-img" />
								</span>
							</span>
							<span class="sd-ship-meta">
								<span class="sd-ship-names">{ship.name}</span>
								<span class="sd-ship-sub">{ship.artist1Name} × {ship.artist2Name}</span>
							</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- CAST (Splide) -->
		{#if series.artists.length > 0}
			<section aria-labelledby="sd-cast-heading">
				<div class="sd-sec-head">
					<span class="sd-tag">PPL</span>
					<h2 id="sd-cast-heading">{m.common_cast()}</h2>
					<span class="sd-line"></span>
				</div>
				<div class="sd-splide sd-cast-splide splide" bind:this={castSplideEl} aria-roledescription="carousel">
					<div class="splide__track">
						<div class="splide__list">
							{#each series.artists as artist (artist.id)}
								<div class="splide__slide sd-cast-slide">
									<a href={artistPath(artist.id)} class="sd-cast-card">
										<span class="sd-cast-avatar orbit-round-data">
											<Picture src={artist.image} type="profiles" sizes="(max-width: 759px) 84px, 104px" alt={artist.name} width={208} height={208} loading="lazy" class="sd-cast-img" />
										</span>
										<span class="sd-cast-n">{artist.name}</span>
										<span class="sd-cast-r">{artist.role}</span>
									</a>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</section>
		{/if}

		<!-- EPISODES -->
		{#if series.schedule.length > 0}
			<section aria-labelledby="sd-episodes-heading">
				<div class="sd-sec-head">
					<span class="sd-tag">EP</span>
					<h2 id="sd-episodes-heading">{m.series_detail_episodes_heading()}</h2>
					<span class="sd-line"></span>
					<button onclick={toggleAll} class="sd-expand-all" aria-label={allExpanded ? m.common_collapse_all() : m.common_expand_all()}>
						<span>{allExpanded ? m.common_collapse_all() : m.common_expand_all()}</span>
					</button>
				</div>
				<ol class="sd-ep-list">
					{#each series.schedule as item (item.episode)}
						{@const hasSchedules = item.schedules.length > 0 && item.schedules.some((schedule: { platform: string }) => schedule.platform !== 'TBA')}
						{@const hasEpisodeContent = hasSchedules || Boolean(item.trailerUrl)}
						{@const trailerEmbedUrl = youtubeEmbedUrl(item.trailerUrl)}
						{@const isOpen = hasEpisodeContent && expandedEpisodes.has(item.episode)}
						{@const epStatus = episodeStatus(item)}
						<li>
							<article class="sd-ep" class:sd-ep-open={isOpen}>
								<button type="button" disabled={!hasEpisodeContent} onclick={() => toggleEpisode(item.episode)} aria-expanded={hasEpisodeContent ? isOpen : undefined} class="sd-ep-head">
									<span class="sd-ep-no">{String(item.episode).padStart(2, '0')}</span>
									<span class="sd-ep-meta">
										<span class="sd-ep-t">{item.title}</span>
										<span class="sd-ep-d">
											{firstAirDate(item)} · {scheduleSummary(item)}
											{#if isToday(item.schedules)} · {m.common_today()}{/if}
											{#if hasUncut(item.schedules)} · {m.common_uncut()}{/if}
										</span>
									</span>
									<span class="sd-ep-st sd-st-{epStatus}">
										{epStatus === 'aired' ? m.series_detail_episode_aired() : epStatus === 'next' ? m.series_detail_episode_next() : m.series_detail_episode_tba()}
									</span>
									{#if hasEpisodeContent}
										<span class="sd-ep-chevron" aria-hidden="true">
											<svg class:rotate-180={isOpen} class="h-4 w-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
										</span>
									{/if}
								</button>

								{#if isOpen}
									<div class="sd-ep-body">
										{#if item.trailerUrl}
											{#if trailerEmbedUrl}
												{#if activatedTrailers.has(item.episode)}
													<div class="overflow-hidden rounded-md bg-[var(--orbit-rail)]"><iframe src={trailerEmbedUrl} title={`Trailer ${item.title}`} class="aspect-video w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
												{:else}
													<button type="button" onclick={(event) => activateTrailer(item.episode, event)} class="group relative flex min-h-[12rem] w-full items-end overflow-hidden rounded-md bg-[var(--orbit-rail)] p-5 text-left text-[var(--orbit-paper)] transition hover:opacity-90 touch-target">
														<div aria-hidden="true" class="orbit-round-data absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-full bg-[var(--orbit-surface)] text-[var(--orbit-ink)] transition group-hover:scale-105"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div>
														<span><span class="block text-[9px] font-black uppercase tracking-[0.25em] opacity-75">{m.series_detail_trailer()}</span><span class="mt-1 block text-base font-bold">{currentLang === 'th' ? 'แตะเพื่อโหลดวิดีโอ' : 'Tap to load video'}</span></span>
													</button>
												{/if}
											{:else}
												<div class="rounded-md border border-[var(--orbit-line)] bg-[var(--orbit-surface)] p-5"><p class="text-sm text-[var(--orbit-muted)]">{m.series_trailer_external_notice()}</p><a href={item.trailerUrl} target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--orbit-coral)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--orbit-coral-dark)] touch-target">{m.series_trailer_open()}<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></div>
											{/if}
										{/if}

										{#if hasSchedules}
											<div class="min-w-0 max-w-full space-y-2 rounded-md border border-[var(--orbit-line)] bg-[var(--orbit-surface)] p-3 sm:p-4">
												{#each item.schedules as schedule}
													{@const hasStreamLink = schedule.streamLink && schedule.streamLink.length > 0}
													<div class="flex min-w-0 max-w-full items-center justify-between gap-2 rounded-md bg-[var(--orbit-paper-deep)] px-3 py-2.5 min-[360px]:gap-3">
														<div class="flex min-w-0 flex-1 items-center gap-2 min-[360px]:gap-3">
															{#if schedule.platformLogo}<img src={schedule.platformLogo} alt={schedule.platform} width={32} height={32} loading="lazy" decoding="async" class="orbit-round-data h-8 w-8 shrink-0 rounded-full object-cover" />{:else}<span class="orbit-round-data grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--orbit-surface)] text-xs font-black text-[var(--orbit-ink)]">{schedule.platform.charAt(0)}</span>{/if}
															<div class="min-w-0 flex-1"><p class="truncate text-sm font-bold text-[var(--orbit-ink)]">{schedule.title || schedule.platform}</p>{#if schedule.title}<p class="mt-0.5 truncate text-[10px] font-semibold text-[var(--orbit-muted)]">{schedule.platform}</p>{/if}<p class="mt-0.5 truncate text-[10px] font-semibold text-[var(--orbit-muted)]">{schedule.airDate}{schedule.isUncut ? ` · ${m.common_uncut()}` : ''}</p></div>
														</div>
														{#if hasStreamLink}<a href={schedule.streamLink} target="_blank" rel="noopener noreferrer" class="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--orbit-coral)] px-3 py-2 text-xs font-bold text-white transition hover:bg-[var(--orbit-coral-dark)] max-[359px]:h-11 max-[359px]:w-11 max-[359px]:justify-center max-[359px]:px-0 touch-target"><span class="max-[359px]:sr-only">{m.series_detail_watch_now()}</span><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>{/if}
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

		<!-- Orbit Halo banner hidden while the feature is closed; restore the moments link section here. -->
	</main>
</div>

<style>
	.sd-page {
		font-family: var(--orbit-font-body, inherit);
		color: var(--orbit-ink);
	}
	.sd-wrap {
		max-width: 72rem;
		margin-inline: auto;
	}

	/* ============ MARQUEE ============ */
	.sd-marquee {
		background: var(--orbit-rail);
		color: var(--orbit-paper);
		font-size: 12px;
		font-weight: var(--orbit-font-label-weight);
		overflow: hidden;
		white-space: nowrap;
		padding: 6px 0;
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
	}
	.sd-marquee span {
		display: inline-block;
		padding-left: 100%;
		animation: sd-mq 24s linear infinite;
	}
	@keyframes sd-mq {
		to { transform: translateX(-100%); }
	}

	/* ============ HERO ============ */
	.sd-hero { position: relative; }
	.sd-cover {
		position: relative;
		height: max(170px, calc(100vw / 3));
		overflow: hidden;
	}
	.sd-cover :global(picture) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.sd-cover :global(.sd-cover-img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center top;
		display: block;
		filter: saturate(1.12) contrast(1.04) brightness(1.01);
	}
	.sd-cover-tint {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		mix-blend-mode: soft-light;
		background:
			linear-gradient(120deg,
				color-mix(in srgb, var(--orbit-coral) 70%, transparent) 0%,
				color-mix(in srgb, var(--orbit-lavender) 70%, transparent) 50%,
				color-mix(in srgb, var(--orbit-mint) 60%, transparent) 100%);
	}
	.sd-cover::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background-image: var(--orbit-accent-image, none);
		background-repeat: repeat;
		opacity: 0.25;
	}
	.sd-cover::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background:
			linear-gradient(180deg, transparent 55%, color-mix(in srgb, var(--orbit-paper) 88%, transparent) 96%, var(--orbit-paper) 100%),
			repeating-linear-gradient(0deg, color-mix(in srgb, var(--orbit-paper) 6%, transparent) 0 2px, transparent 2px 5px);
	}
	.sd-cover :global(.sd-cover-fb) {
		filter: blur(26px) saturate(1.25) brightness(1.03);
		transform: scale(1.2);
	}
	.sd-hero-inner {
		display: flex;
		gap: 18px;
		align-items: flex-end;
		padding: 0 16px;
		margin-top: -96px;
		position: relative;
		z-index: 2;
	}
	.sd-poster-frame {
		flex: 0 0 148px;
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-overlay);
		padding: 6px;
	}
	.sd-poster {
		aspect-ratio: 2 / 3;
		width: 100%;
		overflow: hidden;
		border-radius: calc(var(--orbit-radius-surface) / 2);
		background: var(--orbit-paper-deep);
	}
	.sd-poster :global(.sd-poster-img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.sd-hero-titles {
		padding-bottom: 6px;
		min-width: 0;
	}
	.sd-back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		padding: 4px 12px;
		margin-bottom: 8px;
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		color: var(--orbit-ink);
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow-surface);
		cursor: pointer;
	}
	.sd-back:hover { border-color: var(--orbit-border-interactive); }
	.sd-back:focus-visible { outline: 2px solid var(--orbit-border-focus); outline-offset: 2px; }
	.sd-status-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		background: var(--orbit-mint);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-badge);
		box-shadow: var(--orbit-shadow-interactive);
		padding: 3px 12px;
		margin: 0 0 8px 8px;
	}
	.sd-status-chip::before { content: '●'; color: var(--orbit-muted); }
	.sd-status-live::before { color: var(--orbit-success); }
	.sd-title-th {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: clamp(24px, 6vw, 42px);
		line-height: 1.15;
		overflow-wrap: anywhere;
	}
	.sd-title-en {
		font-size: clamp(12px, 2.4vw, 16px);
		font-weight: var(--orbit-font-label-weight);
		color: var(--orbit-coral-dark);
		margin-top: 4px;
		text-transform: uppercase;
		overflow-wrap: anywhere;
	}

	/* ============ HUD CORNER BRACKETS ============ */
	.sd-hud { position: relative; }
	.sd-hud::before, .sd-hud::after {
		content: '';
		position: absolute;
		width: 10px;
		height: 10px;
		pointer-events: none;
		z-index: 3;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-coral);
	}
	.sd-hud::before { top: -4px; left: -4px; border-right: 0; border-bottom: 0; }
	.sd-hud::after { bottom: -4px; right: -4px; border-left: 0; border-top: 0; }

	/* ============ ACTIONS ============ */
	.sd-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		padding: 18px 16px 4px;
	}
	.sd-actions :global(.sd-btn-like) {
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-interactive);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow-interactive);
		padding: 10px 16px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		color: var(--orbit-ink);
	}
	.sd-actions :global(.sd-btn-like:hover) {
		border-color: var(--orbit-coral-dark);
		box-shadow: var(--orbit-shadow-accent);
	}

	/* ============ SECTIONS ============ */
	.sd-page section { margin-top: 28px; }
	.sd-sec-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		padding: 0 16px;
	}
	.sd-tag {
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		background: var(--orbit-rail);
		color: var(--orbit-paper);
		border-radius: var(--orbit-radius-badge);
		padding: 3px 8px;
		text-transform: uppercase;
	}
	.sd-sec-head h2 {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 17px;
		text-transform: uppercase;
	}
	.sd-line {
		flex: 1;
		height: var(--orbit-border-width);
		background: linear-gradient(90deg, var(--orbit-line-strong), var(--orbit-line), transparent);
	}
	/* ============ COUNTDOWN (LED cells) ============ */
	.sd-countdown {
		display: flex;
		gap: 8px;
		padding: 0 16px;
		align-items: stretch;
	}
	.sd-cd-cell {
		flex: 1 1 0;
		min-width: 0;
		background: var(--orbit-rail);
		color: var(--orbit-success);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-accent);
		text-align: center;
		padding: 12px 6px 10px;
	}
	.sd-cd-cell b {
		display: block;
		line-height: 1;
		letter-spacing: 0.04em;
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: clamp(26px, 7vw, 42px);
		font-variant-numeric: tabular-nums;
	}
	.sd-cd-cell small {
		display: block;
		margin-top: 6px;
		font-size: 9px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--orbit-paper);
		opacity: 0.75;
	}
	.sd-cd-sep {
		align-self: center;
		font-family: var(--orbit-font-display);
		font-size: 22px;
		font-weight: var(--orbit-font-heading-weight);
		color: var(--orbit-coral);
	}

	/* ============ INFO GRID ============ */
	.sd-info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
		padding: 0 16px;
	}
	.sd-info-cell {
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-surface);
		padding: 10px 12px;
		min-width: 0;
	}
	.sd-info-k {
		font-size: 9.5px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		color: var(--orbit-muted);
	}
	.sd-info-v {
		font-weight: var(--orbit-font-heading-weight);
		font-size: 14px;
		margin-top: 3px;
		overflow-wrap: anywhere;
	}
	.sd-studio-links {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 12px 16px 0;
	}
	.sd-link-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		max-width: 100%;
		padding: 6px 12px;
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		color: var(--orbit-ink);
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-badge);
		overflow-wrap: anywhere;
	}
	.sd-link-chip:hover { border-color: var(--orbit-border-interactive); color: var(--orbit-coral-dark); }
	.sd-link-chip:focus-visible { outline: 2px solid var(--orbit-border-focus); outline-offset: 2px; }

	/* ============ SYNOPSIS ============ */
	.sd-synopsis { padding: 0 16px; }
	.sd-synopsis p {
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-left: calc(var(--orbit-border-width) + 2px) var(--orbit-border-style) var(--orbit-coral);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-surface);
		padding: 14px 16px;
		font-size: 14.5px;
		line-height: 1.9;
		white-space: pre-line;
	}
	.sd-btn {
		font-family: var(--orbit-font-body);
		font-weight: var(--orbit-font-label-weight);
		font-size: 13px;
		letter-spacing: var(--orbit-font-letter-spacing);
		color: var(--orbit-ink);
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-interactive);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow-interactive);
		padding: 10px 16px;
		cursor: pointer;
		text-transform: uppercase;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		gap: 7px;
	}
	.sd-btn:hover { box-shadow: var(--orbit-shadow-accent); }
	.sd-btn:focus-visible { outline: 2px solid var(--orbit-border-focus); outline-offset: 2px; }
	.sd-synopsis-toggle { margin-top: 12px; }

	/* ============ VIDEO TABS + CARDS ============ */
	.sd-vid-tabs {
		display: flex;
		gap: 8px;
		padding: 0 16px 12px;
	}
	.sd-vid-tab {
		font-family: var(--orbit-font-body);
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		cursor: pointer;
		color: var(--orbit-ink);
		background: var(--orbit-paper-deep);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-control);
		padding: 8px 14px;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.sd-vid-tab[aria-selected='true'] {
		background: var(--orbit-coral-soft);
		border-color: var(--orbit-border-interactive);
		box-shadow: var(--orbit-shadow-interactive);
	}
	.sd-vid-tab:focus-visible { outline: 2px solid var(--orbit-border-focus); outline-offset: 2px; }
	.sd-video-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 14px;
		padding: 0 16px;
	}
	.sd-video-card {
		background: var(--orbit-rail);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-menu-dialog);
		box-shadow: var(--orbit-shadow-overlay);
		overflow: hidden;
		position: relative;
	}
	/* ============ SPLIDE SCROLLERS ============ */
	.sd-splide { overflow-x: clip; }
	/* splide core hides uninitialized sliders; SSR markup should stay visible */
	.sd-splide:global(.splide) { visibility: visible; }
	/* Responsive pre-init widths mirror Splide options to limit hydration movement. */
	.sd-splide :global(.splide__slide) { flex: 0 0 auto; width: calc((100% - 24px) / 3); }
	.sd-splide :global(.splide__slide.sd-cast-slide) { width: 112px; }
	.sd-splide :global(.splide__pagination) {
		position: static;
		display: flex;
		justify-content: center;
		gap: 8px;
		padding: 10px 0 2px;
	}
	.sd-splide :global(.splide__pagination__page) {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--orbit-line);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		opacity: 1;
		padding: 0;
	}
	.sd-splide :global(.splide__pagination__page.is-active) {
		background: var(--orbit-coral);
		transform: none;
	}
	.sd-cast-splide { position: relative; }
	.sd-cast-splide :global(.splide__arrows) {
		position: absolute;
		z-index: 3;
		top: 28px;
		inset-inline: 8px;
		display: flex;
		justify-content: space-between;
		pointer-events: none;
	}
	.sd-cast-splide :global(.splide__arrow) {
		position: static;
		transform: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: 50%;
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow-interactive);
		color: var(--orbit-ink);
		opacity: 0.94;
		cursor: pointer;
		pointer-events: auto;
	}
	.sd-cast-splide :global(.splide__arrow svg) {
		width: 16px;
		height: 16px;
		fill: currentColor;
	}
	.sd-cast-splide :global(.splide__arrow--prev svg) { transform: scaleX(-1); }
	.sd-cast-splide :global(.splide__arrow:hover) {
		border-color: var(--orbit-border-interactive);
		background: var(--orbit-coral);
		box-shadow: var(--orbit-shadow-accent);
		color: var(--orbit-surface);
	}
	.sd-cast-splide :global(.splide__arrow:focus-visible) {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}
	.sd-cast-splide :global(.splide__arrow:disabled) {
		opacity: 0;
		pointer-events: none;
	}

	/* ============ GALLERY ============ */
	.sd-g-item {
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-surface);
		padding: 5px;
		position: relative;
		margin: 8px 4px 14px;
	}
	.sd-g-ph {
		aspect-ratio: 4 / 3;
		border-radius: calc(var(--orbit-radius-surface) / 2);
		overflow: hidden;
		background: var(--orbit-paper-deep);
	}
	.sd-g-ph :global(.sd-g-img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.sd-g-cap {
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		padding: 6px 2px 2px;
		color: var(--orbit-muted);
		text-transform: uppercase;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.sd-g-num {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 26px;
		height: 26px;
		background: var(--orbit-coral);
		color: #fff;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: 50%;
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--orbit-shadow-interactive);
		z-index: 2;
	}

	/* ============ SHIP STICKERS ============ */
	.sd-ship-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
		padding: 0 16px;
	}
	.sd-ship-sticker {
		background: linear-gradient(90deg, var(--orbit-coral-soft), var(--orbit-lavender));
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-menu-dialog);
		box-shadow: var(--orbit-shadow-accent);
		padding: 14px;
		display: flex;
		align-items: center;
		gap: 14px;
		min-height: 44px;
	}
	.sd-ship-sticker:hover { box-shadow: var(--orbit-shadow-raised); }
	.sd-ship-sticker:focus-visible { outline: 2px solid var(--orbit-border-focus); outline-offset: 2px; }
	.sd-ship-faces { display: flex; align-items: center; }
	.sd-ship-face {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		overflow: hidden;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		box-shadow: var(--orbit-shadow-surface);
		background: var(--orbit-surface);
	}
	.sd-ship-face + .sd-ship-face { margin-left: -14px; }
	.sd-ship-face :global(.sd-ship-img) { width: 100%; height: 100%; object-fit: cover; display: block; }
	.sd-ship-meta { min-width: 0; }
	.sd-ship-names {
		display: block;
		font-family: var(--orbit-font-display);
		font-size: 18px;
		font-weight: var(--orbit-font-heading-weight);
		overflow-wrap: anywhere;
	}
	.sd-ship-sub {
		display: block;
		font-size: 10.5px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		color: var(--orbit-muted);
		text-transform: uppercase;
		overflow-wrap: anywhere;
	}

	/* ============ CAST ============ */
	.sd-cast-card {
		display: block;
		text-align: center;
		padding: 6px 2px 10px;
	}
	.sd-cast-card:focus-visible { outline: 2px solid var(--orbit-border-focus); outline-offset: 2px; }
	.sd-cast-avatar {
		display: block;
		width: 84px;
		height: 84px;
		margin: 0 auto 7px;
		border-radius: 50%;
		overflow: hidden;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		box-shadow: var(--orbit-shadow-surface);
		background: var(--orbit-paper-deep);
	}
	.sd-cast-avatar :global(.sd-cast-img) { width: 100%; height: 100%; object-fit: cover; display: block; }
	.sd-cast-n {
		display: block;
		font-weight: var(--orbit-font-heading-weight);
		font-size: 12.5px;
		overflow-wrap: anywhere;
	}
	.sd-cast-r {
		display: block;
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		color: var(--orbit-muted);
	}

	/* ============ EPISODES ============ */
	.sd-expand-all {
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		color: var(--orbit-ink);
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-badge);
		padding: 6px 12px;
		min-height: 44px;
		white-space: nowrap;
		cursor: pointer;
	}
	.sd-expand-all:hover { border-color: var(--orbit-border-interactive); }
	.sd-expand-all:focus-visible { outline: 2px solid var(--orbit-border-focus); outline-offset: 2px; }
	.sd-ep-list {
		padding: 0 16px;
		display: grid;
		gap: 8px;
		list-style: none;
	}
	/* Grid items must be allowed to shrink below the row's min-content (badge +
	   nowrap date + status), otherwise narrow viewports overflow horizontally. */
	.sd-ep-list > li { min-width: 0; }
	.sd-ep {
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-surface);
		overflow: hidden;
	}
	.sd-ep-head {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 12px;
		min-height: 44px;
		text-align: left;
		cursor: pointer;
		background: transparent;
		border: 0;
		font: inherit;
		color: inherit;
	}
	.sd-ep-head:disabled { cursor: default; }
	.sd-ep-head:not(:disabled):hover { background: var(--orbit-paper-deep); }
	.sd-ep-head:focus-visible { outline: 2px solid var(--orbit-border-focus); outline-offset: -2px; }
	.sd-ep-no {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 14px;
		background: var(--orbit-rail);
		color: var(--orbit-paper);
		border-radius: var(--orbit-radius-badge);
		padding: 4px 10px;
		flex-shrink: 0;
	}
	.sd-ep-open .sd-ep-no { background: var(--orbit-coral); color: #fff; }
	.sd-ep-meta { min-width: 0; flex: 1; }
	.sd-ep-t {
		display: block;
		font-weight: var(--orbit-font-heading-weight);
		font-size: 14px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sd-ep-d {
		display: block;
		font-size: 10.5px;
		font-weight: var(--orbit-font-label-weight);
		color: var(--orbit-muted);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sd-ep-st {
		font-size: 9.5px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-badge);
		padding: 3px 9px;
		text-transform: uppercase;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.sd-st-aired { background: var(--orbit-mint); color: var(--orbit-ink); }
	.sd-st-next { background: var(--orbit-coral); color: #fff; box-shadow: var(--orbit-shadow-interactive); }
	.sd-st-tba { background: var(--orbit-paper-deep); color: var(--orbit-muted); }
	.sd-ep-chevron {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		flex-shrink: 0;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-control);
		background: var(--orbit-surface);
		color: var(--orbit-ink);
	}
	.sd-ep-body {
		display: grid;
		gap: 12px;
		border-top: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		background: var(--orbit-paper-deep);
		padding: 12px;
	}

	/* ============ DESKTOP ============ */
	@media (min-width: 760px) {
		.sd-cover { height: min(calc(100vw / 3), 480px); }
		.sd-hero-inner { margin-top: -128px; padding: 0 28px; gap: 28px; }
		.sd-poster-frame { flex-basis: 230px; }
		.sd-actions, .sd-sec-head, .sd-synopsis, .sd-countdown, .sd-info-grid { padding-left: 28px; padding-right: 28px; }
		.sd-info-grid { grid-template-columns: repeat(3, 1fr); }
		.sd-cd-cell { padding: 16px 10px 12px; }
		.sd-vid-tabs { padding-left: 28px; padding-right: 28px; }
		.sd-video-row { grid-template-columns: 1fr 1fr; padding: 0 28px; }
		.sd-studio-links { padding-left: 28px; padding-right: 28px; }
		.sd-ship-list { grid-template-columns: 1fr 1fr; padding: 0 28px; }
		.sd-ep-list { padding: 0 28px; grid-template-columns: 1fr 1fr; align-items: start; }
		.sd-splide :global(.splide__slide.sd-cast-slide) { width: 132px; }
		.sd-cast-avatar { width: 104px; height: 104px; }
		.sd-cast-splide :global(.splide__arrows) { top: 38px; }
	}
	@media (max-width: 759px) {
		/* Mobile: one full gallery slide with an 18% peek (mirrors Splide padding). */
		.sd-splide :global(.splide__slide:not(.sd-cast-slide)) { width: 82%; }
	}
	@media (min-width: 760px) and (max-width: 1099px) {
		.sd-splide :global(.splide__slide:not(.sd-cast-slide)) { width: calc((100% - 12px) / 2); }
	}

	@media (prefers-reduced-motion: reduce) {
		.sd-marquee span { animation: none; }
	}
</style>
