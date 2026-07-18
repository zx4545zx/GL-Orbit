<script lang="ts">
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { m, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';
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

	let { data }: { data: PageData } = $props();

	const pageTitle = $derived(defaultSeoTitle(page.data.lang));
	const pageDescription = $derived(defaultSeoDescription(page.data.lang));
	const featuredSeries = $derived<FeaturedSeriesItem[]>(data.featuredSeries);
	const upcomingSchedule = $derived<UpcomingScheduleItem[]>(data.upcomingSchedule);
	const countdownItems = $derived<CountdownItem[]>(data.countdown);
	const loadingFeatured = false;
	const loadingSchedule = false;

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
		ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }
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

<!-- Thesis: now → next → discover. Real schedule data leads; orbit becomes structure, not decoration. -->
<section class="relative -mx-4 flex min-h-dvh items-center overflow-hidden bg-cream px-4 md:min-h-[calc(100dvh-6rem)]">
	<div class="relative mx-auto grid w-full max-w-6xl gap-10 py-14 md:py-20 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-x-14 lg:gap-y-6 lg:py-24">
		<div class="lg:col-span-7">
			<div class="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-coral-dark">
				<span class="orbit-round-data h-2 w-2 bg-coral" aria-hidden="true"></span>
				{m.home_hero_badge()}
			</div>

			<h1 class="max-w-4xl font-[family-name:var(--font-display)] text-[clamp(2.75rem,5vw,4.75rem)] font-bold leading-[0.98] tracking-[-0.045em] text-plum">
				<span class="block">{m.home_hero_title_start()}{' '}<span class="text-coral">GL</span></span>
				<span class="ml-[0.12em] mt-[0.12em] block text-plum-light">{m.home_hero_title_end()}</span>
			</h1>

			<p class="mt-7 max-w-xl text-lg leading-8 text-plum-light sm:text-xl">
				{@html m.home_hero_subtitle()}
			</p>

			<div class="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
				<a href="/{page.data.lang}/calendar" class="touch-target inline-flex items-center justify-center gap-3 border border-coral bg-coral px-6 py-3.5 font-semibold text-white transition-colors hover:bg-coral-dark">
					{m.home_cta_schedule()}
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5" /></svg>
				</a>
				<a href="/{page.data.lang}/explore/series" class="touch-target inline-flex items-center justify-center gap-2 px-2 py-3 font-semibold text-plum underline decoration-plum/20 underline-offset-4 transition hover:text-coral-dark hover:decoration-coral/50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral/40">
					{m.home_cta_explore()}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" /></svg>
				</a>
			</div>
		</div>

		<aside class="relative lg:col-span-5 lg:row-span-2" aria-labelledby="orbit-board-title">
			<div class="relative overflow-hidden border border-[var(--orbit-line-strong)] border-t-4 border-t-coral bg-white shadow-[var(--orbit-shadow)]">
				<div class="flex items-start justify-between gap-4 px-5 py-5 sm:px-6">
					<div>
						<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-coral-dark">{m.home_schedule_badge()}</p>
						<h2 id="orbit-board-title" class="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-plum">
							{m.home_schedule_title_plain()}{page.data.lang === 'en' ? ' ' : ''}{m.home_schedule_title_accent()}
						</h2>
					</div>
					<a href="/{page.data.lang}/calendar" class="touch-target -mr-2 inline-flex items-center justify-center text-sm font-semibold text-plum-light transition-colors hover:text-coral-dark">{m.common_see_all()}</a>
				</div>

				{#if loadingSchedule}
					<div class="space-y-0 p-3" aria-busy="true" aria-label={m.home_schedule_badge()}>
						{#each Array(3) as _}
							<div class="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-plum/8 px-2 py-4 last:border-b-0">
								<div class="h-10 animate-pulse rounded-lg bg-lavender/20"></div>
								<div class="space-y-2"><div class="h-4 w-3/4 animate-pulse rounded bg-lavender/20"></div><div class="h-3 w-1/2 animate-pulse rounded bg-lavender/15"></div></div>
							</div>
						{/each}
					</div>
				{:else if upcomingSchedule.length === 0}
					<div class="px-6 py-12 text-center">
						<p class="font-semibold text-plum">{m.home_schedule_empty_title()}</p>
						<p class="mt-1 text-sm text-plum-light">{m.home_schedule_empty_desc()}</p>
					</div>
				{:else}
					<div class="p-3">
						{#each upcomingSchedule as item, i (item.seriesId + '-' + i)}
							<a href="/{page.data.lang}/series/{item.seriesId}" class="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-b border-plum/10 px-2 py-4 last:border-b-0 hover:bg-coral-light/60 focus-visible:bg-coral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral/60">
								<div>
									<p class="text-[11px] font-bold uppercase tracking-wide text-coral-dark">{item.day}</p>
									<p class="mt-0.5 font-[family-name:var(--font-display)] text-xl font-bold tabular-nums text-plum">{item.time}</p>
								</div>
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<h3 class="truncate font-semibold text-plum transition group-hover:text-coral-dark">{item.series}</h3>
										{#if item.isUncut}<span class="text-[10px] font-bold text-coral-dark">UNCUT</span>{/if}
									</div>
									<p class="mt-1 truncate text-xs text-plum-light">{item.episode} · {item.platform}</p>
								</div>
								<svg class="h-4 w-4 text-plum/25 transition group-hover:translate-x-1 group-hover:text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" /></svg>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</aside>

		<p class="max-w-xl text-sm leading-6 text-plum-light/80 lg:col-span-7">
			{m.home_hero_description()}
		</p>
	</div>
</section>

{#if activeCountdowns.length > 0}
	<section class="-mx-4 bg-coral-light px-4 py-16 text-plum sm:py-20">
		<div class="mx-auto max-w-6xl">
			<header class="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<p class="text-xs font-bold uppercase tracking-[0.18em] text-coral-dark">{m.home_countdown_badge()}</p>
					<h2 class="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
						{m.home_countdown_title_plain()}<span class="text-coral">{m.home_countdown_title_accent()}</span>
					</h2>
					<p class="mt-3 text-plum-light">{m.home_countdown_subtitle()}</p>
				</div>
				<a href="/{page.data.lang}/countdown" class="touch-target inline-flex items-center gap-2 font-semibold text-plum-light transition hover:text-coral-dark">{m.common_see_all()}</a>
			</header>

			<div class="grid gap-4 lg:grid-cols-3">
				{#each activeCountdowns as countdown (countdown.id)}
					<a href="/{page.data.lang}/series/{countdown.seriesId}" class="group overflow-hidden border border-coral/25 bg-white transition-[border-color,box-shadow] hover:border-coral hover:shadow-[var(--orbit-shadow)]">
						<article class="grid h-full grid-cols-[4.5rem_1fr] gap-4 p-5 sm:grid-cols-[5rem_1fr]">
							<Picture src={countdown.poster} type="posters" sizes="5rem" alt={countdown.title} width={160} height={213} loading="lazy" class="aspect-[3/4] w-full object-cover" />
							<div class="min-w-0">
								<h3 class="truncate font-semibold transition group-hover:text-coral-light">{countdown.title}</h3>
								<p class="mt-1 truncate text-xs text-plum-light">{countdown.episode} · {countdown.platform}</p>
								<p class="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-coral-dark">{m.home_countdown_airing_in()}</p>
								<div class="mt-2 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start font-[family-name:var(--font-display)] tabular-nums">
									<div class="grid justify-items-center">
										<span class="text-3xl font-bold">{pad(countdown.hours)}</span>
										<span class="mt-1 text-[10px] text-plum-light/70">{m.home_countdown_hours_short()}</span>
									</div>
									<span class="pt-1 text-plum/25">:</span>
									<div class="grid justify-items-center">
										<span class="text-3xl font-bold">{pad(countdown.minutes)}</span>
										<span class="mt-1 text-[10px] text-plum-light/70">{m.home_countdown_minutes_short()}</span>
									</div>
									<span class="pt-1 text-plum/25">:</span>
									<div class="grid justify-items-center">
										<span class="text-3xl font-bold text-coral-dark">{pad(countdown.seconds)}</span>
										<span class="mt-1 text-[10px] text-plum-light/70">{m.home_countdown_seconds_short()}</span>
									</div>
								</div>
							</div>
						</article>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Discover: imagery leads, with one editorial anchor instead of a uniform card wall. -->
<section class="-mx-4 -mb-[var(--bottom-nav-reserved-space)] bg-lavender-light px-4 pb-[calc(5rem+var(--bottom-nav-reserved-space))] pt-16 md:mb-0 md:pb-24 sm:pt-20">
	<div class="mx-auto max-w-6xl">
		<header class="mb-10 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
			<div>
				<p class="text-xs font-bold uppercase tracking-[0.18em] text-coral-dark">{m.home_section_status_ongoing()}</p>
				<h2 class="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em] text-plum sm:text-4xl">
					{m.home_featured_title_plain()}<span class="text-coral">{m.home_featured_title_accent()}</span>
				</h2>
				<p class="mt-3 text-plum-light">{m.home_featured_subtitle()}</p>
			</div>
			<a href="/{page.data.lang}/series" class="touch-target inline-flex items-center gap-2 font-semibold text-plum transition hover:gap-3 hover:text-coral-dark">
				{m.home_featured_see_all()}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5" /></svg>
			</a>
		</header>

		{#if loadingFeatured}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5" aria-busy="true">
				{#each Array(7) as _}
					<div class="aspect-[3/4] animate-pulse rounded-xl bg-lavender/15"></div>
				{/each}
			</div>
		{:else if featuredSeries.length === 0}
				<div class="border border-[var(--orbit-line)] bg-white px-6 py-16 text-center">
				<h3 class="font-semibold text-plum">{m.home_featured_empty_title()}</h3>
				<p class="mt-1 text-sm text-plum-light">{m.home_featured_empty_desc()}</p>
			</div>
		{:else}
			<div class="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
				{#each featuredSeries as series, i (series.id)}
					<a href="/{page.data.lang}/series/{series.id}" class="group flex h-full min-w-0 flex-col overflow-hidden border border-[var(--orbit-line)] bg-white transition hover:border-coral hover:shadow-[var(--orbit-shadow)]">
						<div class="relative aspect-[3/4] overflow-hidden bg-plum">
							<Picture src={series.poster} type="posters" sizes="(max-width: 640px) 50vw, 25vw" alt={series.title} width={400} height={533} loading={i === 0 ? 'eager' : 'lazy'} fetchpriority={i === 0 ? 'high' : 'auto'} class="h-full w-full object-cover transition duration-500 group-hover:opacity-90" />
							<div class="absolute left-3 top-3 sm:left-4 sm:top-4">
								<span class="rounded-md px-2 py-1 text-[10px] font-bold {statusConfig[series.status].class}">{statusConfig[series.status].text}</span>
							</div>
						</div>
						<div class="flex-1 p-3 sm:p-4">
							<p class="truncate text-xs text-plum-light">{series.studio}</p>
							<h3 class="mt-1 min-h-[2.5rem] line-clamp-2 font-[family-name:var(--font-display)] text-base font-bold leading-snug text-plum sm:min-h-[3rem] sm:text-lg">{series.title}</h3>
							<p class="mt-1 truncate text-xs text-plum-light sm:text-sm">{series.subtitle}</p>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>
