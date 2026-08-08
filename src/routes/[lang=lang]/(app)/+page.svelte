<script lang="ts">
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { m, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { NewsItem } from '$lib/types/whats-on.js';
	import {
		DEFAULT_OG_IMAGE,
		OG_IMAGE_HEIGHT,
		OG_IMAGE_TYPE,
		OG_IMAGE_WIDTH,
		SITE_NAME,
		absoluteUrl,
		buildBreadcrumbJsonLd,
		buildCanonicalUrl,
		buildWebPageJsonLd,
		defaultSeoDescription,
		defaultSeoTitle,
		jsonLdScript,
		localizedPath,
		safeJsonLd,
		schemaLanguage
	} from '$lib/seo.js';
	import type { CountdownItem, FeaturedSeriesItem, UpcomingScheduleItem } from '$lib/types/home.js';
	import type { PageData } from './$types.js';
	import NewsCarousel from './whats-on/NewsCarousel.svelte';

	let { data }: { data: PageData } = $props();

	const pageTitle = $derived(defaultSeoTitle(page.data.lang));
	const pageDescription = $derived(defaultSeoDescription(page.data.lang));
	const featuredSeries = $derived<FeaturedSeriesItem[]>(data.featuredSeries);
	const upcomingSchedule = $derived<UpcomingScheduleItem[]>(data.upcomingSchedule);
	const countdownItems = $derived<CountdownItem[]>(data.countdown);
	const latestNews = $derived<NewsItem[]>(data.latestNews);
	// data.latestMoment intentionally unused while Orbit Halo is closed.

	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, ''));
	const homeJsonLd = $derived(
		safeJsonLd([
			buildWebPageJsonLd(page.url.origin, localizedPath(currentLang, ''), pageTitle, pageDescription, currentLang),
			{
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				name: SITE_NAME,
				url: canonicalUrl,
				inLanguage: schemaLanguage(currentLang),
				potentialAction: {
					'@type': 'SearchAction',
					target: `${absoluteUrl(page.url.origin, localizedPath(currentLang, '/series'))}?search={search_term_string}`,
					'query-input': 'required name=search_term_string'
				}
			},
			{
				'@context': 'https://schema.org',
				'@type': 'Organization',
				name: SITE_NAME,
				url: canonicalUrl,
				logo: absoluteUrl(page.url.origin, '/icons/gl-orbit-icon.png'),
				description: pageDescription,
				inLanguage: schemaLanguage(currentLang)
			},
			buildBreadcrumbJsonLd(page.url.origin, [{ name: m.nav_home(), path: localizedPath(currentLang, '') }])
		])
	);

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: m.status_ongoing(), class: 'bg-[var(--orbit-mint)] text-[var(--orbit-ink)]' },
		UPCOMING: { text: m.status_upcoming(), class: 'bg-[var(--orbit-lavender)] text-[var(--orbit-ink)]' },
		ENDED: { text: m.status_ended(), class: 'bg-[var(--orbit-coral-soft)] text-[var(--orbit-coral-dark)]' }
	};

	let now = $state(Date.now());
	$effect(() => {
		if (countdownItems.length === 0) return;
		let rafId: number;
		let lastUpdate = performance.now();
		function tick(ts: number) {
			if (ts - lastUpdate >= 1000) {
				now = Date.now();
				lastUpdate = ts;
			}
			rafId = requestAnimationFrame(tick);
		}
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	});

	interface ActiveCountdown extends CountdownItem {
		diff: number;
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
	}

	const activeCountdowns = $derived<ActiveCountdown[]>(
		countdownItems
			.map((item) => {
				const diff = new Date(item.airDate).getTime() - now;
				return {
					...item,
					diff,
					days: Math.max(0, Math.floor(diff / 86_400_000)),
					hours: Math.max(0, Math.floor((diff % 86_400_000) / 3_600_000)),
					minutes: Math.max(0, Math.floor((diff % 3_600_000) / 60_000)),
					seconds: Math.max(0, Math.floor((diff % 60_000) / 1_000))
				};
			})
			.filter((item) => item.diff > 0)
	);

	const nextOnAir = $derived(activeCountdowns[0]);

	const pad = (value: number) => String(value).padStart(2, '0');
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
	{@html jsonLdScript(homeJsonLd)}
</svelte:head>

<!-- Hero: countdown card + today's schedule -->
<section class="sheet-section" aria-labelledby="home-schedule-title">
	<div class="hero-grid">
		{#if nextOnAir}
			<a href="/{page.data.lang}/series/{nextOnAir.seriesId}" class="zine-card zine-countdown">
				<div class="zine-countdown-main">
					<span class="zine-countdown-poster">
						<Picture src={nextOnAir.poster} type="posters" sizes="(max-width: 639px) 15rem, 9.5rem" alt={nextOnAir.title} width={384} height={512} loading="eager" fetchpriority="high" class="zine-countdown-img" />
					</span>
					<div class="zine-countdown-body">
						<div class="zine-countdown-top">
							<span class="zine-kicker zine-onair">{m.home_zine_countdown_kicker()}</span>
							<span class="zine-chip">{nextOnAir.platform}</span>
						</div>
						<h2 class="zine-hand zine-countdown-title break-words">{nextOnAir.title} · {nextOnAir.episode}</h2>
						<span class="zine-time">
							{pad(nextOnAir.days * 24 + nextOnAir.hours)}:{pad(nextOnAir.minutes)}:{pad(nextOnAir.seconds)}
						</span>
					</div>
				</div>
				<span class="zine-sticker">{m.home_countdown_sticker()}</span>
			</a>
		{/if}
		<div>
			<div class="section-head">
				<h2 id="home-schedule-title" class="text-base"><span class="zine-tape">{m.home_schedule_title_plain()}{page.data.lang === 'en' ? ' ' : ''}{m.home_schedule_title_accent()}</span></h2>
				<a href="/{page.data.lang}/calendar" class="zine-more touch-target">{m.common_see_all()} →</a>
			</div>
			{#if upcomingSchedule.length === 0}
				<div class="orbit-surface px-6 py-12 text-center">
					<p class="font-semibold">{m.home_schedule_empty_title()}</p>
					<p class="mt-1 text-sm text-[var(--orbit-muted)]">{m.home_schedule_empty_desc()}</p>
				</div>
			{:else}
				<div class="zine-schedule overflow-hidden">
					{#each upcomingSchedule as item, i (item.seriesId + '-' + i)}
						<a href="/{page.data.lang}/series/{item.seriesId}" class="zine-schedule-row group grid grid-cols-[3.75rem_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--orbit-paper-deep)] focus-visible:bg-[var(--orbit-paper-deep)] focus-visible:outline-none">
							<span class="zine-hand text-base font-bold tabular-nums text-[var(--orbit-coral)]">{item.time}</span>
							<span class="min-w-0">
								<span class="block truncate font-semibold">{item.series}{#if item.isUncut}<span class="ml-1.5 text-[10px] font-bold tracking-wide text-[var(--orbit-coral-dark)]">UNCUT</span>{/if}</span>
								<span class="mt-0.5 block truncate text-xs font-normal text-[var(--orbit-muted)]">{item.episode}</span>
							</span>
							<span class="zine-chip">{item.platform}</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Latest news -->
<section class="sheet-section" aria-labelledby="home-news-title">
	<div class="section-head">
		<h2 id="home-news-title" class="text-base"><span class="zine-tape zine-tape-pink">{m.home_news_title_plain()}{page.data.lang === 'en' ? ' ' : ''}{m.home_news_title_accent()}</span></h2>
		<a href="/{page.data.lang}/whats-on" class="zine-more touch-target">{m.common_see_all()} →</a>
	</div>

	{#if latestNews.length > 0}
		<NewsCarousel news={latestNews} locale={currentLang === 'th' ? 'th-TH' : 'en-US'} />
	{:else}
		<div class="orbit-surface px-6 py-12 text-center">
			<p class="font-semibold">{m.whats_on_no_news()}</p>
		</div>
	{/if}
</section>

<!-- Featured series collage -->
<section class="sheet-section" aria-labelledby="home-featured-title">
	<div class="section-head">
		<h2 id="home-featured-title" class="text-base"><span class="zine-tape zine-tape-pink">{m.home_featured_title_plain()}{page.data.lang === 'en' ? ' ' : ''}{m.home_featured_title_accent()}</span></h2>
		<a href="/{page.data.lang}/series" class="zine-more touch-target">{m.home_featured_see_all()} →</a>
	</div>

	{#if featuredSeries.length === 0}
		<div class="orbit-surface px-6 py-16 text-center">
			<h3 class="font-semibold">{m.home_featured_empty_title()}</h3>
			<p class="mt-1 text-sm text-[var(--orbit-muted)]">{m.home_featured_empty_desc()}</p>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
			{#each featuredSeries as series, i (series.id)}
				<a href="/{page.data.lang}/series/{series.id}" class="zine-polaroid group">
					<div class="zine-polaroid-poster relative aspect-[3/4] overflow-hidden bg-[var(--orbit-ink)]">
						<Picture src={series.poster} type="posters" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" alt={series.title} width={400} height={533} loading={i < 2 ? 'eager' : 'lazy'} fetchpriority={i === 0 ? 'high' : 'auto'} class="h-full w-full object-cover transition duration-500 group-hover:opacity-90" />
						<div class="absolute left-2 top-2">
							<span class="orbit-badge px-2 py-1 text-[10px] font-bold {statusConfig[series.status].class}">{statusConfig[series.status].text}</span>
						</div>
					</div>
					<p class="zine-hand mt-2.5 line-clamp-2 text-sm font-bold leading-snug">{series.title}</p>
					<p class="mt-0.5 truncate text-[11px] text-[var(--orbit-muted)]">{series.studio} · {series.subtitle}</p>
				</a>
			{/each}
		</div>
	{/if}
</section>


<!-- Orbit Halo section hidden while the feature is closed; data.latestMoment still loads. -->
