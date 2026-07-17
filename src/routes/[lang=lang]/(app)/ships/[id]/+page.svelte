<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import {
		buildBreadcrumbJsonLd,
		buildCanonicalUrl,
		jsonLdScript,
		localizedPath,
		safeJsonLd
	} from '$lib/seo.js';
	import { latestMomentsHref } from '$lib/moments/latest-moments.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const ship = $derived(data.ship);
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);

	const statusConfig: Record<string, { text: string; dot: string; chip: string }> = {
		ONGOING: { text: m.status_ongoing(), dot: 'bg-mint', chip: 'text-mint-dark border-mint/40' },
		UPCOMING: { text: m.status_upcoming(), dot: 'bg-lavender', chip: 'text-lavender-dark border-lavender/50' },
		ENDED: { text: m.status_ended(), dot: 'bg-coral', chip: 'text-coral-dark border-coral/40' }
	};

	const seoTitle = $derived(`${ship.name} | ${m.nav_ships()} GL-Orbit`);
	const canonicalPath = $derived(`/ships/${ship.slug}`);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));

	const shareTitle = currentLang === 'th' ? `ฝากรู้จัก 「${ship.name}」 บน GL-Orbit 💕` : `Meet 「${ship.name}」 on GL-Orbit 💕`;
	const shareText = currentLang === 'th' ? `มาทำคาวรู้จักคู่จิ้น「${ship.name}」บน GL-Orbit` : `Meet ship 「${ship.name}」 on GL-Orbit`;
	const shareAriaLabel = currentLang === 'th' ? 'แชร์คู่จิ้นนี้' : 'Share this ship';

	const primaryMeta = $derived([
		{ label: m.ships_shared_works(), value: ship.series.length },
		{ label: m.common_people(), value: 2 },
		{ label: currentLang === 'th' ? 'แฮชแท็ก' : 'Hashtags', value: ship.hashtags.length }
	]);

	const momentsHref = $derived(latestMomentsHref(page.data.lang, 'ship', ship.id));

	const artistPath = (id: string) => localizedPath(currentLang, `/artists/${id}`);
	const seriesPath = (id: string) => localizedPath(currentLang, `/series/${id}`);
	const backHref = $derived(localizedPath(currentLang, '/ships'));

	const jsonLd = $derived(
		safeJsonLd([
			{
				'@context': 'https://schema.org',
				'@type': 'ProfilePage',
				name: ship.name,
				description: ship.description,
				image: ship.imageUrl,
				url: canonicalUrl,
				about: [
					{ '@type': 'Person', name: ship.artist1.name },
					{ '@type': 'Person', name: ship.artist2.name }
				]
			},
			buildBreadcrumbJsonLd(page.url.origin, [
				{ name: m.nav_home(), path: localizedPath(currentLang, '') },
				{ name: m.nav_ships(), path: localizedPath(currentLang, '/ships') },
				{ name: ship.name, path: localizedPath(currentLang, canonicalPath) }
			])
		])
	);
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={ship.description || seoTitle} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="profile" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={ship.description || seoTitle} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ship.imageUrl} />
	<meta property="og:image:width" content="400" />
	<meta property="og:image:height" content="600" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={ship.description || seoTitle} />
	<meta name="twitter:image" content={ship.imageUrl} />
	{@html jsonLdScript(jsonLd)}
</svelte:head>

<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-cream pb-[calc(3rem+var(--bottom-nav-reserved-space))] md:-mt-24 md:mb-0 md:pb-20 md:pt-24">
	<div aria-hidden="true" class="pointer-events-none absolute left-[-12rem] top-[36rem] h-[34rem] w-[34rem] rounded-full bg-lavender/20 blur-3xl"></div>
	<div aria-hidden="true" class="pointer-events-none absolute right-[-14rem] top-[78rem] h-[38rem] w-[38rem] rounded-full bg-coral/15 blur-3xl"></div>

	<div class="relative mx-auto max-w-[90rem] px-4 pt-4 sm:px-6 sm:pt-6 md:px-8">
		<!-- Hero card: poster frame + title block. -->
		<section class="relative isolate overflow-hidden rounded-[1.75rem] bg-white shadow-[0_36px_90px_-44px_rgba(45,27,46,0.35)] sm:rounded-[2.5rem]">
			<div class="relative flex items-center justify-between gap-3 p-4 border-b border-plum/5 bg-cream/60 sm:p-7">
				<a href={backHref} class="inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-sm font-bold text-plum shadow-lg backdrop-blur-md transition hover:bg-coral hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral touch-target">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
					<span>{m.common_back()}</span>
				</a>
				<span class="inline-flex items-center gap-2 rounded-full border border-coral/30 bg-white/92 px-3.5 py-2 text-xs font-black text-coral-dark shadow-lg backdrop-blur-md sm:text-sm">
					<span class="h-2 w-2 rounded-full bg-coral"></span>
					<span>{m.nav_ships()}</span>
				</span>
			</div>

			<div class="relative px-5 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8 lg:min-h-[25rem] lg:py-12 lg:pl-[22rem] lg:pr-14">
				<div class="relative z-10 mx-auto w-[72vw] max-w-[15rem] rotate-[1.5deg] sm:w-[15rem] lg:absolute lg:bottom-6 lg:left-14 lg:rotate-[2.5deg]">
					<div class="overflow-hidden rounded-[1.75rem] bg-white p-2 shadow-[0_28px_65px_-24px_rgba(45,27,46,0.45)] ring-1 ring-plum/8">
						<Picture src={ship.imageUrl} type="posters" sizes="(max-width: 333px) 72vw, 240px" alt={ship.name} width={480} height={720} loading="eager" class="aspect-[2/3] w-full rounded-[1.3rem] object-cover" />
					</div>
					<div class="absolute -bottom-3 -left-3 grid h-14 w-14 -rotate-[8deg] place-items-center rounded-full bg-coral text-center text-white shadow-xl sm:h-16 sm:w-16 lg:-bottom-4 lg:-left-5 lg:h-20 lg:w-20">
						<span class="font-[family-name:var(--font-display)] text-lg font-black leading-none sm:text-xl lg:text-2xl">{ship.series.length}<small class="mt-1 block text-[7px] font-bold uppercase tracking-[0.2em] lg:text-[8px]">{m.artist_works_count_label()}</small></span>
					</div>
				</div>

				<div class="mt-6 min-w-0 text-center lg:mt-0 lg:text-left">
					<p class="mb-4 text-[10px] font-black uppercase tracking-[0.42em] text-coral-dark sm:text-xs">GL-ORBIT / SHIP FILE</p>
					<h1 class="flex flex-wrap justify-center gap-x-4 font-[family-name:var(--font-display)] text-[clamp(2rem,10vw,2.5rem)] font-black leading-[0.86] tracking-[-0.07em] text-plum sm:text-6xl lg:justify-start lg:text-7xl xl:text-8xl">
						{#each ship.name.split(' ') as w, i}{#if i > 0} {/if}<span>{w}</span>{/each}
					</h1>
					<p class="mt-5 font-[family-name:var(--font-thai)] text-xl font-semibold leading-snug text-plum-light/80 sm:text-2xl lg:text-3xl">
						<span class="block">{ship.artist1.name}</span>
						<span class="mt-1 block text-plum-light/65">{ship.artist2.name}</span>
					</p>
				</div>
			</div>
		</section>

		<!-- Command deck: share button and fact tiles share one horizontal surface. -->
		<div class="relative z-30 mx-3 mt-5 flex flex-col gap-3 overflow-visible rounded-[1.75rem] bg-white p-3 shadow-[0_28px_70px_-38px_rgba(45,27,46,0.65)] sm:mx-8 sm:p-5 lg:mx-14 lg:flex-row lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(14rem,auto)] lg:items-stretch lg:gap-3">
			<div class="grid grid-cols-3 gap-2 rounded-2xl bg-cream p-3 lg:grid-cols-[repeat(3,minmax(4.5rem,auto))_1fr] lg:items-center lg:gap-5">
				{#each primaryMeta as item}
					<div class="min-w-0 text-center lg:text-left">
						<div class="font-[family-name:var(--font-display)] text-xl font-black leading-none text-plum sm:text-2xl">{item.value}</div>
						<div class="mt-1 truncate text-[9px] font-black uppercase tracking-[0.16em] text-plum-light/55 sm:text-[10px]">{item.label}</div>
					</div>
				{/each}
				{#if ship.hashtags.length > 0}
					<div class="col-span-3 mt-1 flex flex-wrap justify-center gap-1.5 lg:col-span-1 lg:mt-0 lg:justify-start">
						{#each ship.hashtags as tag}
							<span class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-plum-light shadow-sm sm:text-xs">#{tag}</span>
						{/each}
					</div>
				{/if}
			</div>

			<div class="col-span-1 flex items-stretch justify-center min-[360px]:justify-end">
				<ShareButton title={shareTitle} text={shareText} url={canonicalUrl} ariaLabel={shareAriaLabel} variant="orbit" ordinal={null} orientation="row" className="w-full h-full" />
			</div>
		</div>

		{#if ship.description}
			<section class="mt-16 sm:mt-24 perf-section">
				<header class="mb-6 sm:mb-10">
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">00 / Manifest</p>
					<h2 class="mt-2 text-4xl font-black text-plum sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{currentLang === 'th' ? 'เรื่องราวคู่นี้' : 'Their story'}</h2>
				</header>
				<div class="rounded-[1.75rem] border border-white/80 bg-white/80 p-5 sm:rounded-[2.5rem] sm:p-10">
					<p class="font-[family-name:var(--font-thai)] text-base leading-8 text-plum-light sm:text-lg sm:leading-9">{ship.description}</p>
				</div>
			</section>
		{/if}

		<!-- Chapter 01: orbit pair inside a soft editorial interlude. -->
		<section class="mt-20 overflow-hidden rounded-[2rem] bg-lavender-light/70 p-4 text-plum min-[360px]:p-5 sm:mt-32 sm:rounded-[3rem] sm:p-10 lg:p-14 perf-section" aria-labelledby="artists-heading">
			<header class="mb-6 sm:mb-14">
				<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">01 / Orbit pair</p>
				<h2 id="artists-heading" class="mt-2 text-4xl font-black sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{currentLang === 'th' ? 'ศิลปินที่โคจรรอบกัน' : 'Orbiting artists'}</h2>
			</header>

			<div class="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1fr)] lg:items-center">
				<div class="pointer-events-none absolute left-1/2 top-1/2 hidden h-px w-[54%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-coral/40 via-lavender/50 to-mint/40 lg:block"></div>

				<a href={artistPath(ship.artist1.id)} class="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/78 p-4 shadow-sm shadow-lavender/10 transition-all duration-300 hover:-translate-y-1 hover:border-coral/30 hover:bg-white/92 focus-visible:outline-2 focus-visible:outline-coral sm:p-5">
					<div class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-coral/10 blur-2xl transition-opacity group-hover:opacity-80"></div>
					<div class="relative flex items-center gap-4">
						<Picture src={ship.artist1.imageUrl} type="profiles" sizes="112px" alt={ship.artist1.name} width={112} height={112} loading="lazy" class="h-20 w-20 flex-shrink-0 rounded-[1.35rem] border border-white/80 object-cover sm:h-24 sm:w-24" />
						<div class="min-w-0">
							<p class="text-[10px] font-bold uppercase tracking-[0.22em] text-coral-dark">{currentLang === 'th' ? 'แรงดึงดูด 1' : 'Artist one'}</p>
							<h3 class="truncate text-xl font-black text-plum sm:text-2xl">{ship.artist1.name}</h3>
							<p class="mt-1 text-sm font-medium text-plum-light">{ship.artist1.fullNameTh || ship.artist1.fullNameEn}</p>
						</div>
					</div>
				</a>

				<div class="relative mx-auto grid h-24 w-24 place-items-center rounded-full border border-white/80 bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(196,181,253,0.18))] shadow-xl shadow-lavender/15">
					<div class="absolute h-16 w-16 rounded-full border border-coral/20"></div>
					<div class="absolute h-10 w-10 rounded-full border border-mint/25"></div>
					<svg class="relative h-9 w-9 text-coral-dark drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08A6.01 6.01 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
					</svg>
				</div>

				<a href={artistPath(ship.artist2.id)} class="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/78 p-4 shadow-sm shadow-lavender/10 transition-all duration-300 hover:-translate-y-1 hover:border-lavender/30 hover:bg-white/92 focus-visible:outline-2 focus-visible:outline-coral sm:p-5">
					<div class="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-lavender/14 blur-2xl transition-opacity group-hover:opacity-80"></div>
					<div class="relative flex items-center gap-4 lg:flex-row-reverse lg:text-right">
						<Picture src={ship.artist2.imageUrl} type="profiles" sizes="112px" alt={ship.artist2.name} width={112} height={112} loading="lazy" class="h-20 w-20 flex-shrink-0 rounded-[1.35rem] border border-white/80 object-cover sm:h-24 sm:w-24" />
						<div class="min-w-0">
							<p class="text-[10px] font-bold uppercase tracking-[0.22em] text-lavender-dark">{currentLang === 'th' ? 'แรงดึงดูด 2' : 'Artist two'}</p>
							<h3 class="truncate text-xl font-black text-plum sm:text-2xl">{ship.artist2.name}</h3>
							<p class="mt-1 text-sm font-medium text-plum-light">{ship.artist2.fullNameTh || ship.artist2.fullNameEn}</p>
						</div>
					</div>
				</a>
			</div>
		</section>

		<!-- Chapter 02: shared reel grid — portrait cards on mobile, indexed wall on larger screens. -->
		{#if ship.series.length > 0}
			<section class="mt-24 sm:mt-32 perf-section" aria-labelledby="reel-heading">
				<header class="mb-6 flex flex-wrap items-end justify-between gap-5 sm:mb-14">
					<div>
						<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">02 / Shared reel</p>
						<h2 id="reel-heading" class="mt-2 text-5xl font-black text-plum sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{m.ships_shared_works()}</h2>
					</div>
					<div class="flex min-h-11 items-center rounded-full bg-mint px-3 text-center font-[family-name:var(--font-display)] text-xl font-black text-plum sm:grid sm:h-24 sm:w-24 sm:place-items-center sm:px-0 sm:text-4xl">
						<span>{ship.series.length}<small class="ml-1 text-[7px] font-black uppercase tracking-[0.2em] sm:ml-0 sm:block sm:text-[8px]">{m.artist_works_count_label()}</small></span>
					</div>
				</header>

				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-6 lg:gap-y-16">
					{#each ship.series as s, index (s.id)}
						{@const st = statusConfig[s.status] ?? null}
						<a href={seriesPath(s.id)} class="group relative block min-w-0 rounded-[1.25rem] border border-white/80 bg-white/70 p-2 shadow-[0_14px_34px_-28px_rgba(45,27,46,0.7)] transition hover:-translate-y-1 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:rounded-[1.75rem] sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:hover:bg-transparent {index % 2 === 1 ? 'sm:mt-8' : ''}">
							<span aria-hidden="true" class="absolute -left-1 -top-5 z-10 hidden font-[family-name:var(--font-display)] text-5xl font-black tracking-[-0.08em] text-coral sm:block">{String(index + 1).padStart(2, '0')}</span>
							<div class="overflow-hidden rounded-[1.25rem] bg-lavender/25 shadow-[0_24px_50px_-34px_rgba(45,27,46,0.65)] sm:rounded-[1.5rem]">
								<Picture src={s.posterUrl} type="posters" sizes="(max-width: 639px) 44vw, (max-width: 1024px) 24vw, 220px" alt={s.title} width={320} height={480} loading="lazy" class="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
							</div>
							<div class="relative px-1 pt-3 sm:px-1 sm:pt-4">
								{#if st}
									<span class="inline-flex items-center gap-1.5 rounded-full border bg-white px-2 py-0.5 text-[9px] font-black sm:text-[10px] {st.chip}">
										<span class="h-1.5 w-1.5 rounded-full {st.dot}"></span>
										<span>{st.text}</span>
									</span>
								{/if}
								<h3 class="mt-2 break-words font-[family-name:var(--font-display)] text-base font-black leading-[1.35] text-plum transition [overflow-wrap:anywhere] group-hover:text-coral-dark min-[360px]:text-lg sm:text-xl">{s.title}</h3>
								{#if s.titleTh}
									<p class="mt-1 break-words font-[family-name:var(--font-thai)] text-xs font-medium text-plum-light/70 [overflow-wrap:anywhere] sm:text-sm">{s.titleTh}</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</section>
		{:else}
			<section class="mt-24 sm:mt-32" aria-labelledby="reel-heading">
				<header class="mb-6 sm:mb-14">
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">02 / Shared reel</p>
					<h2 id="reel-heading" class="mt-2 text-5xl font-black text-plum sm:text-7xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.06em]'}">{m.ships_shared_works()}</h2>
				</header>
				<div class="rounded-[1.75rem] bg-white/80 p-8 text-center shadow-lg shadow-lavender/10 sm:rounded-[2.5rem] sm:p-12">
					<p class="font-[family-name:var(--font-display)] text-xl font-black text-plum sm:text-2xl">{m.ships_detail_empty_series()}</p>
					<a href={backHref} class="mt-5 inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white transition hover:bg-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral touch-target">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
						<span>{m.artist_detail_empty_back_home()}</span>
					</a>
				</div>
			</section>
		{/if}

		<!-- Orbit Halo: latest moments CTA. -->
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