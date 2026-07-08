<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';
	import { buildCanonicalUrl, jsonLdScript } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, data.seo.canonicalPath));
	const startedYear = $derived(
		data.ship.startedAt ? new Date(data.ship.startedAt).getFullYear() : null
	);
	const shipMeta = $derived([
		{ label: 'ผลงานร่วมกัน', value: data.ship.series.length || '—' },
		{ label: 'สถานะ', value: data.ship.isFeatured ? 'Featured' : 'Ship' },
		{ label: 'เริ่มโคจร', value: startedYear ?? '—' }
	]);
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

<article class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden pb-[calc(2rem+var(--bottom-nav-reserved-space))] text-plum md:mb-0 md:-mt-24 md:pb-12 md:pt-24">
	<div class="relative mx-auto max-w-7xl px-4 pt-5 sm:pt-8 md:px-6">
		<button onclick={() => history.back()} class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3.5 py-2 text-sm font-semibold text-plum-light hover:border-coral/40 hover:bg-white/90 hover:text-coral-dark sm:mb-8 sm:text-base touch-target">
			<svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
			<span>{m.common_back()}</span>
		</button>

		<section class="relative z-10 grid gap-6 pb-10 md:grid-cols-[minmax(18rem,0.84fr)_minmax(0,1.35fr)] md:items-stretch md:gap-10 lg:gap-14">
			<div class="relative mx-auto w-full max-w-[21rem] md:max-w-none">
				<div class="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 md:rounded-[2.25rem] perf-card">
					<Picture src={data.ship.imageUrl} type="posters" sizes="(max-width: 768px) 84vw, 430px" alt={data.ship.name} width={480} height={720} loading="eager" fetchpriority="high" class="aspect-[2/3] w-full object-cover" />
				</div>
			</div>

			<div class="relative min-w-0 pb-1 md:overflow-hidden">
				<div class="md:absolute md:inset-0 md:flex md:flex-col md:overflow-hidden">
					<div class="flex-shrink-0">
						<div class="mb-4 flex flex-wrap items-center gap-2">
							<span class="rounded-full border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral-dark sm:text-sm">Ship</span>
							{#if data.ship.isFeatured}
								<span class="rounded-full border border-mint/25 bg-mint/15 px-3 py-1.5 text-xs font-bold text-mint-dark sm:text-sm">Featured</span>
							{/if}
							<span class="rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-xs font-semibold text-plum-light sm:text-sm">{data.ship.artist1.name} × {data.ship.artist2.name}</span>
						</div>

						<h1 class="max-w-full break-words font-[family-name:var(--font-display)] text-[clamp(1.9rem,3.6vw,3.65rem)] font-extrabold leading-[1.16] tracking-[-0.025em] text-plum [overflow-wrap:anywhere]">
							{data.ship.name}
						</h1>
					</div>

					<div class="mt-6 max-w-4xl rounded-[1.5rem] border border-white/80 bg-white/82 p-4 sm:p-5 md:rounded-[1.7rem] md:flex-1 md:min-h-0 md:flex md:flex-col md:overflow-hidden">
						<p class="font-[family-name:var(--font-thai)] text-sm leading-8 text-plum-light sm:text-base sm:leading-9 md:overflow-y-auto">
							{data.ship.description || 'ยังไม่มีคำบรรยายสำหรับคู่นี้ แต่เรื่องราวยังคงถูกต่อเติมผ่านทุกผลงานที่เชื่อมโยงกัน'}
						</p>
					</div>

					<div class="mt-6 grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3 md:flex-shrink-0">
						{#each shipMeta as item}
							<div class="rounded-2xl border border-white/80 bg-white/78 p-3 text-center perf-card">
								<div class="text-2xl font-black text-coral-dark sm:text-3xl">{item.value}</div>
								<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-plum-light/65 sm:text-xs">{item.label}</div>
							</div>
						{/each}
					</div>

					{#if data.ship.hashtags.length > 0}
						<div class="mt-5 flex flex-wrap gap-2 md:flex-shrink-0">
							{#each data.ship.hashtags as tag}
								<span class="rounded-full border border-lavender/25 bg-white/75 px-3 py-1.5 text-xs font-semibold text-plum-light sm:text-sm">#{tag}</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</section>

		<section class="relative z-10 mb-10 sm:mb-12 perf-section">
			<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
				<div>
					<p class="text-[10px] font-bold uppercase tracking-[0.28em] text-coral-light/70">Orbit pair</p>
					<h2 class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-plum sm:text-4xl">ศิลปินที่โคจรรอบกัน</h2>
				</div>
				<span class="hidden rounded-full border border-white/50 bg-white/50 px-3 py-1 text-xs font-semibold text-plum-light sm:inline-flex">2 artists</span>
			</div>

			<div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
				<a href="/{page.data.lang}/artists/{data.ship.artist1.id}" class="relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/78 p-3 hover:border-coral/30 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-coral sm:p-4 perf-card">
					<div class="relative flex items-center gap-3 sm:gap-4">
						<Picture src={data.ship.artist1.imageUrl} type="profiles" sizes="96px" alt={data.ship.artist1.name} width={80} height={80} loading="lazy" class="h-16 w-16 flex-shrink-0 rounded-2xl border border-white/70 object-cover sm:h-20 sm:w-20" />
						<div class="min-w-0">
							<div class="truncate text-lg font-extrabold text-plum sm:text-xl">{data.ship.artist1.name}</div>
							<div class="mt-1 text-sm font-medium text-plum-light">{data.ship.artist1.fullNameTh || data.ship.artist1.fullNameEn}</div>
							<div class="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-coral-dark">Artist one</div>
						</div>
					</div>
				</a>

				<div class="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/80 bg-white/82 text-coral-dark shadow-sm shadow-lavender/10 md:h-16 md:w-16">
					<span class="font-[family-name:var(--font-display)] text-2xl font-black">×</span>
				</div>

				<a href="/{page.data.lang}/artists/{data.ship.artist2.id}" class="relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/78 p-3 hover:border-lavender/30 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-coral sm:p-4 perf-card">
					<div class="relative flex items-center gap-3 sm:gap-4 md:flex-row-reverse md:text-right">
						<Picture src={data.ship.artist2.imageUrl} type="profiles" sizes="96px" alt={data.ship.artist2.name} width={80} height={80} loading="lazy" class="h-16 w-16 flex-shrink-0 rounded-2xl border border-white/70 object-cover sm:h-20 sm:w-20" />
						<div class="min-w-0">
							<div class="truncate text-lg font-extrabold text-plum sm:text-xl">{data.ship.artist2.name}</div>
							<div class="mt-1 text-sm font-medium text-plum-light">{data.ship.artist2.fullNameTh || data.ship.artist2.fullNameEn}</div>
							<div class="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-lavender-dark">Artist two</div>
						</div>
					</div>
				</a>
			</div>
		</section>

		<section class="relative z-10 perf-section">
			<div class="mb-4 flex items-end justify-between gap-4 sm:mb-6">
				<div>
					<p class="text-[10px] font-bold uppercase tracking-[0.28em] text-lavender-dark/75">Series link</p>
					<h2 class="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-plum sm:text-4xl">ผลงานร่วมกัน</h2>
				</div>
				<span class="rounded-full border border-white/50 bg-white/50 px-3 py-1 text-xs font-semibold text-plum-light">{data.ship.series.length} เรื่อง</span>
			</div>

			{#if data.ship.series.length > 0}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.ship.series as item}
						{@const status = statusConfig[item.status]}
						<a href="/{page.data.lang}/series/{item.id}" class="group relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/78 p-3 hover:border-coral/30 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-coral sm:p-4 perf-card">
							<div class="grid gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center">
								<Picture src={item.posterUrl} type="posters" sizes="160px" alt={item.title} width={120} height={180} loading="lazy" class="aspect-[2/3] w-full rounded-2xl border border-white/70 object-cover sm:w-22" />
								<div class="min-w-0">
									<div class="mb-2 flex flex-wrap gap-2">
										<span class="rounded-full border px-2.5 py-1 text-[10px] font-bold {status.border} {status.bg} {status.class}">{status.text}</span>
									</div>
									<h3 class="truncate text-base font-extrabold text-plum sm:text-lg">{item.title}</h3>
									{#if item.titleTh}
										<p class="mt-1 truncate text-sm font-medium text-plum-light">{item.titleTh}</p>
									{/if}
									<p class="mt-2 text-xs font-semibold text-coral-dark">เปิดหน้าซีรีส์</p>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="rounded-[1.75rem] border border-white/80 bg-white/80 p-8 text-center text-plum-light perf-card sm:p-10">ยังไม่มีผลงานร่วมกันในระบบ</div>
			{/if}
		</section>
	</div>
</article>
