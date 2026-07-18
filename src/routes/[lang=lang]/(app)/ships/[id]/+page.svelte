<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { m } from '$lib/i18n/paraglide.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import { buildBreadcrumbJsonLd, buildCanonicalUrl, jsonLdScript, localizedPath, safeJsonLd } from '$lib/seo.js';
	import { latestMomentsHref } from '$lib/moments/latest-moments.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const ship = $derived(data.ship);
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const statusConfig: Record<string, { text: string; dot: string; color: string }> = {
		ONGOING: { text: m.status_ongoing(), dot: 'bg-mint', color: 'text-mint-dark' },
		UPCOMING: { text: m.status_upcoming(), dot: 'bg-lavender', color: 'text-lavender-dark' },
		ENDED: { text: m.status_ended(), dot: 'bg-coral', color: 'text-coral-dark' }
	};
	const seoTitle = $derived(`${ship.name} | ${m.nav_ships()} GL-Orbit`);
	const canonicalPath = $derived(`/ships/${ship.slug}`);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const shareTitle = $derived(currentLang === 'th' ? `ฝากรู้จัก 「${ship.name}」 บน GL-Orbit 💕` : `Meet 「${ship.name}」 on GL-Orbit 💕`);
	const shareText = $derived(currentLang === 'th' ? `มาทำคาวรู้จักคู่จิ้น「${ship.name}」บน GL-Orbit` : `Meet ship 「${ship.name}」 on GL-Orbit`);
	const shareAriaLabel = $derived(currentLang === 'th' ? 'แชร์คู่จิ้นนี้' : 'Share this ship');
	const primaryMeta = $derived([
		{ label: m.ships_shared_works(), value: ship.series.length },
		{ label: m.common_people(), value: 2 },
		{ label: currentLang === 'th' ? 'แฮชแท็ก' : 'Hashtags', value: ship.hashtags.length }
	]);
	const momentsHref = $derived(latestMomentsHref(page.data.lang, 'ship', ship.id));
	const artistPath = (id: string) => localizedPath(currentLang, `/artists/${id}`);
	const seriesPath = (id: string) => localizedPath(currentLang, `/series/${id}`);
	const backHref = $derived(localizedPath(currentLang, '/ships'));
	const goBack = () => {
		if (typeof history !== 'undefined' && history.length > 1) history.back();
		else goto(localizedPath(currentLang, '/ships'));
	};
	const jsonLd = $derived(safeJsonLd([
		{ '@context': 'https://schema.org', '@type': 'ProfilePage', name: ship.name, description: ship.description, image: ship.imageUrl, url: canonicalUrl, about: [{ '@type': 'Person', name: ship.artist1.name }, { '@type': 'Person', name: ship.artist2.name }] },
		buildBreadcrumbJsonLd(page.url.origin, [{ name: m.nav_home(), path: localizedPath(currentLang, '') }, { name: m.nav_ships(), path: localizedPath(currentLang, '/ships') }, { name: ship.name, path: localizedPath(currentLang, canonicalPath) }])
	]));
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

<div class="-mx-4 -mb-[var(--bottom-nav-reserved-space)] bg-[var(--orbit-paper)] pb-[calc(3rem+var(--bottom-nav-reserved-space))] md:-mt-24 md:mb-0 md:pb-20 md:pt-24">
	<main class="mx-auto max-w-[90rem] px-4 pt-4 sm:px-6 sm:pt-6 md:px-8">
		<section class="bg-plum text-white sm:rounded-xl" aria-labelledby="ship-title">
			<header class="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-4 sm:px-7">
				<button type="button" onclick={goBack} class="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/20 bg-white/5 px-4 text-sm font-bold text-white transition hover:border-mint hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>{m.common_back()}</button>
				<p class="text-[10px] font-black uppercase tracking-[0.3em] text-coral-light sm:text-xs">GL-ORBIT / {m.nav_ships()}</p>
			</header>
			<div class="grid lg:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
				<figure class="relative min-h-[25rem] overflow-hidden bg-plum-dark sm:min-h-[32rem] lg:min-h-[39rem] lg:rounded-bl-xl">
					{#if ship.hasImage}
						<Picture src={ship.imageUrl} type="posters" sizes="(max-width: 1023px) 100vw, 42vw" alt={ship.name} width={720} height={1080} loading="eager" class="absolute inset-0 h-full w-full object-cover" />
					{:else}
						<div class="absolute inset-0 grid grid-cols-2 gap-px bg-white/20"><Picture src={ship.artist1.imageUrl} type="profiles" sizes="(max-width: 1023px) 50vw, 21vw" alt={ship.artist1.name} width={480} height={600} loading="eager" class="h-full w-full object-cover object-top" /><Picture src={ship.artist2.imageUrl} type="profiles" sizes="(max-width: 1023px) 50vw, 21vw" alt={ship.artist2.name} width={480} height={600} loading="eager" class="h-full w-full object-cover object-top" /></div>
					{/if}
					<div aria-hidden="true" class="absolute inset-0 bg-gradient-to-t from-plum/85 via-plum/5 to-transparent"></div>
					<figcaption class="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-8 sm:bottom-8"><span class="text-[10px] font-black uppercase tracking-[0.32em] text-white/75">Pair portrait</span><span class="font-[family-name:var(--font-display)] text-4xl font-bold leading-none text-coral-light sm:text-6xl">{String(ship.series.length).padStart(2, '0')}</span></figcaption>
				</figure>
				<div class="flex min-w-0 flex-col px-5 py-9 sm:px-10 sm:py-12 lg:justify-between lg:px-14 lg:py-16">
					<div><p class="text-[10px] font-black uppercase tracking-[0.38em] text-mint sm:text-xs">Pairing record</p><h1 id="ship-title" class="mt-5 break-words font-[family-name:var(--font-display)] text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.82] tracking-[-0.075em] text-white [overflow-wrap:anywhere]">{ship.name}</h1><div class="mt-8 grid grid-cols-[1fr_auto_1fr] items-start gap-3 border-y border-white/15 py-5 font-[family-name:var(--font-thai)] text-base font-semibold leading-snug sm:text-xl"><span class="min-w-0 break-words text-coral-light [overflow-wrap:anywhere]">{ship.artist1.name}</span><span aria-hidden="true" class="grid h-6 w-6 place-items-center text-mint"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.51L12 21.35Z"/></svg></span><span class="min-w-0 break-words text-right text-lavender-light [overflow-wrap:anywhere]">{ship.artist2.name}</span></div></div>
					<div class="mt-10 grid grid-cols-2 border-l border-t border-white/15 sm:grid-cols-4">
						{#each primaryMeta as item}<div class="min-w-0 border-b border-r border-white/15 px-3 py-4 sm:px-4"><p class="font-[family-name:var(--font-display)] text-2xl font-bold leading-none text-white sm:text-3xl">{item.value}</p><p class="mt-2 truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/60 sm:text-[10px]">{item.label}</p></div>{/each}
						<ShareButton title={shareTitle} text={shareText} url={canonicalUrl} ariaLabel={shareAriaLabel} variant="orbit" ordinal={null} className="min-h-[5.5rem] !rounded-none border-b border-r border-white/15" />
					</div>
				</div>
			</div>
		</section>

		<section class="grid border-b border-[var(--orbit-line-strong)] py-8 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8 sm:py-10" aria-label="Ship facts"><p class="text-[10px] font-black uppercase tracking-[0.32em] text-coral-dark">Ship notes</p><div>{#if ship.hashtags.length > 0}<div class="flex flex-wrap gap-x-4 gap-y-2">{#each ship.hashtags as tag}<span class="text-sm font-bold text-plum sm:text-base">#{tag}</span>{/each}</div>{/if}<p class="mt-3 text-sm leading-6 text-plum-light">{ship.artist1.fullNameTh || ship.artist1.fullNameEn} และ {ship.artist2.fullNameTh || ship.artist2.fullNameEn}</p></div></section>

		{#if ship.description}<section class="grid border-b border-[var(--orbit-line-strong)] py-12 sm:grid-cols-[10rem_minmax(0,42rem)] sm:gap-8 sm:py-16"><div><p class="text-[10px] font-black uppercase tracking-[0.32em] text-coral-dark">00 / Story</p><h2 class="mt-3 text-2xl font-bold text-plum sm:text-3xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.05em]'}">{currentLang === 'th' ? 'เรื่องราวคู่นี้' : 'Their story'}</h2></div><p class="mt-5 font-[family-name:var(--font-thai)] text-base leading-8 text-plum-light sm:mt-0 sm:text-lg sm:leading-9">{ship.description}</p></section>{/if}

		<section class="border-b border-[var(--orbit-line-strong)] py-12 sm:py-16" aria-labelledby="artists-heading">
			<header class="grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"><p class="text-[10px] font-black uppercase tracking-[0.32em] text-coral-dark">01 / Pair</p><h2 id="artists-heading" class="mt-3 text-3xl font-bold text-plum sm:mt-0 sm:text-5xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.05em]'}">{currentLang === 'th' ? 'ศิลปินที่โคจรรอบกัน' : 'Orbiting artists'}</h2></header>
			<div class="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] sm:items-stretch">
				<a href={artistPath(ship.artist1.id)} class="group grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] gap-4 border border-[var(--orbit-line-strong)] p-3 transition hover:border-coral hover:bg-coral/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:p-4"><Picture src={ship.artist1.imageUrl} type="profiles" sizes="120px" alt={ship.artist1.name} width={160} height={200} loading="lazy" class="aspect-[4/5] h-full w-full object-cover object-top" /><span class="flex min-w-0 flex-col justify-between py-1"><span class="text-[9px] font-black uppercase tracking-[0.22em] text-coral-dark">Artist 01</span><span><span class="block break-words font-[family-name:var(--font-display)] text-xl font-bold leading-none text-plum [overflow-wrap:anywhere] sm:text-2xl">{ship.artist1.name}</span><span class="mt-2 block text-sm text-plum-light">{ship.artist1.fullNameTh || ship.artist1.fullNameEn}</span></span></span></a>
				<div aria-hidden="true" class="grid place-items-center py-1 sm:py-0"><span class="grid h-11 w-11 place-items-center text-coral-dark"><svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.51L12 21.35Z"/></svg></span></div>
				<a href={artistPath(ship.artist2.id)} class="group grid min-w-0 grid-cols-[minmax(0,1fr)_5rem] gap-4 border border-[var(--orbit-line-strong)] p-3 transition hover:border-lavender hover:bg-lavender/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:grid-cols-[minmax(0,1fr)_7.5rem] sm:p-4"><span class="flex min-w-0 flex-col justify-between py-1 text-right"><span class="text-[9px] font-black uppercase tracking-[0.22em] text-lavender-dark">Artist 02</span><span><span class="block break-words font-[family-name:var(--font-display)] text-xl font-bold leading-none text-plum [overflow-wrap:anywhere] sm:text-2xl">{ship.artist2.name}</span><span class="mt-2 block text-sm text-plum-light">{ship.artist2.fullNameTh || ship.artist2.fullNameEn}</span></span></span><Picture src={ship.artist2.imageUrl} type="profiles" sizes="120px" alt={ship.artist2.name} width={160} height={200} loading="lazy" class="aspect-[4/5] h-full w-full object-cover object-top" /></a>
			</div>
		</section>

		{#if ship.series.length > 0}
			<section class="py-12 sm:py-16" aria-labelledby="reel-heading"><header class="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--orbit-line-strong)] pb-7 sm:pb-10"><div><p class="text-[10px] font-black uppercase tracking-[0.32em] text-coral-dark">02 / Shared reel</p><h2 id="reel-heading" class="mt-3 text-3xl font-bold text-plum sm:text-5xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.05em]'}">{m.ships_shared_works()}</h2></div><p class="font-[family-name:var(--font-display)] text-4xl font-bold leading-none text-plum sm:text-6xl">{String(ship.series.length).padStart(2, '0')}</p></header>
				<div class="grid grid-cols-2 gap-x-4 gap-y-8 pt-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 sm:pt-10 md:grid-cols-4 lg:grid-cols-6">
					{#each ship.series as s, index (s.id)}
						{@const st = statusConfig[s.status] ?? null}
						<a href={seriesPath(s.id)} class="group min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"><div class="relative overflow-hidden bg-lavender/20"><span class="absolute left-0 top-0 z-10 bg-plum px-2 py-1 font-[family-name:var(--font-display)] text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</span><Picture src={s.posterUrl} type="posters" sizes="(max-width: 639px) 44vw, (max-width: 1024px) 24vw, 220px" alt={s.title} width={320} height={480} loading="lazy" class="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" /></div>{#if st}<p class="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] {st.color}"><span class="h-1.5 w-1.5 rounded-full {st.dot}"></span>{st.text}</p>{/if}<h3 class="mt-2 break-words font-[family-name:var(--font-display)] text-base font-bold leading-[1.2] text-plum transition group-hover:text-coral-dark [overflow-wrap:anywhere] sm:text-lg">{s.title}</h3>{#if s.titleTh}<p class="mt-1 break-words font-[family-name:var(--font-thai)] text-xs leading-5 text-plum-light [overflow-wrap:anywhere]">{s.titleTh}</p>{/if}</a>
					{/each}
				</div>
			</section>
		{:else}
			<section class="py-12 sm:py-16" aria-labelledby="reel-heading"><p class="text-[10px] font-black uppercase tracking-[0.32em] text-coral-dark">02 / Shared reel</p><h2 id="reel-heading" class="mt-3 text-3xl font-bold text-plum sm:text-5xl {currentLang === 'th' ? 'font-[family-name:var(--font-thai)] leading-[1.25] tracking-[-0.03em]' : 'font-[family-name:var(--font-display)] leading-none tracking-[-0.05em]'}">{m.ships_shared_works()}</h2><div class="mt-8 border border-[var(--orbit-line-strong)] bg-white p-8 sm:mt-10 sm:p-12"><p class="font-[family-name:var(--font-display)] text-xl font-bold text-plum sm:text-2xl">{m.ships_detail_empty_series()}</p><a href={backHref} class="mt-5 inline-flex min-h-11 items-center gap-2 bg-plum px-5 text-sm font-bold text-white transition hover:bg-[#24151f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>{m.artist_detail_empty_back_home()}</a></div></section>
		{/if}

		<section class="flex flex-wrap items-end justify-between gap-6 bg-plum px-6 py-8 text-white sm:px-10 sm:py-10"><div><p class="text-[10px] font-black uppercase tracking-[0.32em] text-mint">Orbit Halo</p><h2 class="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold leading-none tracking-[-0.05em] sm:text-5xl">Latest Moments</h2></div><a href={momentsHref} class="inline-flex min-h-11 items-center gap-3 bg-mint px-5 text-sm font-bold text-plum transition hover:bg-mint-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><span>{currentLang === 'th' ? 'ดู Moment ทั้งหมด' : 'View all moments'}</span><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-6-6 6 6-6 6" /></svg></a></section>
	</main>
</div>
