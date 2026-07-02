<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';

	import { page } from '$app/state';
	import { DEFAULT_OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, SITE_NAME, absoluteUrl, buildBreadcrumbJsonLd, buildWebPageJsonLd, defaultSeoDescription, defaultSeoTitle, jsonLdScript, safeJsonLd } from '$lib/seo.js';
	import type { PageData } from './$types.js';
	import type { CountdownItem, FeaturedSeriesItem, UpcomingScheduleItem } from '$lib/types/home.js';

	let { data }: { data: PageData } = $props();

	const pageTitle = $derived(defaultSeoTitle(page.data.lang));
	const pageDescription = $derived(defaultSeoDescription(page.data.lang));

	const featuredSeries = $derived<FeaturedSeriesItem[]>(data.featuredSeries);
	const upcomingSchedule = $derived<UpcomingScheduleItem[]>(data.upcomingSchedule);
	const countdownItems = $derived<CountdownItem[]>(data.countdown);
	const loadingFeatured = false;
	const loadingSchedule = false;

	const schedulePalette = [
		{ from: 'from-lavender to-mint', dot: 'bg-coral', b1: 'bg-lavender/15', b2: 'bg-mint/15' },
		{ from: 'from-coral to-lavender', dot: 'bg-mint', b1: 'bg-coral/15', b2: 'bg-lavender/15' },
		{ from: 'from-mint to-coral', dot: 'bg-lavender', b1: 'bg-mint/15', b2: 'bg-coral/15' },
	] as const;

	const stagger80Classes = [
		'stagger-80-0',
		'stagger-80-1',
		'stagger-80-2',
		'stagger-80-3',
		'stagger-80-4',
		'stagger-80-5',
		'stagger-80-6',
		'stagger-80-7',
		'stagger-80-8',
		'stagger-80-9',
		'stagger-80-10',
		'stagger-80-11'
	] as const;

	const floatDelayClasses = [
		'',
		'float-delay-neg-1',
		'float-delay-neg-2',
		'float-delay-neg-3',
		'float-delay-neg-4',
		'float-delay-neg-5',
		'float-delay-neg-6',
		'float-delay-neg-7',
		'float-delay-neg-8'
	] as const;

	function stagger80Class(index: number): string {
		return stagger80Classes[Math.min(index, stagger80Classes.length - 1)];
	}

	function floatDelayClass(index: number): string {
		return floatDelayClasses[Math.min(index, floatDelayClasses.length - 1)];
	}

	const canonicalUrl = $derived(absoluteUrl(page.url.origin, '/'));
	const homeJsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, '/', pageTitle, pageDescription),
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: SITE_NAME,
			url: canonicalUrl,
			inLanguage: page.data.lang === 'th' ? 'th-TH' : 'en-US',
			potentialAction: {
				'@type': 'SearchAction',
				target: `${absoluteUrl(page.url.origin, '/series')}?search={search_term_string}`,
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
			inLanguage: page.data.lang === 'th' ? 'th-TH' : 'en-US'
		},
		buildBreadcrumbJsonLd(page.url.origin, [{ name: m.nav_home(), path: '/' }])
	]));

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }
	};

	// --- Live countdown clock (requestAnimationFrame) ---
	// Synced to browser paint cycle for jank-free updates.
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

	// Only keep airings still in the future — when `diff <= 0` the card disappears.
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
			.filter((c) => c.diff > 0)
	);

	const pad = (n: number) => String(n).padStart(2, '0');
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

<a
	href="/{page.data.lang}/chat"
	data-sveltekit-preload-data="hover"
	aria-label={m.home_chat_aria_label()}
	class="group fixed right-4 z-[55] mobile-chat-fab flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-dark text-white shadow-xl shadow-coral/40 transition-all duration-300 active:scale-95 md:hidden"
>
	<svg class="h-5 w-5 transition-transform duration-300 group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
		<path stroke-linecap="round" stroke-linejoin="round" d="M21 12c0 4.142-4.03 7.5-9 7.5a10.55 10.55 0 0 1-3.72-.66L3 20.25l1.46-3.98A6.82 6.82 0 0 1 3 12c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5Z" />
	</svg>
</a>

<!-- Hero Section: Cosmic Observatory (light theme) -->
<section class="relative -mx-4 min-h-dvh overflow-hidden px-4 md:-mt-24 md:pt-24 flex items-center justify-center">
	<!-- light gradient base (per project theme) -->
	<div class="absolute inset-0 bg-gradient-mesh pointer-events-none"></div>
	<!-- soft pastel glows -->
	<div class="absolute -top-10 -left-10 w-72 h-72 sm:w-96 sm:h-96 bg-coral/20 rounded-full blur-[40px] sm:blur-[80px] animate-float pointer-events-none will-change-transform"></div>
	<div class="absolute bottom-0 -right-10 w-80 h-80 sm:w-[28rem] sm:h-[28rem] bg-lavender/20 rounded-full blur-[40px] sm:blur-[90px] animate-float-delayed pointer-events-none will-change-transform"></div>
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] sm:w-[40rem] sm:h-[40rem] bg-mint/10 rounded-full blur-[50px] sm:blur-[100px] pointer-events-none will-change-transform"></div>

	<!-- orbital system centerpiece: concentric rings + orbiting bodies -->
	<div class="absolute left-1/2 top-1/2 pointer-events-none">
		<!-- rings (centered on point) -->
		<div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] sm:w-[560px] sm:h-[560px] rounded-full border border-lavender/25"></div>
		<div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] sm:w-[380px] sm:h-[380px] rounded-full border border-dashed border-lavender/35"></div>
		<div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] sm:w-[210px] sm:h-[210px] rounded-full border border-coral/30"></div>
		<!-- orbit 3: mint, slow -->
		<div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] sm:w-[560px] sm:h-[560px] animate-[spin_26s_linear_infinite] will-change-transform"><span class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-mint shadow-[0_0_12px_rgba(110,231,183,0.7)]"></span></div>
		<!-- orbit 2: lavender, medium reverse -->
		<div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] sm:w-[380px] sm:h-[380px] animate-[spin_17s_linear_infinite_reverse] will-change-transform"><span class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-lavender-dark shadow-[0_0_12px_rgba(139,92,246,0.6)]"></span></div>
		<!-- orbit 1: coral, fast -->
		<div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] sm:w-[210px] sm:h-[210px] animate-[spin_9s_linear_infinite] will-change-transform"><span class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-coral shadow-[0_0_14px_rgba(255,107,157,0.85)]"></span></div>
		<!-- central soft glow behind text -->
		<div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] sm:w-[520px] sm:h-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.7)_0%,transparent_70%)]"></div>
	</div>

	<div class="relative z-10 text-center max-w-3xl mx-auto px-4 py-20 sm:py-24">
		<div class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/60 backdrop-blur-sm border border-lavender/20 mb-6 sm:mb-8 animate-slide-up">
			<span class="w-2 h-2 bg-coral rounded-full"></span>
			<span class="text-xs sm:text-sm font-medium text-plum-light">{m.home_hero_badge()}</span>
		</div>

		<h1 class="font-[family-name:var(--font-display)] text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-plum mb-4 sm:mb-6 animate-slide-up stagger-1 leading-[1.05]">
			{m.home_hero_title_start()}
			<span class="text-gradient">GL</span>
			<br class="hidden sm:block" />
			{m.home_hero_title_end()}
		</h1>

		<p class="text-base sm:text-lg md:text-xl text-plum-light max-w-xl mx-auto mb-4 leading-relaxed animate-slide-up stagger-2 px-2">
			{@html m.home_hero_subtitle()}
		</p>
		<p class="mx-auto mb-7 max-w-2xl px-3 text-sm leading-7 text-plum-light/85 sm:mb-10 sm:text-base animate-slide-up stagger-3">
			{m.home_hero_description()}
		</p>

		<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-slide-up stagger-4 px-4 sm:px-0">
			<a
				href="/{page.data.lang}/calendar"
				class="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold text-base sm:text-lg shadow-xl shadow-coral/25 hover:shadow-2xl hover:shadow-coral/30 hover:scale-105 transition-all duration-300 touch-target flex items-center justify-center gap-2"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
				{m.home_cta_schedule()}
			</a>
			<a
				href="/{page.data.lang}/explore/series"
				class="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl glass-card-strong text-plum font-semibold text-base sm:text-lg hover:bg-white/90 hover:scale-105 transition-all duration-300 touch-target flex items-center justify-center gap-2"
			>
				{m.home_cta_explore()}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
			</a>
		</div>

		<p class="mt-5 text-sm text-plum-light/80 animate-slide-up stagger-4">
			{m.home_hero_guide_prompt()}
			<a href="/{page.data.lang}/about" class="font-semibold text-coral-dark underline decoration-coral/30 underline-offset-4 transition hover:text-coral">
				{m.home_hero_guide_link()}
			</a>
		</p>
	</div>

	<!-- scroll hint -->
	<div class="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-1.5 text-plum-light/50 animate-float">
		<span class="text-[10px] uppercase tracking-[0.25em]">{m.home_scroll_hint()}</span>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
	</div>
</section>

<!-- Countdown: series airing within 24 hours (max 3, disappears at air time) -->
{#if activeCountdowns.length > 0}
	<section class="relative py-10 sm:py-14 -mx-4 px-4 overflow-hidden">
		<div class="absolute inset-0 bg-gradient-to-b from-coral/5 via-transparent to-lavender/5 pointer-events-none"></div>
		<div class="absolute top-10 right-0 w-40 h-40 sm:w-56 sm:h-56 bg-mint/10 rounded-full blur-3xl animate-float-delayed pointer-events-none"></div>
		<div class="relative max-w-6xl mx-auto">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
				<div>
					<div class="inline-flex items-center gap-2 mb-2">
						<span class="relative flex h-2.5 w-2.5">
							<span class="absolute inline-flex h-full w-full rounded-full bg-coral/40"></span>
							<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-coral"></span>
						</span>
						<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">{m.home_countdown_badge()}</span>
					</div>
					<h2 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold text-plum">
						<span>{m.home_countdown_title_plain()}</span><span class="text-coral">{m.home_countdown_title_accent()}</span>
					</h2>
					<p class="text-sm sm:text-base text-plum-light mt-1">{m.home_countdown_subtitle()}</p>
				</div>
				<a href="/{page.data.lang}/countdown" class="hidden sm:flex items-center gap-2 text-coral-dark font-medium hover:gap-3 transition-all text-sm touch-target">
					{m.common_see_all()}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
				</a>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				{#each activeCountdowns as c, i (c.id)}
					<a
						href="/{page.data.lang}/series/{c.seriesId}"
						class="group block animate-slide-up fill-mode-both {stagger80Class(i)}"
					>
						<article class="glass-card-strong rounded-[1.75rem] p-5 sm:p-6 relative overflow-hidden hover:-translate-y-1.5 transition-all duration-500 hover:shadow-2xl hover:shadow-coral/20 h-full flex flex-col">
							<!-- playful lightning badge: airing very soon -->
							<div class="absolute top-3.5 right-3.5 z-10">
								<div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-coral to-coral-dark shadow-lg shadow-coral/50 flex items-center justify-center rotate-[8deg]">
									<svg class="w-5 h-5 text-white -rotate-[8deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
								</div>
								<span class="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-mint shadow-[0_0_6px_rgba(110,231,183,0.95)]"></span>
							</div>
							<!-- decorative blobs -->
							<div class="absolute -top-10 -right-10 w-32 h-32 bg-coral/15 rounded-full blur-2xl pointer-events-none"></div>
							<div class="absolute -bottom-10 -left-10 w-32 h-32 bg-lavender/15 rounded-full blur-2xl pointer-events-none"></div>

							<!-- header: poster + meta -->
							<div class="relative flex items-center gap-3 mb-3 pr-12">
								<div class="flex-shrink-0 w-11 h-14 sm:w-12 sm:h-16 rounded-xl overflow-hidden bg-lavender/10 ring-1 ring-white/60">
									<img
										src={c.poster}
										alt={c.title}
										class="w-full h-full object-cover"
										loading="lazy"
										decoding="async"
									/>
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-1.5 mb-0.5">
										<h3 class="font-semibold text-plum text-sm sm:text-base truncate group-hover:text-coral-dark transition-colors">{c.title}</h3>
										{#if c.isUncut}
											<span class="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-coral/10 text-coral-dark text-[9px] font-bold border border-coral/20">{m.common_uncut()}</span>
										{/if}
									</div>
									<p class="text-xs text-plum-light truncate">{c.episode} · {c.platform}</p>
								</div>
							</div>

							<!-- orbital halo + HH:MM:SS (main display — no day, airing within 24h) -->
							<div class="relative flex-1 flex items-center justify-center py-5">
								<!-- วงแหวนโคจร + ดาวเทียม (สัญลักษณ์ของ GL-Orbit) — static เท่านั้น, ไม่ spin เพื่อลด GPU load -->
								<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-44 sm:h-44 pointer-events-none">
									<div class="absolute inset-0 rounded-full border-2 border-dashed border-lavender/25"></div>
								</div>

								<div class="relative text-center">
									<p class="text-[11px] font-semibold uppercase tracking-wider text-plum-light/70 mb-2">{m.home_countdown_airing_in()}</p>
									<div class="flex items-start justify-center gap-1.5 sm:gap-2 font-[family-name:var(--font-display)]">
										{@render timeUnit(pad(c.hours), m.home_countdown_hours_short())}
										<span aria-hidden="true" class="pt-2 sm:pt-2.5 text-3xl sm:text-4xl font-bold text-coral/60">:</span>
										{@render timeUnit(pad(c.minutes), m.home_countdown_minutes_short())}
										<span aria-hidden="true" class="pt-2 sm:pt-2.5 text-3xl sm:text-4xl font-bold text-coral/60">:</span>
										{@render timeUnit(pad(c.seconds), m.home_countdown_seconds_short())}
									</div>
								</div>
							</div>
						</article>
					</a>
				{/each}
			</div>

			<div class="text-center mt-7 sm:mt-9 sm:hidden">
				<a href="/{page.data.lang}/countdown" class="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold hover:shadow-xl hover:shadow-coral/25 hover:scale-105 transition-all text-sm sm:text-base touch-target">
					{m.common_load_more()}
					<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
				</a>
			</div>
		</div>
	</section>
{/if}

{#snippet timeUnit(value: string, label: string)}
	<div class="flex flex-col items-center gap-1.5">
		<span class="min-w-[3rem] sm:min-w-[3.75rem] text-center rounded-2xl bg-white/80 backdrop-blur-sm text-plum px-2.5 py-2 text-3xl sm:text-4xl font-bold tabular-nums shadow-lg shadow-lavender/15 ring-1 ring-white/70 border border-lavender/20">
			{value}
		</span>
		<span class="text-[11px] font-semibold text-plum-light/80">{label}</span>
	</div>
{/snippet}

<!-- Featured Series -->
<!-- Featured Series: Celestial Bodies -->
<section class="relative py-12 sm:py-20 -mx-4 px-4 content-visibility-auto">
	<div class="max-w-6xl mx-auto">
		<div class="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-4">
			<div>
				<div class="inline-flex items-center gap-2 mb-2">
					<svg class="w-4 h-4 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
					<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">{m.home_section_status_ongoing()}</span>
				</div>
				<h2 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold text-plum mb-2">
					<span>{m.home_featured_title_plain()}</span><span class="text-coral">{m.home_featured_title_accent()}</span>
				</h2>
				<p class="text-sm sm:text-base text-plum-light">{m.home_featured_subtitle()}</p>
			</div>
			<a href="/{page.data.lang}/series" class="flex items-center gap-2 text-coral-dark font-medium hover:gap-3 transition-all text-sm sm:text-base touch-target">
				{m.home_featured_see_all()}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
			</a>
		</div>

		{#if loadingFeatured}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
				{#each Array(4) as _, i}
					<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
						<div class="relative aspect-[3/4] overflow-hidden">
							<div class="absolute inset-0 bg-lavender/10 animate-pulse"></div>
							<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5 space-y-2">
								<div class="h-3 w-1/2 bg-white/20 rounded animate-pulse"></div>
								<div class="h-5 w-3/4 bg-white/30 rounded animate-pulse"></div>
								<div class="h-3 w-2/3 bg-white/20 rounded animate-pulse"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if featuredSeries.length === 0}
			<div class="text-center py-16">
				<div class="relative w-20 h-20 mx-auto mb-4">
					<div class="absolute inset-0 rounded-full border-2 border-dashed border-lavender/30"></div>
					<div class="absolute inset-0 flex items-center justify-center">
						<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
					</div>
				</div>
				<h3 class="font-semibold text-plum mb-1">{m.home_featured_empty_title()}</h3>
				<p class="text-sm text-plum-light">{m.home_featured_empty_desc()}</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
				{#each featuredSeries as series, i (series.id)}
					<a href="/{page.data.lang}/series/{series.id}" class="group">
						<div class="relative rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/30 transition-all duration-500 hover:-translate-y-2">
							<!-- glow halo behind poster -->
							<div class="absolute -inset-2 bg-gradient-to-br from-coral/20 via-lavender/15 to-mint/15 rounded-[1.75rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
							<div class="relative aspect-[3/4] overflow-hidden ring-1 ring-white/40">
								<img
									src={series.poster}
									alt={series.title}
									class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
									width={400}
									height={533}
									loading={i === 0 ? 'eager' : 'lazy'}
									decoding="async"
									fetchpriority={i === 0 ? 'high' : 'auto'}
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-plum via-plum/20 to-transparent"></div>

								<div class="absolute top-3 sm:top-4 left-3 sm:left-4">
									<span class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md {statusConfig[series.status].class}">
										{statusConfig[series.status].text}
									</span>
								</div>
								<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
									<p class="text-white/70 text-xs sm:text-sm mb-1">{series.studio}</p>
									<h3 class="text-white font-bold text-lg sm:text-xl mb-1 group-hover:text-coral-light transition-colors">{series.title}</h3>
									<p class="text-white/80 text-xs sm:text-sm truncate">{series.subtitle}</p>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Upcoming Schedule: Orbital Timeline -->
<section class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] px-4 pb-[calc(1.5rem+var(--bottom-nav-reserved-space))] pt-12 sm:pt-20 sm:pb-[calc(2rem+var(--bottom-nav-reserved-space))] md:mb-0 md:pb-6 overflow-hidden content-visibility-auto">
	<div class="absolute inset-0 bg-gradient-to-b from-lavender/5 via-transparent to-coral/5 pointer-events-none"></div>
	<div class="absolute top-10 right-4 w-40 h-40 sm:w-56 sm:h-56 bg-mint/10 rounded-full blur-3xl animate-float-delayed pointer-events-none"></div>

	<div class="relative max-w-2xl mx-auto">
		<div class="text-center mb-8 sm:mb-12">
			<div class="inline-flex items-center gap-2 mb-3">
				<svg class="w-4 h-4 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
				<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">{m.home_schedule_badge()}</span>
			</div>
			<h2 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold text-plum mb-2">
				{m.home_schedule_title_plain()}<span class="text-coral">{m.home_schedule_title_accent()}</span>
			</h2>
			<p class="text-sm sm:text-base text-plum-light">{m.home_schedule_subtitle()}</p>
		</div>

		{#if loadingSchedule}
			<div class="space-y-4">
				{#each Array(3) as _, i}
					<div class="flex gap-4 sm:gap-5">
						<div class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-lavender/10 animate-pulse"></div>
						<div class="flex-1 glass-card rounded-2xl p-4 sm:p-5 space-y-2">
							<div class="h-4 w-3/4 bg-lavender/10 rounded animate-pulse"></div>
							<div class="h-3 w-1/2 bg-lavender/10 rounded animate-pulse"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if upcomingSchedule.length === 0}
			<div class="text-center py-16">
				<div class="relative w-20 h-20 mx-auto mb-4">
					<div class="absolute inset-0 rounded-full border-2 border-dashed border-lavender/30"></div>
					<div class="absolute inset-0 flex items-center justify-center">
						<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
					</div>
				</div>
				<h3 class="font-semibold text-plum mb-1">{m.home_schedule_empty_title()}</h3>
				<p class="text-sm text-plum-light">{m.home_schedule_empty_desc()}</p>
			</div>
		{:else}
			<div class="relative">
				<!-- gradient spine (coral → lavender → mint) -->
				<div class="absolute left-7 sm:left-8 top-2 bottom-2 w-0.5 bg-gradient-to-b from-coral via-lavender to-mint opacity-40"></div>

				<div class="space-y-4 sm:space-y-5">
					{#each upcomingSchedule as item, i (item.seriesId + '-' + i)}
						<a
							href="/{page.data.lang}/series/{item.seriesId}"
							class="relative flex items-center gap-4 sm:gap-5 group animate-slide-up fill-mode-both {stagger80Class(i)}"
						>
							<!-- planet node with orbital ring -->
							<div class="relative flex-shrink-0 z-10">
								<div class="absolute inset-0 pointer-events-none">
									<div class="absolute -inset-2.5 rounded-full border border-dashed border-lavender/25 animate-[spin_12s_linear_infinite]"></div>
									<div class="absolute -inset-2.5 animate-[spin_12s_linear_infinite] float-delay-spin-satellite">
										<span class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-coral/70 shadow-[0_0_6px_rgba(255,107,157,0.7)]"></span>
									</div>
								</div>
								<div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-coral-light to-lavender-light text-plum flex flex-col items-center justify-center ring-4 ring-cream group-hover:ring-coral/40 group-hover:scale-110 transition-all shadow-lg shadow-lavender/30 border border-white/80">
									<span class="text-[10px] font-bold text-coral-dark leading-none">{item.day}</span>
									<span class="text-xs sm:text-sm font-extrabold tabular-nums leading-tight">{item.time}</span>
								</div>
							</div>

							<!-- content card with playful rocket badge -->
							<div class="flex-1 min-w-0 relative glass-card rounded-2xl p-4 sm:p-5 pr-10 sm:pr-12 overflow-hidden group-hover:shadow-lg group-hover:shadow-lavender/15 group-hover:-translate-y-0.5 transition-all duration-300">
								<!-- decorative blobs -->
								<div class="absolute -top-10 -right-10 w-28 h-28 {schedulePalette[i % 3].b1} rounded-full blur-2xl pointer-events-none"></div>
								<div class="absolute -bottom-8 -left-8 w-24 h-24 {schedulePalette[i % 3].b2} rounded-full blur-2xl pointer-events-none"></div>

								<!-- playful rocket badge -->
								<div class="absolute top-2.5 right-2.5 z-10 animate-float {floatDelayClass(i)}">
									<div class="w-9 h-9 rounded-2xl bg-gradient-to-br {schedulePalette[i % 3].from} shadow-lg shadow-lavender/40 flex items-center justify-center rotate-[6deg]">
										<svg class="w-4 h-4 text-white -rotate-[6deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-3 4-4 7-4 10v2l-1 2h10l-1-2v-2c0-3-1-6-4-10z"/><circle cx="12" cy="10" r="1.5" fill="white" opacity="0.6"/><path d="M10 17c0 1.5 2 2.5 2 2.5s2-1 2-2.5" fill="currentColor" opacity="0.4"/></svg>
									</div>
									<span class="absolute -bottom-1 -right-1 w-2 h-2 rounded-full {schedulePalette[i % 3].dot} shadow-[0_0_5px_rgba(196,181,253,0.8)]"></span>
								</div>

								<!-- card info -->
								<div class="flex items-center gap-2 mb-1 relative">
									<h3 class="font-semibold text-plum text-sm sm:text-base truncate group-hover:text-coral-dark transition-colors">{item.series}</h3>
									{#if item.isUncut}
										<span class="flex-shrink-0 px-2 py-0.5 rounded-full bg-coral/10 text-coral-dark text-[10px] sm:text-xs font-bold border border-coral/20">{m.common_uncut()}</span>
									{/if}
								</div>
								<div class="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-plum-light relative">
									<span class="truncate">{item.episode}</span>
									<span class="w-1 h-1 rounded-full bg-lavender flex-shrink-0"></span>
									<span class="truncate">{item.platform}</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<div class="text-center mt-8 sm:mt-10">
			<a href="/{page.data.lang}/calendar" class="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold hover:shadow-xl hover:shadow-coral/25 hover:scale-105 transition-all text-sm sm:text-base touch-target">
				<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
				{m.home_schedule_cta()}
			</a>
		</div>
	</div>
</section>
