<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';
	import OrbitIcon from '$lib/components/OrbitIcon.svelte';
	import SeriesResults from './series/+page.svelte';
	import ArtistResults from './artists/+page.svelte';
	import ShipResults from './ships/+page.svelte';
	import '@splidejs/splide/css/core';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		DEFAULT_OG_IMAGE,
		OG_IMAGE_HEIGHT,
		OG_IMAGE_TYPE,
		OG_IMAGE_WIDTH,
		absoluteUrl,
		buildBreadcrumbJsonLd,
		buildCanonicalUrl,
		buildWebPageJsonLd,
		jsonLdScript,
		localizedPath,
		safeJsonLd
	} from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const langPrefix = $derived(`/${currentLang}`);
	const canonicalPath = '/explore';
	const SEO_TITLE = m.explore_seo_title();
	const SEO_DESCRIPTION = m.explore_seo_description();
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const jsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, localizedPath(currentLang, canonicalPath), SEO_TITLE, SEO_DESCRIPTION, currentLang),
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: m.nav_home(), path: localizedPath(currentLang, '') },
			{ name: m.nav_explore(), path: localizedPath(currentLang, canonicalPath) }
		])
	]));

	const heroes = $derived(data.heroes);
	const mode = $derived(data.mode);
	const activeSearchMode = $derived(mode === 'artists' || mode === 'ships' ? mode : 'series');
	let searchQuery = $state('');
	let loadingToast = $state(false);
	let navigationRevision = 0;
	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	let loadingToastTimer: ReturnType<typeof setTimeout> | undefined;
	const LOADING_TOAST_MIN_DURATION = 500;

	async function navigateTo(target: string, replaceState = false) {
		const normalizedTarget = new URL(target, page.url);
		const destination = normalizedTarget.pathname + normalizedTarget.search;
		if (destination === page.url.pathname + page.url.search) return;
		const revision = ++navigationRevision;
		const startedAt = Date.now();
		clearTimeout(loadingToastTimer);
		loadingToast = true;
		try {
			if (replaceState) {
				await goto(destination, { replaceState: true, noScroll: true, keepFocus: true });
			} else {
				await goto(destination, { noScroll: true, keepFocus: true });
			}
		} finally {
			if (revision !== navigationRevision) return;
			const remaining = LOADING_TOAST_MIN_DURATION - (Date.now() - startedAt);
			if (remaining > 0) loadingToastTimer = setTimeout(() => loadingToast = false, remaining);
			else loadingToast = false;
		}
	}

	function clearSearchTimer() {
		clearTimeout(searchTimer);
		searchTimer = undefined;
	}

	function buildSearchUrl(search: string): string {
		const params = new URLSearchParams();
		params.set('view', activeSearchMode);
		if (search.trim()) params.set('search', search.trim());
		if (activeSearchMode === 'series' && data.seriesFilters.status !== 'ALL') {
			params.set('status', data.seriesFilters.status.toLowerCase());
		}
		return `${langPrefix}/explore?${params.toString()}`;
	}

	function updateSearchUrl(search: string) {
		void navigateTo(buildSearchUrl(search), true);
	}

	function scheduleSearchUpdate() {
		clearSearchTimer();
		searchTimer = setTimeout(() => {
			searchTimer = undefined;
			updateSearchUrl(searchQuery);
		}, 500);
	}

	$effect(() => {
		searchQuery = activeSearchMode === 'artists' ? data.artistFilters.search
			: activeSearchMode === 'ships' ? data.shipFilters.search
			: data.seriesFilters.search;
	});

	function navigateQuery(event: MouseEvent, target: string) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		clearSearchTimer();
		void navigateTo(target);
	}

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		clearSearchTimer();
		updateSearchUrl(searchQuery);
	}

	function heroDescriptionOf(detail: (typeof data.heroes)[number]['detail']): string {
		return (currentLang === 'th' ? detail.descriptionTh : detail.descriptionEn) || detail.descriptionEn || detail.descriptionTh;
	}
	function heroGhostOf(title: string): string {
		return title.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'GL';
	}

	// --- Splide sliders (client-only; markup below is SSR-safe) ---
	type SplideInstance = InstanceType<typeof import('@splidejs/splide').default>;

	let heroSplideEl = $state<HTMLElement | undefined>();
	let activeSlide = $state(0);
	let heroSplide: SplideInstance | undefined;

	function goToSlide(index: number) {
		heroSplide?.go(index);
	}

	// Rail indexes: 0 = upcoming, 1 = top10, 2 = artists, 3 = ships.
	const railSplideEls = $state<(HTMLElement | undefined)[]>([]);
	const railSplides: (SplideInstance | undefined)[] = [];

	function railGo(index: number, direction: '<' | '>') {
		const splide = railSplides[index];
		if (!splide) return;
		// Page-by-page with clamp + rewind. Plain go('>') is a no-op when the
		// remaining slides are fewer than perMove, so compute the target ourselves.
		const perPage = splide.options.perPage ?? 1;
		const limit = Math.max(0, (splide.length ?? 0) - perPage);
		let target = splide.index + (direction === '>' ? perPage : -perPage);
		if (target > limit) target = splide.index >= limit ? 0 : limit;
		if (target < 0) target = splide.index <= 0 ? limit : 0;
		splide.go(target);
	}

	// Page sizes: poster-card rails fill the row; avatar rail fits more, smaller cards.
	// (No perMove: arrows compute the target page explicitly in railGo.)
	const CARD_PAGES = {
		perPage: 4,
		breakpoints: { 1023: { perPage: 3 }, 639: { perPage: 2 } }
	};
	const TOP10_PAGES = {
		perPage: 4,
		breakpoints: { 1023: { perPage: 3 }, 639: { perPage: 1 } }
	};
	const AVATAR_PAGES = {
		perPage: 6,
		breakpoints: { 1023: { perPage: 4 }, 639: { perPage: 2 } }
	};

	onMount(() => {
		let disposed = false;
		const mounted: SplideInstance[] = [];
		(async () => {
			const { Splide } = await import('@splidejs/splide');
			if (disposed) return;

			const splideI18n = { prev: m.explore_hero_prev_slide(), next: m.explore_hero_next_slide() };

			// Loop is only safe when there are enough slides to fill the clones
			// (Splide needs roughly slides >= perPage * 2, else the track gaps).
			const canLoop = (count: number, perPage: number) => count >= perPage * 2;

			if (heroSplideEl) {
					heroSplide = new Splide(heroSplideEl, {
						type: canLoop(heroes.length, 1) ? 'loop' : 'slide',
						rewind: true,
						autoplay: true,
						perPage: 1,
					arrows: false,
					pagination: false,
					speed: 600,
					i18n: splideI18n
				});
				heroSplide.on('moved', (index: number) => {
					activeSlide = index;
				});
				heroSplide.mount();
				mounted.push(heroSplide);
			}

			const railOptions = [CARD_PAGES, TOP10_PAGES, AVATAR_PAGES, CARD_PAGES];
			const railCounts = [data.upcoming.length, data.top10.length, data.artists.length, data.ships.length];
			const railMaxPerPage = [CARD_PAGES.perPage, CARD_PAGES.perPage, AVATAR_PAGES.perPage, CARD_PAGES.perPage];
			railSplideEls.forEach((el, i) => {
				if (!el) return;
				const splide = new Splide(el, {
					type: canLoop(railCounts[i], railMaxPerPage[i]) ? 'loop' : 'slide',
					rewind: true,
					drag: 'free',
					snap: true,
					gap: '18px',
					arrows: false,
					// Keep the other rails arrow/swipe-only; TOP 10 also exposes Splide's
					// accessible, keyboard-operable page dots.
					pagination: i === 1,
					speed: 500,
					i18n: splideI18n,
					...railOptions[i]
				});
				splide.mount();
				railSplides[i] = splide;
				mounted.push(splide);
			});
		})();
		return () => {
			disposed = true;
			clearSearchTimer();
			clearTimeout(loadingToastTimer);
			for (const s of mounted) s.destroy();
		};
	});

	$effect(() => {
		if (mode !== 'overview') return;
		queueMicrotask(() => {
			heroSplide?.go(0);
			for (const splide of railSplides) {
				splide?.refresh();
				splide?.go(0);
			}
		});
	});

	const statusLabel: Record<string, () => string> = {
		ONGOING: () => m.status_ongoing(),
		UPCOMING: () => m.status_upcoming(),
		ENDED: () => m.status_ended()
	};

	const tabs = $derived([
		{ id: 'series', href: mode === 'series' ? `${langPrefix}/explore` : `${langPrefix}/explore?view=series`, label: m.nav_series() },
		{ id: 'artists', href: mode === 'artists' ? `${langPrefix}/explore` : `${langPrefix}/explore?view=artists`, label: m.nav_artists() },
		{ id: 'ships', href: mode === 'ships' ? `${langPrefix}/explore` : `${langPrefix}/explore?view=ships`, label: m.nav_ships() }
	]);

	const statusSearchParam = $derived(searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : '');
	const statusChips = $derived([
		{ key: 'ALL', label: m.filter_all(), href: `${langPrefix}/explore?view=series${statusSearchParam}` },
		{ key: 'ONGOING', label: currentLang === 'en' ? 'Airing' : m.status_ongoing(), href: `${langPrefix}/explore?view=series&status=ongoing${statusSearchParam}` },
		{ key: 'UPCOMING', label: currentLang === 'en' ? 'Soon' : m.status_upcoming(), href: `${langPrefix}/explore?view=series&status=upcoming${statusSearchParam}` },
		{ key: 'ENDED', label: m.status_ended(), href: `${langPrefix}/explore?view=series&status=ended${statusSearchParam}` }
	]);

</script>

<svelte:head>
	<title>{SEO_TITLE}</title>
	<meta name="description" content={SEO_DESCRIPTION} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={SEO_TITLE} />
	<meta property="og:description" content={SEO_DESCRIPTION} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:title" content={SEO_TITLE} />
	<meta name="twitter:description" content={SEO_DESCRIPTION} />
	{@html jsonLdScript(jsonLd)}
</svelte:head>

<div class="xp">
{#snippet railArrows(index: number, count: number, tabletPerPage: number, desktopPerPage: number)}
	{#if count > tabletPerPage}
		<span
			class="xp-rail-arrows"
			class:xp-rail-arrows--tablet={count > tabletPerPage}
			class:xp-rail-arrows--desktop={count > desktopPerPage}
		>
			<button
				type="button"
				class="xp-rail-arrow"
				aria-label={m.explore_rail_prev()}
				onclick={() => railGo(index, '<')}
			><OrbitIcon name="arrow-left" className="h-4 w-4" /></button>
			<button
				type="button"
				class="xp-rail-arrow"
				aria-label={m.explore_rail_next()}
				onclick={() => railGo(index, '>')}
			><OrbitIcon name="arrow-right" className="h-4 w-4" /></button>
		</span>
	{/if}
{/snippet}
{#if heroes.length > 0}
	<!-- ===== full-bleed cinematic hero carousel ===== -->
	<section class="xp-hero" aria-roledescription="carousel" aria-label={m.explore_hero_badge()}>
		<div class="xp-hero-splide splide" bind:this={heroSplideEl}>
			<div class="splide__track">
				<div class="splide__list">
				{#each heroes as slide, i (slide.detail.id)}
					{@const detail = slide.detail}
					{@const desc = heroDescriptionOf(detail)}
					{@const coverSrc = detail.coverUrl ?? detail.gallery[0]?.imageUrl ?? detail.poster}
					<div
						class="xp-hero-slide splide__slide"
						role="group"
						aria-roledescription="slide"
						aria-label={m.explore_hero_slide_of({ index: i + 1, total: heroes.length })}
						aria-hidden={i === activeSlide ? undefined : true}
					>
					{#if coverSrc}
						<div class="xp-hero-cover" aria-hidden="true">
							<Picture src={coverSrc} type="covers" sizes="100vw" alt="" width={1600} height={900} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
						</div>
					{/if}
					<span class="xp-hero-ghost" aria-hidden="true">{heroGhostOf(detail.titleEn)}</span>
					<div class="xp-hero-frame">
						<div class="xp-hero-main">
							<span class="xp-kicker"><span class="xp-kicker-dot orbit-round-data" aria-hidden="true"></span>{m.explore_hero_badge()}</span>
							<h1 class="xp-hero-title">{detail.titleEn}</h1>
							{#if detail.titleTh && detail.titleTh !== detail.titleEn}
								<p class="xp-hero-sub">{detail.titleTh}</p>
							{/if}
							<div class="xp-hero-meta">
								{#if detail.year}<span class="xp-tag">{detail.year}</span>{/if}
								{#if detail.episodes > 0}<span class="xp-tag">{m.explore_hero_episodes({ count: detail.episodes })}</span>{/if}
								{#if detail.genres.length > 0}<span class="xp-tag">{detail.genres.slice(0, 3).join(' · ')}</span>{/if}
								<span class="xp-hero-studio">{detail.studio}{#if detail.platforms.length > 0} · {detail.platforms.map((p) => p.name).join(' / ')}{/if}</span>
							</div>
							{#if desc}
								<p class="xp-hero-desc">{desc}</p>
							{/if}
							{#if slide.next}
								<p class="xp-hero-next">
									{#if slide.next.isUncut}<span class="xp-badge-uncut">UNCUT</span>{/if}
									{m.explore_hero_next_episode({ episode: slide.next.episode, platform: slide.next.platform })}
								</p>
							{/if}
							<div class="xp-hero-actions">
								<a class="xp-btn xp-btn--primary" href="{langPrefix}/series/{detail.id}" tabindex={i === activeSlide ? undefined : -1}><OrbitIcon name="play" className="h-4 w-4" /> {m.explore_hero_cta()}</a>
								<a class="xp-btn xp-btn--ghost" href="{langPrefix}/calendar" tabindex={i === activeSlide ? undefined : -1}>{m.nav_calendar()}</a>
							</div>
						</div>
						<div class="xp-hero-poster" aria-hidden="true">
							<Picture src={detail.poster} type="posters" sizes="220px" alt="" width={440} height={586} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
						</div>
					</div>
					<div class="xp-hero-side">
						<span class="xp-hero-status">{statusLabel[detail.status]?.() ?? detail.status} · GL</span>
					</div>
				</div>
				{/each}
					</div>
				</div>
			</div>
			{#if heroes.length > 1}
			<div class="xp-hero-nav">
				<div class="xp-hero-dots" role="group" aria-label={m.explore_hero_badge()}>
					{#each heroes as slide, i (slide.detail.id)}
						<button
							type="button"
							class="xp-hero-dot"
							class:xp-hero-dot--on={i === activeSlide}
							aria-label={m.explore_hero_go_to_slide({ index: i + 1 })}
							aria-current={i === activeSlide ? 'true' : undefined}
							onclick={() => goToSlide(i)}
						></button>
					{/each}
				</div>
			</div>
		{/if}
	</section>
{/if}

	<!-- ===== tabs + search + filters ===== -->
	<div class="xp-bar">
		<div class="xp-nav-controls">
			<a class="xp-overview" class:xp-overview--active={mode === 'overview'} href={`${langPrefix}/explore`} aria-current={mode === 'overview' ? 'page' : undefined} data-sveltekit-preload-data="hover" onclick={(event) => navigateQuery(event, `${langPrefix}/explore`)}>
				{currentLang === 'en' ? 'Overview' : 'ภาพรวม'}
			</a>
			<nav class="xp-tabs" aria-label={m.nav_explore()}>
				{#each tabs as tab (tab.id)}
					<a class="xp-tab" class:xp-tab--active={mode === tab.id} href={tab.href} aria-current={mode === tab.id ? 'page' : undefined} data-sveltekit-preload-data="hover" onclick={(event) => navigateQuery(event, tab.href)}>
						{tab.label}
					</a>
				{/each}
			</nav>
		</div>
		<form class="xp-search" role="search" action="{langPrefix}/explore" method="get" onsubmit={submitSearch}>
			<input type="hidden" name="view" value={mode === 'artists' || mode === 'ships' ? mode : 'series'} />
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z"/></svg>
			<input type="text" name="search" bind:value={searchQuery} oninput={scheduleSearchUpdate} placeholder={m.explore_search_placeholder()} aria-label={m.explore_search_submit()} />
		</form>
	</div>
	{#if mode === 'series'}
	<div class="xp-filters" role="group" aria-label={m.filter_all()}>
		{#each statusChips as chip (chip.key)}
			<a class="xp-chip" href={chip.href} aria-current={data.seriesFilters.status === chip.key ? 'true' : undefined} data-sveltekit-preload-data="hover" onclick={(event) => navigateQuery(event, chip.href)}>{chip.label}</a>
		{/each}
	</div>
	{/if}

	{#if mode === 'series' && data.seriesResults}
		<SeriesResults data={{ series: data.seriesResults, filters: data.seriesFilters }} embedded basePath={`${langPrefix}/explore`} view="series" />
	{:else if mode === 'artists' && data.artistResults}
		<ArtistResults data={{ artists: data.artistResults, filters: data.artistFilters }} embedded basePath={`${langPrefix}/explore`} view="artists" />
	{:else if mode === 'ships' && data.shipResults}
		<ShipResults data={{ ships: data.shipResults, filters: data.shipFilters }} embedded basePath={`${langPrefix}/explore`} view="ships" />
	{/if}

	{#if loadingToast}
		<div role="status" aria-live="polite" class="fixed inset-x-4 bottom-20 z-[60] mx-auto flex w-fit items-center gap-2 rounded-full bg-plum px-4 py-3 text-sm font-medium text-white shadow-lg shadow-plum/25 md:bottom-6">
			<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
			{m.common_loading()}
		</div>
	{/if}

	<!-- ===== rail: airing soon ===== -->
	<div hidden={mode !== 'overview'}>
	{#if data.upcoming.length > 0}
		<section class="xp-rail" aria-label={m.explore_rail_upcoming()}>
			<div class="xp-rail-head">
				<h2 class="xp-rail-title">{m.explore_rail_upcoming()}</h2>
				<div class="xp-rail-tools">
					{@render railArrows(0, data.upcoming.length, 3, 4)}
					<a class="xp-rail-more" href="{langPrefix}/calendar">{m.explore_view_all()} <OrbitIcon name="arrow-right" className="h-3.5 w-3.5" /></a>
				</div>
			</div>
			<div class="xp-rail-scroll splide" bind:this={railSplideEls[0]}>
			<div class="splide__track">
				<div class="splide__list">
				{#each data.upcoming as item (item.id)}
					<div class="splide__slide">
						<a class="xp-card" href="{langPrefix}/series/{item.seriesId}">
						<div class="xp-poster">
							<Picture src={item.poster} type="posters" sizes="(max-width: 639px) 168px, 232px" alt="" width={464} height={618} class="xp-poster-img" loading="lazy" decoding="async" />
							<span class="xp-live"><span class="xp-live-dot orbit-round-data" aria-hidden="true"></span>{item.day} {item.time}</span>
							{#if item.isUncut}<span class="xp-ep xp-badge-uncut-text">UNCUT</span>{:else}<span class="xp-ep">{item.episode}</span>{/if}
						</div>
						<div class="xp-card-body">
							<span class="xp-card-title">{item.series}</span>
							<span class="xp-card-sub">{item.episode} · {item.platform}</span>
							</div>
						</a>
					</div>
				{/each}
					</div>
				</div>
			</div>

		</section>
	{/if}

	<!-- ===== rail: TOP 10 ===== -->
	{#if data.top10.length > 0}
		<section class="xp-rail" aria-label={m.explore_rail_top10()}>
			<div class="xp-rail-head">
				<h2 class="xp-rail-title">{m.explore_rail_top10()}</h2>
				<div class="xp-rail-tools">
					{@render railArrows(1, data.top10.length, 3, 4)}
					<a class="xp-rail-more" href="{langPrefix}/explore?view=series" onclick={(event) => navigateQuery(event, `${langPrefix}/explore?view=series`)}>{m.explore_view_all()} <OrbitIcon name="arrow-right" className="h-3.5 w-3.5" /></a>
				</div>
			</div>
			<div class="xp-rail-scroll xp-rail-scroll--top10 splide" bind:this={railSplideEls[1]}>
			<div class="splide__track">
				<div class="splide__list">
				{#each data.top10 as s, i (s.id)}
					<div class="splide__slide">
						<div class="xp-ranked">
						<span class="xp-rank" aria-hidden="true">{i + 1}</span>
						<a class="xp-card" href="{langPrefix}/series/{s.id}" aria-label={`${i + 1}. ${s.title}`}>
							<div class="xp-poster">
								<Picture src={s.poster} type="posters" sizes="(max-width: 639px) 168px, 232px" alt="" width={464} height={618} class="xp-poster-img" loading="lazy" decoding="async" />
								<span class="xp-status xp-status--{s.status.toLowerCase()}">{statusLabel[s.status]?.() ?? s.status}</span>
							</div>
							<div class="xp-card-body">
								<span class="xp-card-title">{s.title}</span>
								<span class="xp-card-sub">{s.studio}</span>
								</div>
							</a>
							</div>
					</div>
				{/each}
					</div>
				</div>
			</div>

		</section>
	{/if}

	<!-- ===== rail: artists ===== -->
	{#if data.artists.length > 0}
		<section class="xp-rail" aria-label={m.explore_rail_artists()}>
			<div class="xp-rail-head">
				<h2 class="xp-rail-title">{m.explore_rail_artists()}</h2>
				<div class="xp-rail-tools">
					{@render railArrows(2, data.artists.length, 4, 6)}
					<a class="xp-rail-more" href="{langPrefix}/explore?view=artists" onclick={(event) => navigateQuery(event, `${langPrefix}/explore?view=artists`)}>{m.explore_view_all()} <OrbitIcon name="arrow-right" className="h-3.5 w-3.5" /></a>
				</div>
			</div>
			<div class="xp-rail-scroll xp-rail-scroll--avatars splide" bind:this={railSplideEls[2]}>
			<div class="splide__track">
				<div class="splide__list">
				{#each data.artists as a (a.id)}
					<div class="splide__slide">
						<a class="xp-astar" href="{langPrefix}/artists/{a.id}">
						<span class="xp-face orbit-round-data">
							<Picture src={a.profileImageUrl} type="profiles" sizes="132px" alt="" width={264} height={264} class="xp-poster-img" loading="lazy" decoding="async" />
						</span>
						<span class="xp-astar-name">{a.nickname}</span>
						<span class="xp-astar-role">{a.seriesCount > 0 ? m.artist_works_count({ count: a.seriesCount }) : m.artist_no_works()}</span>
						</a>
					</div>
				{/each}
					</div>
				</div>
			</div>

		</section>
	{/if}

	<!-- ===== rail: ships ===== -->
	{#if data.ships.length > 0}
		<section class="xp-rail" aria-label={m.explore_rail_ships()}>
			<div class="xp-rail-head">
				<h2 class="xp-rail-title">{m.explore_rail_ships()}</h2>
				<div class="xp-rail-tools">
					{@render railArrows(3, data.ships.length, 3, 4)}
					<a class="xp-rail-more" href="{langPrefix}/explore?view=ships" onclick={(event) => navigateQuery(event, `${langPrefix}/explore?view=ships`)}>{m.explore_view_all()} <OrbitIcon name="arrow-right" className="h-3.5 w-3.5" /></a>
				</div>
			</div>
			<div class="xp-rail-scroll splide" bind:this={railSplideEls[3]}>
			<div class="splide__track">
				<div class="splide__list">
				{#each data.ships as ship (ship.id)}
					<div class="splide__slide">
						<a class="xp-card" href="{langPrefix}/ships/{ship.slug}">
						<div class="xp-poster xp-duo">
							<span class="xp-duo-half">
								<Picture src={ship.artist1.imageUrl} type="profiles" sizes="(max-width: 639px) 84px, 116px" alt={ship.artist1.name} width={240} height={240} class="xp-duo-img" loading="lazy" decoding="async" />
							</span>
							<span class="xp-duo-half">
								<Picture src={ship.artist2.imageUrl} type="profiles" sizes="(max-width: 639px) 84px, 116px" alt={ship.artist2.name} width={240} height={240} class="xp-duo-img" loading="lazy" decoding="async" />
							</span>
							<span class="xp-duo-rule" aria-hidden="true"></span>
						</div>
						<div class="xp-card-body">
							<span class="xp-card-title">{ship.name}</span>
							<span class="xp-card-sub">{m.ships_series_count({ count: ship.seriesCount })}</span>
							</div>
						</a>
					</div>
				{/each}
					</div>
				</div>
			</div>

		</section>
	{/if}

	<!-- ===== platform strip ===== -->
	{#if data.platforms.length > 0}
		<div class="xp-platforms" aria-label={m.explore_platforms_label()}>
			<span class="xp-platforms-lbl">{m.explore_platforms_label()}</span>
			{#each data.platforms as p (p.name)}
				<span class="xp-pf">{p.name}</span>
			{/each}
		</div>
	{/if}
	</div>
</div>

<style>
	.xp {
		max-width: 72rem;
		margin: 0 auto;
		padding: 0 0 64px;
	}

	/* ===== hero (full-bleed carousel) ===== */
	.xp-hero {
		position: relative;
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		background: var(--orbit-ink);
		color: var(--orbit-paper);
		border-top: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: 0 !important;
	}
	.xp-hero-splide,
	.xp-hero-splide :global(.splide__track),
	.xp-hero-splide :global(.splide__list),
	.xp-hero-slide,
	.xp-hero-frame {
		border-radius: 0 !important;
	}
	.xp-hero-slide {
		position: relative;
		flex: 0 0 100%;
		min-width: 100%;
		overflow: hidden;
		display: flex;
		align-items: flex-end;
		min-height: min(72vh, 540px);
	}
	/* giant ghost letters behind the content */
	.xp-hero-ghost {
		position: absolute;
		right: 2%;
		top: 42%;
		transform: translateY(-50%);
		font-family: var(--orbit-font-display);
		font-weight: 700;
		font-size: clamp(160px, 26vw, 340px);
		line-height: 0.9;
		color: transparent;
		-webkit-text-stroke: 3px color-mix(in srgb, var(--orbit-paper) 35%, transparent);
		pointer-events: none;
		user-select: none;
	}
	/* opaque gradients so text stays readable over any cover, in every theme */
	.xp-hero-slide::after {
		content: "";
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background:
			linear-gradient(90deg,
				color-mix(in srgb, var(--orbit-ink) 88%, transparent) 0%,
				color-mix(in srgb, var(--orbit-ink) 55%, transparent) 55%,
				color-mix(in srgb, var(--orbit-ink) 25%, transparent) 100%),
			linear-gradient(180deg,
				color-mix(in srgb, var(--orbit-ink) 25%, transparent) 0%,
				color-mix(in srgb, var(--orbit-ink) 60%, transparent) 58%,
				color-mix(in srgb, var(--orbit-ink) 96%, transparent) 100%);
	}
	.xp-hero-frame {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 72rem;
		margin-inline: auto;
		padding: 90px 32px 84px;
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: end;
		gap: 32px;
	}
	.xp-hero-main {
		display: grid;
		gap: 14px;
		justify-items: start;
	}
	/* full-slide cover behind everything */
	.xp-hero-cover {
		position: absolute;
		inset: 0;
		z-index: 0;
	}
	.xp-hero-cover,
	.xp-hero-cover :global(picture),
	.xp-hero-cover :global(img) { border-radius: 0 !important; }
	.xp-hero-cover :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center top;
		display: block;
	}
	/* framed poster on the side (desktop only) */
	.xp-hero-poster {
		width: 210px;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		background: var(--orbit-lavender);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-raised);
	}
	.xp-hero-poster :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.xp-hero-poster :global(picture),
	.xp-hero-poster :global(img) { border-radius: 0 !important; }
	@media (max-width: 1023px) {
		.xp-hero-poster { display: none; }
		.xp-hero-frame { grid-template-columns: 1fr; padding: 64px 28px 76px; }
	}
	.xp-kicker {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--orbit-font-display);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		background: var(--orbit-coral);
		color: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-coral);
		border-radius: var(--orbit-radius-badge);
		padding: 5px 12px;
	}
	.xp-kicker-dot {
		width: 8px;
		height: 8px;
		background: var(--orbit-surface);
	}
	.xp-hero-title {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight, 700);
		font-size: clamp(36px, 7vw, 76px);
		letter-spacing: 0.02em;
		line-height: 0.98;
		margin: 0;
		text-shadow: 3px 3px 0 color-mix(in srgb, var(--orbit-coral-dark) 80%, transparent);
	}
	.xp-hero-sub {
		margin: 0;
		font-size: 16px;
		color: color-mix(in srgb, var(--orbit-paper) 80%, transparent);
	}
	.xp-hero-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		font-size: 13px;
		color: color-mix(in srgb, var(--orbit-paper) 75%, transparent);
	}
	.xp-tag {
		padding: 3px 10px;
		font-family: var(--orbit-font-display);
		font-size: 10px;
		border: var(--orbit-border-width) solid color-mix(in srgb, var(--orbit-paper) 60%, transparent);
		border-radius: var(--orbit-radius-badge);
	}
	.xp-hero-desc {
		margin: 0;
		font-size: 14px;
		max-width: 60ch;
		color: color-mix(in srgb, var(--orbit-paper) 85%, transparent);
		display: -webkit-box;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.xp-hero-next {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin: 0;
		font-family: var(--orbit-font-display);
		font-size: 11px;
		color: var(--orbit-mint);
	}
	.xp-badge-uncut {
		font-size: 9px;
		letter-spacing: 0.08em;
		padding: 2px 7px;
		background: var(--orbit-coral);
		color: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-coral);
		border-radius: var(--orbit-radius-badge);
	}
	.xp-hero-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		margin-top: 6px;
	}
	.xp-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-height: 48px;
		padding: 12px 24px;
		font-family: var(--orbit-font-display);
		font-size: 14px;
		font-weight: 700;
		text-decoration: none;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow);
		transition: transform 0.08s ease, box-shadow 0.08s ease;
	}
	.xp-btn:hover { transform: translate(-1px, -1px); text-decoration: none; }
	.xp-btn:active { transform: translate(2px, 2px); box-shadow: none; }
	.xp-btn--primary { background: var(--orbit-coral); color: var(--orbit-surface); border-color: var(--orbit-coral); }
	.xp-btn--ghost { background: var(--orbit-surface); color: var(--orbit-ink); }
	.xp-hero-side {
		position: absolute;
		right: 24px;
		bottom: 40px;
		z-index: 2;
	}
	.xp-hero-status {
		font-family: var(--orbit-font-display);
		font-size: 12px;
		background: var(--orbit-mint);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		box-shadow: var(--orbit-shadow);
		padding: 6px 12px;
	}
	/* carousel controls */
	.xp-hero-nav {
		position: absolute;
		left: 50%;
		bottom: 14px;
		transform: translateX(-50%);
		z-index: 3;
		display: flex;
		align-items: center;
		gap: 14px;
		max-width: calc(100% - 24px);
	}
	.xp-hero-dots {
		display: flex;
		align-items: center;
		gap: 2px;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.xp-hero-dots::-webkit-scrollbar { display: none; }
	.xp-hero-dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		background: transparent;
		border: none;
		cursor: pointer;
	}
	.xp-hero-dot::before {
		content: "";
		width: 12px;
		height: 12px;
		background: transparent;
		border: var(--orbit-border-width) solid var(--orbit-paper);
	}
	.xp-hero-dot--on::before,
	.xp-hero-dot[aria-current="true"]::before {
		background: var(--orbit-coral);
		border-color: var(--orbit-coral);
	}
	.xp-hero-dot:focus-visible,
	.xp-rail-arrow:focus-visible {
		outline: 3px solid var(--orbit-coral);
		outline-offset: 2px;
	}

	/* ===== tabs + search + filters ===== */
	.xp-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		align-items: center;
		justify-content: space-between;
		margin: 32px 0 10px;
	}
	.xp-nav-controls {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		max-width: 100%;
	}
	.xp-overview {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 10px 14px;
		font-family: var(--orbit-font-display);
		font-size: 12px;
		font-weight: 700;
		line-height: normal;
		color: var(--orbit-ink);
		text-decoration: none;
		white-space: nowrap;
		background: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: 0;
		box-shadow: var(--orbit-shadow);
	}
	.xp-overview:hover { color: var(--orbit-coral); text-decoration: none; }
	.xp-overview--active { background: var(--orbit-coral-soft); color: var(--orbit-ink); }
	.xp-overview:focus-visible {
		outline: 2px solid var(--orbit-coral);
		outline-offset: 2px;
	}
	.xp-tabs {
		min-width: 0;
		display: inline-flex;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow);
	}
	.xp-tabs::-webkit-scrollbar { display: none; }
	.xp-tab,
	.xp-chip {
		font-family: var(--orbit-font-display);
		font-size: 12px;
		font-weight: 700;
		line-height: normal;
		letter-spacing: normal;
	}
	.xp-tab {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 10px 16px;
		color: var(--orbit-ink);
		text-decoration: none;
		border-right: var(--orbit-border-width) solid var(--orbit-line);
		border-radius: 0 !important;
		white-space: nowrap;
	}
	.xp-tab:last-child { border-right: none; }
	.xp-tab:hover { color: var(--orbit-coral); text-decoration: none; }
	.xp-tab--active { background: var(--orbit-coral-soft); color: var(--orbit-ink); }
	.xp-search {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		min-width: 220px;
		max-width: 380px;
		background: var(--orbit-surface);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow);
		padding: 0 12px;
		min-height: 44px;
	}
	.xp-search input {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		outline: none;
		font-family: inherit;
		font-size: 14px;
		color: var(--orbit-ink);
		min-height: 40px;
	}
	.xp-search input::placeholder { color: var(--orbit-muted); }
	.xp-filters {
		display: inline-flex;
		max-width: 100%;
		overflow-x: auto;
		margin: 4px 0 10px;
		scrollbar-width: none;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: 0;
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow);
	}
	.xp-filters::-webkit-scrollbar { display: none; }
	.xp-chip {
		flex: none;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 10px 16px;
		text-decoration: none;
		color: var(--orbit-ink);
		border-right: var(--orbit-border-width) solid var(--orbit-line);
		border-radius: 0 !important;
		white-space: nowrap;
	}
	.xp-chip:last-child { border-right: none; }
	.xp-chip:hover { color: var(--orbit-coral); text-decoration: none; }
	.xp-chip:focus-visible {
		outline: 2px solid var(--orbit-coral);
		outline-offset: -2px;
	}
	.xp-chip:active {
		background: var(--orbit-coral-soft);
		color: var(--orbit-coral-dark);
	}
	.xp-chip[aria-current='true'] { background: var(--orbit-coral-soft); color: var(--orbit-ink); }
	@media (max-width: 420px) {
		.xp-filters { display: flex; }
		.xp-chip { flex: 1 1 0; justify-content: center; padding-inline: 6px; }
	}

	/* ===== rails ===== */
	.xp-rail { margin-top: 40px; }
	.xp-rail-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 8px;
	}
	.xp-rail-title {
		font-family: var(--orbit-font-display);
		font-size: 17px;
		letter-spacing: 0.04em;
		color: var(--orbit-ink);
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0;
	}
	.xp-rail-title::before {
		content: "";
		width: 6px;
		height: 22px;
		background: var(--orbit-coral);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
	}
	.xp-rail-more {
		font-family: var(--orbit-font-display);
		font-size: 11px;
		color: var(--orbit-link);
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
	}
	.xp-rail-more:hover { text-decoration: underline; }
	.xp-rail-scroll {
		/* bleed into the page gutter so first/last cards and shadows aren't clipped */
		margin-inline: -14px;
		/* Splide's padded track must not enlarge the document on narrow viewports. */
		overflow-x: clip;
	}
	/* track padding lives inside the clip box so hover shadows stay visible;
	   negative margins cancel the extra box size */
	.xp-rail-scroll :global(.splide__track) {
		/* The track is the viewport. A 4px internal shadow reserve keeps card
		   decoration intact while overflow clipping rejects adjacent slides/clones. */
		padding: 14px 4px 24px !important;
		margin: -14px 12px -24px;
		overflow-x: hidden;
	}
	/* Responsive pre-init widths mirror Splide to limit hydration movement. */
	.xp-rail-scroll :global(.splide__slide) { flex: 0 0 auto; width: calc((100% - 54px) / 4); }
	.xp-rail-scroll--avatars :global(.splide__slide) { width: calc((100% - 90px) / 6); }
	/* TOP 10 keeps Splide's default semantic pagination markup, styled as a
	   compact in-flow navigator so mobile pages never overlap the cards. */
	.xp-rail-scroll--top10 :global(.splide__pagination) {
		position: static;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4px;
		max-width: 100%;
		margin: 18px auto 0;
		padding: 0;
	}
	.xp-rail-scroll--top10 :global(.splide__pagination li) {
		display: flex;
	}
	.xp-rail-scroll--top10 :global(.splide__pagination__page) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		margin: 0;
		padding: 0;
		background: transparent;
		border: 0;
		border-radius: 0;
		box-shadow: none;
		cursor: pointer;
		opacity: 1;
		transform: none;
	}
	.xp-rail-scroll--top10 :global(.splide__pagination__page::before) {
		content: "";
		width: 10px;
		height: 10px;
		background: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: 50%;
		box-shadow: 1px 1px 0 color-mix(in srgb, var(--orbit-coral-dark) 55%, transparent);
		transition: background 0.12s ease, border-color 0.12s ease, transform 0.12s ease;
	}
	.xp-rail-scroll--top10 :global(.splide__pagination__page:hover::before),
	.xp-rail-scroll--top10 :global(.splide__pagination__page.is-active::before) {
		background: var(--orbit-coral);
		border-color: var(--orbit-coral);
		transform: scale(1.15);
	}
	.xp-rail-scroll--top10 :global(.splide__pagination__page:focus-visible) {
		outline: 3px solid var(--orbit-coral);
		outline-offset: 2px;
	}
	/* splide core hides uninitialized sliders; SSR markup should stay visible */
	.xp :global(.splide) { visibility: visible; }

	/* rail paging arrows live in the header row so they never cover a poster;
	   touch/small screens swipe instead */
	.xp-rail-tools {
		display: inline-flex;
		align-items: center;
		gap: 12px;
	}
	.xp-rail-arrows {
		display: none;
		gap: 6px;
	}
	@media (min-width: 1024px) {
		/* Keep desktop cards 8px inside the content shell. The outer viewport reserves
		   14px for intact borders/shadows, but clips before the 18px slide gap ends. */
		.xp-rail { margin-inline: 8px; }
		.xp-rail-scroll { margin-inline: -14px; }
		.xp-rail-scroll :global(.splide__track) {
			padding-inline: 4px !important;
			margin-inline: 10px;
		}
		.xp-rail-arrows--desktop { display: inline-flex; }
	}
	@media (min-width: 640px) and (max-width: 1023px) {
		/* Keep the resting rail on a 24px tablet edge while the outer clip box
		   leaves that gutter available to translated slides. */
		.xp-rail { margin-inline: 8px; }
		.xp-rail-scroll { margin-inline: -24px; }
		.xp-rail-scroll :global(.splide__track) {
			padding-inline: 4px !important;
			margin-inline: 20px;
		}
		.xp-rail-arrows--tablet { display: inline-flex; }
		.xp-rail-scroll :global(.splide__slide) { width: calc((100% - 36px) / 3); }
		.xp-rail-scroll--avatars :global(.splide__slide) { width: calc((100% - 54px) / 4); }
	}
	.xp-rail-arrow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		font-family: var(--orbit-font-display);
		font-size: 15px;
		background: var(--orbit-surface);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow);
		cursor: pointer;
		transition: transform 0.08s ease, box-shadow 0.08s ease, opacity 0.12s ease;
	}
	.xp-rail-arrow:hover { transform: translate(-1px, -1px); box-shadow: var(--orbit-shadow-raised); }
	.xp-rail-arrow:active { transform: translate(2px, 2px); box-shadow: none; }
	@media (hover: none), (max-width: 639px) {
		.xp-rail-arrow { display: none; }
	}

	.xp-card {
		position: relative;
		background: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: var(--orbit-ink);
		transition: transform 0.1s ease, box-shadow 0.1s ease;
	}
	.xp-card:hover {
		transform: translate(-2px, -2px);
		box-shadow: var(--orbit-shadow-raised);
		text-decoration: none;
		border-color: var(--orbit-coral);
	}
	.xp-card:active { transform: translate(1px, 1px); box-shadow: none; }
	.xp-poster {
		position: relative;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		background: var(--orbit-lavender);
		border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
	}
	/* flush with the clipped card edge: app.css legacy rounding would leave corner gaps */
	.xp-poster,
	.xp-poster :global(picture),
	.xp-poster :global(img) { border-radius: 0 !important; }
	.xp-poster :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	/* cinematic bottom fade inside every poster */
	.xp-poster::after {
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(180deg, transparent 55%, color-mix(in srgb, var(--orbit-ink) 65%, transparent) 100%);
	}
	.xp-status {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 2;
		font-family: var(--orbit-font-display);
		font-size: 9px;
		letter-spacing: 0.06em;
		padding: 3px 8px;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		background: var(--orbit-mint);
		color: var(--orbit-ink);
	}
	.xp-status--upcoming { background: var(--orbit-lavender); }
	.xp-status--ended { background: var(--orbit-coral-soft); color: var(--orbit-coral-dark); }
	.xp-live {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-family: var(--orbit-font-display);
		font-size: 9px;
		padding: 3px 8px;
		background: var(--orbit-ink);
		color: var(--orbit-paper);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
	}
	.xp-live-dot { width: 7px; height: 7px; background: var(--orbit-coral); }
	.xp-ep {
		position: absolute;
		right: 10px;
		bottom: 10px;
		z-index: 2;
		font-family: var(--orbit-font-display);
		font-size: 9px;
		padding: 2px 7px;
		background: var(--orbit-ink);
		color: var(--orbit-paper);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
	}
	.xp-ep.xp-badge-uncut-text { background: var(--orbit-coral); color: var(--orbit-surface); }
	.xp-card-body { padding: 10px 12px 12px; display: grid; gap: 2px; }
	.xp-card-title {
		font-weight: 700;
		font-size: 13px;
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.xp-card-sub {
		font-size: 11px;
		color: var(--orbit-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* TOP 10 giant numbers */
	.xp-ranked {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: auto 1fr;
		align-items: end;
	}
	.xp-rank {
		font-family: var(--orbit-font-display);
		font-weight: 700;
		font-size: 128px;
		line-height: 0.72;
		margin-right: -12px;
		min-width: 88px;
		text-align: center;
		color: transparent;
		-webkit-text-stroke: 3px var(--orbit-line-strong);
		text-shadow: 4px 4px 0 color-mix(in srgb, var(--orbit-coral-dark) 55%, transparent);
	}
	.xp-ranked .xp-card { position: relative; z-index: 1; }

	/* artist avatar rail */
	.xp-astar {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding-top: 6px;
		text-decoration: none;
		color: var(--orbit-ink);
	}
	.xp-astar:hover { text-decoration: none; }
	.xp-face {
		width: 132px;
		aspect-ratio: 1;
		overflow: hidden;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		box-shadow: var(--orbit-shadow);
		background: var(--orbit-lavender);
		display: grid;
		place-items: center;
		transition: transform 0.1s ease;
	}
	.xp-astar:hover .xp-face { transform: translateY(-4px); border-color: var(--orbit-coral); }
	.xp-face { position: relative; }
	.xp-face :global(picture) {
		position: absolute;
		inset: 0;
		display: block;
	}
	.xp-face :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.xp-astar-name { font-weight: 700; font-size: 13px; text-align: center; }
	.xp-astar-role { font-size: 10px; color: var(--orbit-muted); text-align: center; }

	/* ship duo faces — rectangular split-frame */
	.xp-duo {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1px;
		background: var(--orbit-line-strong);
	}
	.xp-duo::after { background: none; }
	.xp-duo-half {
		position: relative;
		overflow: hidden;
		background: var(--orbit-lavender);
		border-radius: 0 !important;
	}
	.xp-duo-half :global(picture) {
		position: absolute;
		inset: 0;
		display: block;
	}
	.xp-duo-half :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.xp-duo-rule {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--orbit-line-strong);
		transform: translateX(-50%);
	}

	/* platform strip */
	.xp-platforms {
		margin-top: 40px;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow);
		padding: 14px 16px;
	}
	.xp-platforms-lbl {
		font-family: var(--orbit-font-display);
		font-size: 11px;
		color: var(--orbit-muted);
		margin-right: 6px;
	}
	.xp-pf {
		font-family: var(--orbit-font-display);
		font-size: 10px;
		padding: 6px 12px;
		min-height: 36px;
		display: inline-flex;
		align-items: center;
		background: var(--orbit-mint);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		box-shadow: var(--orbit-shadow);
	}

	/* ===== responsive ===== */
	@media (max-width: 639px) {
		/* Keep cards on the 16px mobile edge with the same clipped shadow reserve. */
		.xp-rail-scroll { margin-inline: -16px; }
		.xp-rail-scroll :global(.splide__track) {
			padding-inline: 4px !important;
			margin-inline: 12px;
			overflow-x: hidden;
		}
		.xp-hero-slide { min-height: 440px; }
		.xp-hero-frame { padding: 64px 18px 84px; }
		.xp-hero-title { overflow-wrap: anywhere; }
		.xp-hero-nav { width: calc(100% - 24px); justify-content: center; gap: 0; }
		.xp-hero-dots { justify-content: flex-start; }
		.xp-hero-ghost { font-size: clamp(130px, 44vw, 220px); top: 34%; right: -4%; }
		.xp-hero-side { right: 18px; bottom: auto; top: 16px; }
		.xp-search { max-width: none; order: 2; flex-basis: 100%; }
		.xp-rail-scroll :global(.splide__slide) { width: calc((100% - 18px) / 2); }
		.xp-rail-scroll--top10 :global(.splide__slide) { width: 100%; }
		.xp-rail-scroll--top10 :global(.splide__pagination) { margin-top: 16px; gap: 2px; }
		.xp-rail-scroll--top10 :global(.splide__pagination__page) { width: 26px; height: 26px; }
		.xp-rail-scroll--avatars :global(.splide__slide) { width: calc((100% - 18px) / 2); }
		.xp-face { width: 108px; }
		.xp-rank { font-size: clamp(88px, 30vw, 108px); min-width: 64px; margin-right: -8px; }
	}
	@media (max-width: 359px) {
		.xp-filters {
			display: grid;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 0;
			overflow: visible;
			margin: 4px 0 10px;
			padding: 0;
			outline: var(--orbit-border-width) solid var(--orbit-line-strong);
			outline-offset: calc(-1 * var(--orbit-border-width));
		}
		.xp-chip {
			justify-content: center;
			min-width: 0;
			padding: 0 3px;
			border: 0;
			border-left: var(--orbit-border-width) solid var(--orbit-line-strong);
			border-radius: 0;
			box-shadow: none;
			text-align: center;
			white-space: nowrap;
		}
		.xp-chip:first-child { border-left: 0; }
		.xp-chip:hover {
			background: var(--orbit-lavender);
			transform: none;
		}
		.xp-chip:focus-visible {
			position: relative;
			z-index: 1;
			outline-offset: -2px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.xp-btn, .xp-chip, .xp-card, .xp-face, .xp-rail-arrow,
		.xp-rail-scroll--top10 :global(.splide__pagination__page::before) { transition: none; }
	}
</style>
