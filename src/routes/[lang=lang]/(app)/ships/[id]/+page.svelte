<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';
	import LatestMomentsLink from '$lib/components/LatestMomentsLink.svelte';
	import { buildCanonicalUrl, jsonLdScript } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, data.seo.canonicalPath));
	const statusConfig: Record<string, { text: string; class: string; bg: string; border: string }> = {
		UPCOMING: { text: m.status_upcoming(), class: 'text-lavender-dark', bg: 'bg-lavender/10', border: 'border-lavender/25' },
		ONGOING: { text: m.status_ongoing(), class: 'text-mint-dark', bg: 'bg-mint/15', border: 'border-mint/25' },
		ENDED: { text: m.status_ended(), class: 'text-coral-dark', bg: 'bg-coral/10', border: 'border-coral/25' }
	};
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={canonicalUrl} />
	{@html jsonLdScript(data.seo.jsonLd)}
</svelte:head>

<article class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-cream pb-[calc(3rem+var(--bottom-nav-reserved-space))] text-plum md:mb-0 md:-mt-24 md:pb-20 md:pt-24">
	<div aria-hidden="true" class="pointer-events-none absolute -left-48 top-[34rem] h-[34rem] w-[34rem] rounded-full bg-lavender/20 blur-3xl"></div>
	<div aria-hidden="true" class="pointer-events-none absolute -right-48 top-[78rem] h-[38rem] w-[38rem] rounded-full bg-coral/15 blur-3xl"></div>

	<div class="relative mx-auto max-w-[90rem] px-4 pt-4 sm:px-6 sm:pt-6 md:px-8">
		<button onclick={() => history.back()} class="mb-5 inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-sm font-bold text-plum shadow-lg backdrop-blur-md transition hover:bg-coral hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral sm:mb-6 touch-target">
			<svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
			<span>{m.common_back()}</span>
		</button>

		<section class="relative z-10 mb-16 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_36px_90px_-44px_rgba(45,27,46,0.35)] sm:mb-24 sm:rounded-[2.5rem]">
			<div class="grid gap-0 lg:grid-cols-[minmax(0,1.04fr)_minmax(19rem,0.96fr)] lg:items-stretch">
			<div class="relative overflow-hidden p-5 sm:p-9 lg:p-12">
				<div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-[2rem] border-coral/10"></div>
				<div aria-hidden="true" class="pointer-events-none absolute bottom-8 right-12 h-24 w-24 rounded-full border border-lavender/30"></div>

				<div class="relative flex min-h-full flex-col justify-between gap-8">
					<div>
						<p class="mb-4 text-[10px] font-black uppercase tracking-[0.42em] text-coral-dark sm:text-xs">GL-ORBIT / SHIP FILE</p>
						<h1 class="max-w-4xl break-words font-[family-name:var(--font-display)] text-[clamp(2.75rem,8vw,7rem)] font-black leading-[0.86] tracking-[-0.07em] text-plum [overflow-wrap:anywhere]">
							{data.ship.name}
						</h1>
						<p class="mt-5 font-[family-name:var(--font-thai)] text-lg font-semibold text-plum-light/80 sm:text-2xl">{data.ship.artist1.name} × {data.ship.artist2.name}</p>
					</div>

					<div class="max-w-3xl rounded-[1.6rem] border border-white/80 bg-white/76 p-4 backdrop-blur-xl sm:p-5">
						<p class="font-[family-name:var(--font-thai)] text-sm leading-8 text-plum-light sm:text-base sm:leading-9">
							{data.ship.description || 'ยังไม่มีคำบรรยายสำหรับคู่นี้ แต่เรื่องราวยังคงถูกต่อเติมผ่านทุกผลงานที่เชื่อมโยงกัน'}
						</p>
					</div>

					{#if data.ship.hashtags.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each data.ship.hashtags as tag}
								<span class="rounded-full border border-lavender/25 bg-white/78 px-3 py-1.5 text-xs font-bold text-plum-light shadow-sm shadow-lavender/5 sm:text-sm">#{tag}</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="relative min-h-[31rem] overflow-hidden bg-coral/10 lg:min-h-[38rem]">
				<Picture src={data.ship.imageUrl} type="posters" sizes="(max-width: 1024px) 92vw, 520px" alt={data.ship.name} width={640} height={880} loading="eager" fetchpriority="high" class="h-full w-full object-cover" />
				<div class="absolute inset-0 bg-[radial-gradient(circle_at_28%_16%,rgba(255,255,255,0.24),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,107,157,0.20),transparent_34%),radial-gradient(circle_at_50%_78%,rgba(196,181,253,0.16),transparent_42%),linear-gradient(180deg,rgba(255,245,247,0.10),rgba(255,107,157,0.18)_58%,rgba(45,27,46,0.30))]"></div>
				<div class="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/24"></div>
				<div class="pointer-events-none absolute left-1/2 top-1/2 h-[50%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-coral/35"></div>
				<div class="pointer-events-none absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-mint/30"></div>

				<a href="/{page.data.lang}/artists/{data.ship.artist1.id}" class="group absolute left-4 top-5 flex max-w-[78%] items-center gap-3 rounded-full border border-white/45 bg-white/82 py-2 pl-2 pr-4 text-plum shadow-xl shadow-plum/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white sm:left-6 sm:top-7">
					<Picture src={data.ship.artist1.imageUrl} type="profiles" sizes="64px" alt={data.ship.artist1.name} width={64} height={64} loading="lazy" class="h-12 w-12 rounded-full border-2 border-white object-cover sm:h-14 sm:w-14" />
					<span class="min-w-0">
						<span class="block truncate text-sm font-black sm:text-base">{data.ship.artist1.name}</span>
						<span class="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-coral-dark">first orbit</span>
					</span>
				</a>

				<a href="/{page.data.lang}/artists/{data.ship.artist2.id}" class="group absolute bottom-5 right-4 flex max-w-[78%] items-center gap-3 rounded-full border border-white/45 bg-white/82 py-2 pl-2 pr-4 text-plum shadow-xl shadow-plum/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white sm:bottom-7 sm:right-6">
					<Picture src={data.ship.artist2.imageUrl} type="profiles" sizes="64px" alt={data.ship.artist2.name} width={64} height={64} loading="lazy" class="h-12 w-12 rounded-full border-2 border-white object-cover sm:h-14 sm:w-14" />
					<span class="min-w-0">
						<span class="block truncate text-sm font-black sm:text-base">{data.ship.artist2.name}</span>
						<span class="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-lavender-dark">second orbit</span>
					</span>
				</a>

			</div>
			</div>
		</section>

		<section class="relative z-10 mb-16 grid gap-6 sm:mb-24 lg:grid-cols-12 lg:gap-8" aria-labelledby="artists-heading">
			<header class="lg:col-span-4 lg:pt-8">
				<p class="font-[family-name:var(--font-display)] text-7xl font-black leading-none tracking-[-0.08em] text-coral/25 sm:text-9xl">01</p>
				<p class="mt-3 text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">Orbit pair</p>
				<h2 id="artists-heading" class="mt-2 font-[family-name:var(--font-thai)] text-4xl font-black leading-[1.25] tracking-[-0.03em] text-plum sm:text-6xl">ศิลปินที่โคจรรอบกัน</h2>
			</header>
			<div class="relative rounded-[2.25rem] bg-lavender-light/70 p-4 sm:rounded-[3rem] sm:p-7 lg:col-span-8 lg:p-8">
			<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p class="text-[10px] font-bold uppercase tracking-[0.28em] text-coral-dark">Chemistry map</p>
					<p class="font-[family-name:var(--font-thai)] text-base font-semibold text-plum-light sm:text-lg">สองแรงดึงดูด หนึ่งวงโคจร</p>
				</div>
				<span class="rounded-full border border-white/70 bg-white/72 px-3 py-1 text-xs font-semibold text-plum-light">2 artists</span>
			</div>

			<div class="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1fr)] lg:items-center">
				<div class="pointer-events-none absolute left-1/2 top-1/2 hidden h-px w-[54%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-coral/40 via-lavender/50 to-mint/40 lg:block"></div>
				<a href="/{page.data.lang}/artists/{data.ship.artist1.id}" class="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/78 p-4 shadow-sm shadow-lavender/10 transition-all duration-300 hover:-translate-y-1 hover:border-coral/30 hover:bg-white/92 focus-visible:outline-2 focus-visible:outline-coral sm:p-5">
					<div class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-coral/10 blur-2xl transition-opacity group-hover:opacity-80"></div>
					<div class="relative flex items-center gap-4">
						<Picture src={data.ship.artist1.imageUrl} type="profiles" sizes="112px" alt={data.ship.artist1.name} width={112} height={112} loading="lazy" class="h-20 w-20 flex-shrink-0 rounded-[1.35rem] border border-white/80 object-cover sm:h-24 sm:w-24" />
						<div class="min-w-0">
							<p class="text-[10px] font-bold uppercase tracking-[0.22em] text-coral-dark">Artist one</p>
							<h3 class="truncate text-xl font-black text-plum sm:text-2xl">{data.ship.artist1.name}</h3>
							<p class="mt-1 text-sm font-medium text-plum-light">{data.ship.artist1.fullNameTh || data.ship.artist1.fullNameEn}</p>
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

				<a href="/{page.data.lang}/artists/{data.ship.artist2.id}" class="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/78 p-4 shadow-sm shadow-lavender/10 transition-all duration-300 hover:-translate-y-1 hover:border-lavender/30 hover:bg-white/92 focus-visible:outline-2 focus-visible:outline-coral sm:p-5">
					<div class="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-lavender/14 blur-2xl transition-opacity group-hover:opacity-80"></div>
					<div class="relative flex items-center gap-4 lg:flex-row-reverse lg:text-right">
						<Picture src={data.ship.artist2.imageUrl} type="profiles" sizes="112px" alt={data.ship.artist2.name} width={112} height={112} loading="lazy" class="h-20 w-20 flex-shrink-0 rounded-[1.35rem] border border-white/80 object-cover sm:h-24 sm:w-24" />
						<div class="min-w-0">
							<p class="text-[10px] font-bold uppercase tracking-[0.22em] text-lavender-dark">Artist two</p>
							<h3 class="truncate text-xl font-black text-plum sm:text-2xl">{data.ship.artist2.name}</h3>
							<p class="mt-1 text-sm font-medium text-plum-light">{data.ship.artist2.fullNameTh || data.ship.artist2.fullNameEn}</p>
						</div>
					</div>
				</a>
			</div>
			</div>
		</section>

		<section class="relative z-10">
			<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
				<div>
					<p class="text-[10px] font-black uppercase tracking-[0.38em] text-coral-dark">02 / Shared reel</p>
					<h2 class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-plum sm:text-4xl">ผลงานร่วมกัน</h2>
				</div>
				<span class="rounded-full border border-white/60 bg-white/62 px-3 py-1 text-xs font-semibold text-plum-light">{data.ship.series.length} เรื่อง</span>
			</div>

			{#if data.ship.series.length > 0}
				<div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
					{#each data.ship.series as item}
						{@const status = statusConfig[item.status]}
						<a href="/{page.data.lang}/series/{item.id}" class="group block overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 shadow-lg shadow-lavender/10 transition-all duration-300 hover:-translate-y-1 hover:border-coral/30 hover:bg-white/92 hover:shadow-2xl hover:shadow-coral/10 focus-visible:outline-2 focus-visible:outline-coral">
							<div class="relative overflow-hidden bg-lavender/10">
								<Picture src={item.posterUrl} type="posters" sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, 24vw" alt={item.title} width={360} height={540} loading="lazy" class="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
								<div class="absolute left-3 top-3">
									<span class="rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md {status.border} {status.bg} {status.class}">{status.text}</span>
								</div>
								<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum/88 via-plum/42 to-transparent px-4 pb-4 pt-20 text-white">
									<p class="mb-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/70">Orbit work</p>
									<h3 class="text-lg font-black leading-tight drop-shadow-sm">{item.title}</h3>
									{#if item.titleTh}
										<p class="mt-1 line-clamp-1 text-xs font-semibold text-white/78">{item.titleTh}</p>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="rounded-[1.75rem] border border-white/80 bg-white/80 p-8 text-center text-plum-light shadow-lg shadow-lavender/10 sm:p-10">ยังไม่มีผลงานร่วมกันในระบบ</div>
			{/if}
		</section>
		<LatestMomentsLink lang={page.data.lang} entity="ship" entityId={data.ship.id} />
	</div>
</article>
