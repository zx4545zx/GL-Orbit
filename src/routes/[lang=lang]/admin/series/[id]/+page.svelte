<script lang="ts">

	import { page } from '$app/state';
	import { localizedHref } from '$lib/i18n/link.js';	import { invalidateAll, goto } from '$app/navigation';
	import SeriesMainSection from '$lib/components/admin/SeriesMainSection.svelte';
	import SeriesCastSection from '$lib/components/admin/SeriesCastSection.svelte';
	import SeriesEpisodesSection from '$lib/components/admin/SeriesEpisodesSection.svelte';
	import SeriesScheduleSection from '$lib/components/admin/SeriesScheduleSection.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	type TabId = 'main' | 'cast' | 'episodes' | 'schedule';
	let activeTab = $state<TabId>('main');

	const tabs: { id: TabId; label: string; subtitle: string; icon: string }[] = [
		{ id: 'main', label: 'ข้อมูลหลัก', subtitle: 'Poster, titles, studio', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ id: 'cast', label: 'นักแสดง', subtitle: 'Cast & role names', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
		{ id: 'episodes', label: 'ตอน', subtitle: 'Episodes & streaming links', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ id: 'schedule', label: 'ตารางฉาย', subtitle: 'Weekly broadcast rules', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
	];

	function tabCount(id: TabId) {
		if (id === 'cast') return data.full.artists.length;
		if (id === 'episodes') return data.full.episodes.length;
		if (id === 'schedule') return data.full.schedules.length;
		return null;
	}
	const heroPoster = $derived(data.full.series.posterUrl);
	const studioName = $derived(data.full.studio?.name ?? 'ยังไม่ระบุสตูดิโอ');
	const readinessScore = $derived([
		Boolean(data.full.series.posterUrl),
		data.full.artists.length > 0,
		data.full.episodes.length > 0,
		data.full.schedules.length > 0
	].filter(Boolean).length);
	const readinessPercent = $derived(Math.round((readinessScore / 4) * 100));

	const statCards = $derived([
		{ label: 'ประเภท', value: data.full.genres.length, hint: data.full.genres.length ? data.full.genres.map((g) => g.name).join(', ') : 'ยังไม่มี', tone: 'coral' },
		{ label: 'นักแสดง', value: data.full.artists.length, hint: 'cast linked', tone: 'lavender' },
		{ label: 'ตอน', value: data.full.episodes.length, hint: 'episode records', tone: 'mint' },
		{ label: 'ตาราง', value: data.full.schedules.length, hint: 'weekly slots', tone: 'plum' }
	]);

	async function refresh() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Series Studio · {data.full.series.titleEn} | GL-Orbit</title>
</svelte:head>

<div class="relative py-4 sm:py-6">
	<!-- ambient background -->
	<div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2.5rem] opacity-80">
		<div class="absolute -top-16 left-6 h-48 w-48 rounded-full bg-coral/18 blur-3xl"></div>
		<div class="absolute top-12 right-10 h-56 w-56 rounded-full bg-lavender/20 blur-3xl"></div>
		<div class="absolute bottom-0 left-1/2 h-36 w-72 -translate-x-1/2 rounded-full bg-mint/15 blur-3xl"></div>
	</div>

	<!-- Studio hero -->
	<section class="relative mb-5 overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-2xl shadow-lavender/10 backdrop-blur-xl sm:p-5 lg:p-6">
		<div class="absolute inset-0 opacity-[0.55] [background:radial-gradient(circle_at_18%_12%,rgba(255,107,157,.22),transparent_28%),radial-gradient(circle_at_92%_20%,rgba(196,181,253,.28),transparent_30%),linear-gradient(135deg,rgba(255,255,255,.72),rgba(255,245,247,.45))]"></div>
		<div class="absolute -right-20 -top-28 h-56 w-56 rounded-full border border-coral/20"></div>
		<div class="absolute -bottom-24 left-1/2 h-44 w-44 rounded-full border border-lavender/25"></div>

		<div class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div class="flex gap-4">
				<button onclick={() => goto(localizedHref('/admin/series', page.data.lang))} class="mt-1 hidden h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-plum shadow-sm ring-1 ring-lavender/20 transition hover:-translate-x-0.5 hover:bg-white sm:flex" aria-label="กลับ">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
				</button>

				<div class="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-lavender/10 shadow-xl shadow-plum/10 ring-1 ring-white/80 sm:h-40 sm:w-28">
					{#if heroPoster}
						<img src={heroPoster} alt={data.full.series.titleEn} width={480} height={720} loading="lazy" decoding="async" class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center text-lavender-dark/50">
							<svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
						</div>
					{/if}
					<div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-plum/45 to-transparent"></div>
				</div>

				<div class="min-w-0 pt-1 sm:pt-2">
					<button onclick={() => goto(localizedHref('/admin/series', page.data.lang))} class="mb-2 inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-1 text-xs font-medium text-plum-light ring-1 ring-lavender/20 sm:hidden">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
						กลับรายการ
					</button>
					<div class="mb-2 flex flex-wrap items-center gap-2">
						<span class="rounded-full bg-plum px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white shadow-lg shadow-plum/15">Series Studio</span>
						<StatusBadge status={data.full.series.status} />
					</div>
					<h1 class="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-plum sm:text-4xl lg:text-5xl">{data.full.series.titleEn}</h1>
					{#if data.full.series.titleTh}
						<p class="mt-1 text-sm text-plum-light sm:text-base">{data.full.series.titleTh}</p>
					{/if}
					<p class="mt-3 max-w-2xl text-xs leading-relaxed text-plum-light sm:text-sm">
						จัดการข้อมูลซีรีส์แบบครบวงจรในหน้าเดียว · {studioName}
					</p>
				</div>
			</div>

			<div class="w-full rounded-2xl bg-white/65 p-3 ring-1 ring-white/70 lg:w-72">
				<div class="flex items-center justify-between text-xs font-semibold text-plum">
					<span>Studio readiness</span>
					<span>{readinessPercent}%</span>
				</div>
				<div class="mt-2 h-2 overflow-hidden rounded-full bg-lavender/15">
					<div class="h-full rounded-full bg-gradient-to-r from-coral via-lavender to-mint transition-all duration-500" style={`width: ${readinessPercent}%`}></div>
				</div>
				<p class="mt-2 text-[11px] text-plum-light">ครบ {readinessScore}/4 ส่วนหลัก: poster, cast, episodes, schedule</p>
			</div>
		</div>
	</section>

	<!-- Snapshot metrics -->
	<div class="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
		{#each statCards as stat}
			<div class="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm shadow-lavender/5 backdrop-blur-xl">
				<div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-plum-light">{stat.label}</div>
				<div class="mt-1 flex items-end justify-between gap-2">
					<div class="text-2xl font-bold text-plum">{stat.value}</div>
					<div class="h-2 w-2 rounded-full {stat.tone === 'coral' ? 'bg-coral' : stat.tone === 'mint' ? 'bg-mint' : stat.tone === 'lavender' ? 'bg-lavender' : 'bg-plum'}"></div>
				</div>
				<div class="mt-1 truncate text-[11px] text-plum-light">{stat.hint}</div>
			</div>
		{/each}
	</div>

	<!-- Studio workspace -->
	<div class="flex flex-col gap-4 lg:flex-row lg:gap-6">
		<nav class="lg:w-56 xl:w-60 flex-shrink-0">
			<div class="grid grid-cols-2 gap-2 lg:sticky lg:top-6 lg:flex lg:flex-col">
				{#each tabs as tab (tab.id)}
					{@const active = activeTab === tab.id}
					{@const count = tabCount(tab.id)}
					<button
						type="button"
						onclick={() => (activeTab = tab.id)}
						class="group relative overflow-hidden rounded-2xl border p-3 text-left transition-all {active
							? 'border-coral/20 bg-white text-plum shadow-xl shadow-coral/10'
							: 'border-white/60 bg-white/55 text-plum-light hover:border-lavender/40 hover:bg-white/80 hover:text-plum'}"
					>
						{#if active}<div class="absolute inset-y-3 left-0 w-1 rounded-r-full bg-coral"></div>{/if}
						<div class="flex items-center gap-2">
							<div class="flex h-8 w-8 items-center justify-center rounded-xl {active ? 'bg-coral/10 text-coral-dark' : 'bg-lavender/10 text-plum-light'}">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={tab.icon} /></svg>
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="truncate text-sm font-semibold">{tab.label}</span>
									{#if count !== null}
										<span class="ml-auto rounded-lg px-1.5 py-0.5 text-[10px] font-bold {active ? 'bg-coral/10 text-coral-dark' : 'bg-lavender/15 text-plum-light'}">{count}</span>
									{/if}
								</div>
								<p class="mt-0.5 hidden truncate text-[11px] text-plum-light lg:block">{tab.subtitle}</p>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</nav>

		<div class="min-w-0 flex-1">
			<div class="rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-lavender/10 backdrop-blur-xl sm:p-6">
				{#key data.full.series.id}
					{#if activeTab === 'main'}
						<SeriesMainSection series={data.full.series} genres={data.full.genres} gallery={data.full.gallery} reference={data.reference} onrefresh={refresh} />
					{:else if activeTab === 'cast'}
						<SeriesCastSection seriesId={data.full.series.id} cast={data.full.artists} reference={data.reference} onrefresh={refresh} />
					{:else if activeTab === 'episodes'}
						<SeriesEpisodesSection seriesId={data.full.series.id} episodes={data.full.episodes} reference={data.reference} onrefresh={refresh} />
					{:else if activeTab === 'schedule'}
						<SeriesScheduleSection seriesId={data.full.series.id} schedules={data.full.schedules} reference={data.reference} onrefresh={refresh} />
					{/if}
				{/key}
			</div>
		</div>
	</div>
</div>
