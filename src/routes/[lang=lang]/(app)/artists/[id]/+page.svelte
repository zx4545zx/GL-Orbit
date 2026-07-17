<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Picture from '$lib/components/Picture.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
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

	const artist = $derived(data.artist);
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);

	const statusConfig: Record<string, { text: string; dot: string; chip: string }> = {
		ONGOING: { text: m.status_ongoing(), dot: 'bg-mint', chip: 'text-mint-dark border-mint/40' },
		UPCOMING: { text: m.status_upcoming(), dot: 'bg-lavender', chip: 'text-lavender-dark border-lavender/50' },
		ENDED: { text: m.status_ended(), dot: 'bg-coral', chip: 'text-coral-dark border-coral/40' }
	};

	const seoTitle = $derived(m.artist_detail_seo_title({ name: artist.nickname }));
	const seoDescription = $derived(
		truncateSeo(m.artist_detail_seo_description({ name: artist.nickname }))
	);
	const canonicalPath = $derived(`/artists/${artist.id}`);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const artistJsonLd = $derived(
		safeJsonLd([
			{
				'@context': 'https://schema.org',
				'@type': 'Person',
				name: artist.nickname,
				additionalName: artist.fullNameEn || undefined,
				alternateName: artist.fullNameTh || undefined,
				image: artist.profileImageUrl,
				url: canonicalUrl,
				sameAs: artist.socials.map((s) => s.url),
				knowsFor: artist.series.map((s) => s.titleEn)
			},
			buildBreadcrumbJsonLd(page.url.origin, [
				{ name: m.nav_home(), path: localizedPath(currentLang, '') },
				{ name: m.nav_artists(), path: localizedPath(currentLang, '/artists') },
				{ name: artist.nickname, path: localizedPath(currentLang, canonicalPath) }
			])
		])
	);

	const primaryMeta = $derived(
		[
			{ label: m.artist_works_label(), value: artist.series.length },
			{ label: m.artist_socials_label(), value: artist.socials.length },
			{ label: m.nav_ships(), value: artist.ships.length }
		]
	);

	const momentsHref = $derived(latestMomentsHref(page.data.lang, 'artist', artist.id));

	const shipPath = (slug: string) => localizedPath(currentLang, `/ships/${slug}`);
	const seriesPath = (id: string) => localizedPath(currentLang, `/series/${id}`);
	const backHref = $derived(localizedPath(currentLang, '/artists'));
	const goBack = () => {
		if (typeof history !== 'undefined' && history.length > 1) history.back();
		else goto(localizedPath(currentLang, '/artists'));
	};

	type SocialMeta = {
		label: string;
		bgClass: string;
		stroke: boolean;
		icon: string;
		brandBadge: string;
	};

	const IG = 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';
	const X = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
	const YT = 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z';
	const TT = 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';
	const FB = 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';
	const LINE = 'M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.05.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314';
	const GLOBE = 'M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zm0 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20z';

	function socialMeta(platform: string): SocialMeta {
		const p = platform.toLowerCase();
		if (p.includes('instagram')) return { label: 'Instagram', bgClass: 'social-bg-instagram', stroke: false, icon: IG, brandBadge: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]' };
		if (p.includes('twitter') || p === 'x') return { label: 'X (Twitter)', bgClass: 'social-bg-x', stroke: false, icon: X, brandBadge: 'bg-black' };
		if (p.includes('youtube') || p.includes('yt')) return { label: 'YouTube', bgClass: 'social-bg-youtube', stroke: false, icon: YT, brandBadge: 'bg-[#FF0000]' };
		if (p.includes('tiktok')) return { label: 'TikTok', bgClass: 'social-bg-tiktok', stroke: false, icon: TT, brandBadge: 'bg-black' };
		if (p.includes('facebook') || p.includes('fb')) return { label: 'Facebook', bgClass: 'social-bg-facebook', stroke: false, icon: FB, brandBadge: 'bg-[#1877F2]' };
		if (p.includes('line')) return { label: 'LINE', bgClass: 'social-bg-line', stroke: false, icon: LINE, brandBadge: 'bg-[#00B900]' };
		return { label: platform, bgClass: 'social-bg-default', stroke: true, icon: GLOBE, brandBadge: 'bg-plum' };
	}
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="profile" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={artist.profileImageUrl} />
	<meta property="og:image:width" content="400" />
	<meta property="og:image:height" content="400" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={artist.profileImageUrl} />
	{@html jsonLdScript(artistJsonLd)}
</svelte:head>

<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-cream pb-[calc(3rem+var(--bottom-nav-reserved-space))] md:-mt-24 md:mb-0 md:pb-20 md:pt-24">
	<div aria-hidden="true" class="pointer-events-none absolute left-[-12rem] top-[36rem] h-[34rem] w-[34rem] rounded-full bg-lavender/20 blur-3xl"></div>
	<div aria-hidden="true" class="pointer-events-none absolute right-[-14rem] top-[78rem] h-[38rem] w-[38rem] rounded-full bg-coral/15 blur-3xl"></div>

	<div class="relative mx-auto max-w-[90rem] px-4 pt-4 sm:px-6 sm:pt-6 md:px-8">
		<!-- Hero card: poster frame + title block. -->
		<section class="relative isolate overflow-hidden rounded-[1.75rem] bg-white shadow-[0_36px_90px_-44px_rgba(45,27,46,0.35)] sm:rounded-[2.5rem]">
			<div class="relative flex items-center justify-between gap-3 p-4 border-b border-plum/5 bg-cream/60 sm:p-7">
				<button
					type="button"
					onclick={goBack}
					class="inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-sm font-bold text-plum shadow-lg backdrop-blur-md transition hover:bg-coral hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral touch-target"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
					<span>{m.common_back()}</span>
				</button>
				<span class="inline-flex items-center gap-2 rounded-full border border-coral/30 bg-white/92 px-3.5 py-2 text-xs font-black text-coral-dark shadow-lg backdrop-blur-md sm:text-sm">
					<span class="h-2 w-2 rounded-full bg-coral"></span>
					<span>{m.common_cast()}</span>
				</span>
			</div>

			<div class="relative px-5 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8 lg:min-h-[25rem] lg:py-12 lg:pl-[22rem] lg:pr-14">
				<div class="relative z-10 mx-auto w-[72vw] max-w-[15rem] rotate-[1.5deg] sm:w-[15rem] lg:absolute lg:bottom-6 lg:left-14 lg:rotate-[2.5deg]">
					<div class="overflow-hidden rounded-[1.75rem] bg-white p-2 shadow-[0_28px_65px_-24px_rgba(45,27,46,0.45)] ring-1 ring-plum/8">
						<Picture src={artist.profileImageUrl} type="profiles" sizes="(max-width: 333px) 72vw, 240px" alt={artist.nickname} width={480} height={720} loading="eager" class="aspect-[2/3] w-full rounded-[1.3rem] object-cover" />
					</div>
					<div class="absolute -bottom-3 -left-3 grid h-14 w-14 -rotate-[8deg] place-items-center rounded-full bg-coral text-center text-white shadow-xl sm:h-16 sm:w-16 lg:-bottom-4 lg:-left-5 lg:h-20 lg:w-20">
						<span class="font-[family-name:var(--font-display)] text-lg font-black leading-none sm:text-xl lg:text-2xl">{artist.series.length}<small class="mt-1 block text-[7px] font-bold uppercase tracking-[0.2em] lg:text-[8px]">{m.artist_works_count_label()}</small></span>
					</div>
				</div>

				<div class="mt-6 min-w-0 text-center lg:mt-0 lg:text-left">
					<p class="mb-4 text-[10px] font-black uppercase tracking-[0.42em] text-coral-dark sm:text-xs">GL-ORBIT / ARTIST FILE</p>
					<h1 class="flex flex-wrap justify-center gap-x-4 font-[family-name:var(--font-display)] text-[clamp(2rem,10vw,2.5rem)] font-black leading-[0.86] tracking-[-0.07em] text-plum sm:text-6xl lg:justify-start lg:text-7xl xl:text-8xl">
						{#each artist.nickname.split(' ') as w, i}{#if i > 0} {/if}<span>{w}</span>{/each}
					</h1>
					{#if artist.fullNameEn || artist.fullNameTh}
						<p class="mt-5 font-[family-name:var(--font-thai)] text-xl font-semibold leading-snug text-plum-light/80 sm:text-2xl lg:text-3xl">
							{#if artist.fullNameEn}<span class="block">{artist.fullNameEn}</span>{/if}{#if artist.fullNameTh}<span class="mt-1 block text-plum-light/65">{artist.fullNameTh}</span>{/if}
						</p>
					{/if}
				</div>
			</div>
		</section>

		<!-- Artist telemetry: facts and sharing behave as one compact control board. -->
		<section class="relative z-30 mx-3 mt-5 overflow-visible rounded-[2rem] bg-plum p-3 text-white shadow-[0_30px_70px_-36px_rgba(45,27,46,0.9)] sm:mx-8 sm:p-5 lg:mx-14" aria-label="Artist signals">
			<div class="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full border-[22px] border-white/5" aria-hidden="true"></div>
			<div class="relative mb-3 flex items-end justify-between gap-4 px-2 pt-2 sm:mb-4">
				<div class="min-w-0">
					<p class="text-[9px] font-black uppercase tracking-[0.38em] text-coral-light sm:text-[10px]">Artist signals</p>
					<p class="mt-1 truncate text-xs font-semibold text-white/55 sm:text-sm">{artist.nickname} / orbit data</p>
				</div>
				<span class="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/70 sm:text-[9px]">Live profile</span>
			</div>

			<div class="relative grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
				{#each primaryMeta as item, index}
					<div class="group relative flex min-h-[6.75rem] min-w-0 flex-col justify-between overflow-hidden rounded-[1.5rem] bg-white/10 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white/15">
						<span class="absolute right-4 top-3 font-[family-name:var(--font-display)] text-[9px] font-black tracking-[0.18em] text-white/25">0{index + 1}</span>
						<div class="font-[family-name:var(--font-display)] text-3xl font-black leading-none text-white sm:text-4xl">{item.value}</div>
						<div class="truncate text-[9px] font-black uppercase tracking-[0.18em] text-white/55 sm:text-[10px]">{item.label}</div>
					</div>
				{/each}
				<ShareButton title={m.artist_share_title({ name: artist.nickname })} text={m.artist_share_text({ name: artist.nickname })} url={canonicalUrl} ariaLabel={m.artist_share_aria_label()} variant="orbit" ordinal={null} className="h-full w-full min-h-[6.75rem] !rounded-[1.5rem] sm:min-h-0" />
			</div>

			{#if artist.socials.length > 0}
				<div class="relative mt-2 flex flex-wrap items-center gap-2 rounded-[1.35rem] bg-white/5 p-3 sm:mt-3 sm:px-4">
					<span class="mr-1 text-[8px] font-black uppercase tracking-[0.24em] text-white/40 sm:text-[9px]">Signals</span>
					{#each artist.socials as social (social.id)}
						{@const meta = socialMeta(social.platform)}
						<span class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white/80 sm:text-xs">
							<span aria-hidden="true" class="grid h-4 w-4 place-items-center rounded-full {meta.brandBadge} text-white">
								<svg class="h-2.5 w-2.5" fill={meta.stroke ? 'none' : 'currentColor'} stroke={meta.stroke ? 'currentColor' : 'none'} viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={meta.icon} /></svg>
							</span>
							<span class="truncate">{meta.label}</span>
						</span>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Chapter 01: orbiting pairs sit inside a soft editorial interlude. -->
		{#if artist.ships.length > 0}
			<section class="mt-20 overflow-hidden rounded-[2rem] bg-lavender-light/70 p-4 text-plum min-[360px]:p-5 sm:mt-36 sm:rounded-[3rem] sm:p-10 lg:p-14 perf-section" aria-labelledby="ships-heading">
				<header class="mb-6 sm:mb-14">
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">01 / Chemistry</p>
					<h2 id="ships-heading" class="mt-2 text-4xl font-black sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{m.series_detail_ships()}</h2>
				</header>
				<div class="grid grid-cols-2 gap-2 sm:gap-4 {artist.ships.length === 1 ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}">
					{#each artist.ships as ship (ship.id)}
						<a href={shipPath(ship.slug)} class="group relative min-h-0 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/75 p-3 shadow-[0_18px_45px_rgba(45,27,46,0.08)] transition hover:-translate-y-1 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:min-h-[23rem] sm:rounded-[2rem] sm:p-5 sm:shadow-[0_24px_60px_rgba(45,27,46,0.09)] {artist.ships.length === 1 ? 'col-span-2 sm:grid sm:min-h-0 sm:grid-cols-[18rem_minmax(0,1fr)] sm:items-center sm:gap-10 sm:p-8 lg:col-span-1' : ''}">
							<div aria-hidden="true" class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-coral/15 blur-2xl sm:-right-10 sm:-top-10 sm:h-40 sm:w-40"></div>
							<div class="relative mx-auto flex max-w-[8.5rem] items-center justify-center sm:mt-2 sm:max-w-[17rem] {artist.ships.length === 1 ? 'sm:mt-0' : ''}">
								<div class="relative z-10 w-[62%] overflow-hidden rounded-full border-[3px] border-white bg-coral-light shadow-md sm:border-4 sm:shadow-lg">
									<Picture src={artist.profileImageUrl} type="profiles" sizes="(max-width: 639px) 84px, 190px" alt={artist.nickname} width={320} height={320} loading="lazy" class="aspect-square w-full object-cover transition duration-500 group-hover:-rotate-2 group-hover:scale-105" />
								</div>
								<div class="relative -ml-[24%] mt-10 w-[62%] overflow-hidden rounded-full border-[3px] border-white bg-lavender-light shadow-md sm:mt-24 sm:border-4 sm:shadow-lg">
									<Picture src={ship.partner.imageUrl} type="profiles" sizes="(max-width: 639px) 84px, 190px" alt={ship.partner.nickname} width={320} height={320} loading="lazy" class="aspect-square w-full object-cover transition duration-500 group-hover:rotate-2 group-hover:scale-105" />
								</div>
							</div>
							<div class="relative mt-3 text-center sm:mt-5 {artist.ships.length === 1 ? 'sm:mt-0 sm:text-left' : ''}">
								<h3 class="break-words font-[family-name:var(--font-display)] text-[10px] font-black leading-tight tracking-[-0.06em] text-plum [overflow-wrap:anywhere] min-[360px]:text-xs sm:text-2xl sm:tracking-[-0.04em] {artist.ships.length === 1 ? 'sm:text-5xl' : ''}">{ship.name}</h3>
								<p class="mt-1 break-words text-[9px] font-semibold leading-[1.45] text-plum-light/65 [overflow-wrap:anywhere] min-[360px]:text-[10px] sm:text-xs sm:leading-relaxed">{artist.nickname} × {ship.partner.nickname}</p>
								{#if ship.seriesCount > 0}
									<span class="mt-2 inline-flex items-center gap-1 rounded-full bg-coral/12 px-2.5 py-1 text-[9px] font-bold text-coral-dark min-[360px]:text-[10px] sm:text-xs">{m.ships_series_count({ count: ship.seriesCount })}</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Chapter 02: filmography grid — portrait cards on mobile, indexed wall on larger screens. -->
		{#if artist.series.length > 0}
			<section class="mt-24 sm:mt-32 perf-section" aria-labelledby="filmography-heading">
				<header class="mb-6 flex flex-wrap items-end justify-between gap-5 sm:mb-14">
					<div>
						<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">02 / Filmography</p>
						<h2 id="filmography-heading" class="mt-2 text-5xl font-black text-plum sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{m.artist_works_heading()}</h2>
					</div>
					<div class="flex min-h-11 items-center rounded-full bg-mint px-3 text-center font-[family-name:var(--font-display)] text-xl font-black text-plum sm:grid sm:h-24 sm:w-24 sm:place-items-center sm:px-0 sm:text-4xl">
						<span>{artist.series.length}<small class="ml-1 text-[7px] font-black uppercase tracking-[0.2em] sm:ml-0 sm:block sm:text-[8px]">{m.artist_works_count_label()}</small></span>
					</div>
				</header>

				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-6 lg:gap-y-16">
					{#each artist.series as s, index (s.id)}
						{@const st = statusConfig[s.status] ?? null}
						<a href={seriesPath(s.id)} class="group relative block min-w-0 rounded-[1.25rem] border border-white/80 bg-white/70 p-2 shadow-[0_14px_34px_-28px_rgba(45,27,46,0.7)] transition hover:-translate-y-1 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:rounded-[1.75rem] sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:hover:bg-transparent {index % 2 === 1 ? 'sm:mt-8' : ''}">
							<span aria-hidden="true" class="absolute -left-1 -top-5 z-10 hidden font-[family-name:var(--font-display)] text-5xl font-black tracking-[-0.08em] text-coral sm:block">{String(index + 1).padStart(2, '0')}</span>
							<div class="overflow-hidden rounded-[1.25rem] bg-lavender/25 shadow-[0_24px_50px_-34px_rgba(45,27,46,0.65)] sm:rounded-[1.5rem]">
								<Picture src={s.posterUrl} type="posters" sizes="(max-width: 639px) 44vw, (max-width: 1024px) 24vw, 220px" alt={s.titleEn} width={320} height={480} loading="lazy" class="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
							</div>
							<div class="relative px-1 pt-3 sm:px-1 sm:pt-4">
								{#if st}
									<span class="inline-flex items-center gap-1.5 rounded-full border bg-white px-2 py-0.5 text-[9px] font-black sm:text-[10px] {st.chip}">
										<span class="h-1.5 w-1.5 rounded-full {st.dot}"></span>
										<span>{st.text}</span>
									</span>
								{/if}
								<h3 class="mt-2 break-words font-[family-name:var(--font-display)] text-base font-black leading-[1.35] text-plum transition [overflow-wrap:anywhere] group-hover:text-coral-dark min-[360px]:text-lg sm:text-xl">{s.titleEn}</h3>
								{#if s.titleTh}
									<p class="mt-1 break-words font-[family-name:var(--font-thai)] text-xs font-medium text-plum-light/70 [overflow-wrap:anywhere] sm:text-sm">{s.titleTh}</p>
								{/if}
								<p class="mt-1 truncate text-[10px] font-semibold text-plum-light/55 sm:text-xs">{s.roleName}{#if s.studio} · {s.studio}{/if}</p>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{:else}
			<section class="mt-24 sm:mt-32" aria-labelledby="filmography-heading">
				<header class="mb-6 sm:mb-14">
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">02 / Filmography</p>
					<h2 id="filmography-heading" class="mt-2 text-5xl font-black text-plum sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{m.artist_works_heading()}</h2>
				</header>
				<div class="rounded-[1.75rem] bg-white/80 p-8 text-center shadow-lg shadow-lavender/10 sm:rounded-[2.5rem] sm:p-12">
					<p class="font-[family-name:var(--font-display)] text-xl font-black text-plum sm:text-2xl">{m.artist_detail_empty_title()}</p>
					<p class="mt-2 font-[family-name:var(--font-thai)] text-sm font-medium text-plum-light/70 sm:text-base">{m.artist_detail_empty_desc()}</p>
					<a href={backHref} class="mt-5 inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white transition hover:bg-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral touch-target">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
						<span>{m.artist_detail_empty_back_home()}</span>
					</a>
				</div>
			</section>
		{/if}

		<!-- Chapter 03: social signals — sticky header on lg, brand badges on each card. -->
		{#if artist.socials.length > 0}
			<section class="mt-24 grid gap-8 sm:mt-32 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-12 perf-section" aria-labelledby="socials-heading">
				<header class="lg:sticky lg:top-28 lg:self-start">
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">03 / Social</p>
					<h2 id="socials-heading" class="mt-2 flex flex-wrap gap-x-3 text-4xl font-black text-plum sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.1] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-[0.88] tracking-[-0.065em]'}">
			{#if currentLang === 'th'}<span>โซเชียล</span><span>มีเดีย</span>{:else}<span>{m.artist_socials_heading()}</span>{/if}
		</h2>
					<p class="mt-5 max-w-[14rem] text-sm font-medium leading-6 text-plum-light/60">{artist.socials.length} {m.artist_socials_label()}</p>
				</header>

				<div class="grid min-w-0 gap-3 sm:grid-cols-2">
					{#each artist.socials as social (social.id)}
						{@const meta = socialMeta(social.platform)}
						<a
							href={social.url}
							target="_blank"
							rel="noopener noreferrer"
							class="group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-[1.5rem] bg-white p-4 shadow-[0_18px_46px_-38px_rgba(45,27,46,0.75)] transition hover:-translate-y-1 hover:shadow-[0_22px_52px_-34px_rgba(45,27,46,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral perf-card sm:p-5"
						>
							<span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl {meta.brandBadge} text-white shadow-sm transition group-hover:scale-105 group-hover:-rotate-3" aria-hidden="true">
								{#if social.iconUrl}
									<img src={social.iconUrl} alt={meta.label} width={28} height={28} loading="lazy" decoding="async" class="h-7 w-7 rounded-md object-cover" />
								{:else if meta.stroke}
									<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={meta.icon} /></svg>
								{:else}
									<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d={meta.icon} /></svg>
								{/if}
							</span>
							<span class="relative min-w-0 flex-1 text-left">
								<span class="block font-[family-name:var(--font-display)] text-base font-black tracking-[-0.02em] text-plum transition group-hover:text-coral-dark sm:text-lg">{meta.label}</span>
								<span class="mt-1 block truncate text-xs font-semibold text-plum-light/60 sm:text-sm">{social.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
							</span>
							<svg class="h-4 w-4 shrink-0 text-plum-light/45 transition group-hover:text-coral-dark sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
						</a>
					{/each}
				</div>
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
